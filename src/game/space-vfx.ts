/**
 * space-vfx.ts — Three.quarks particle VFX system.
 *
 * Provides: engine trails, explosions, missile/torpedo trails, mine pulses.
 *
 * Source: github.com/Alchemist0823/three.quarks (MIT, 777 stars)
 * Installed via npm: three.quarks
 *
 * Architecture:
 *   One BatchedRenderer per scene — minimises draw calls via GPU instancing.
 *   Engine trails  → one ParticleSystem (Trail render) per thruster anchor.
 *   Explosions     → one-shot burst ParticleSystems, auto-destroyed.
 *   Mine warning   → pulsing PointLight + scale-animated sphere mesh.
 */

import * as THREE from 'three';
import {
  BatchedRenderer,
  ParticleSystem,
  ConstantValue,
  IntervalValue,
  ConstantColor,
  ColorOverLife,
  SizeOverLife,
  PointEmitter,
  SphereEmitter,
  RenderMode,
  PiecewiseBezier,
  Bezier,
  Gradient,
  ApplyForce,
  Vector4 as QVec4,
  Vector3 as QVec3,
} from 'three.quarks';

const WORLD_SCALE = 0.05;

// ── Helpers ─────────────────────────────────────────────────────────
function hexToVec4(hex: number, _alpha = 1): QVec4 {
  const r = ((hex >> 16) & 0xff) / 255;
  const g = ((hex >> 8) & 0xff) / 255;
  const b = (hex & 0xff) / 255;
  return new QVec4(r, g, b, _alpha);
}

function hexToVec3(hex: number): QVec3 {
  const r = ((hex >> 16) & 0xff) / 255;
  const g = ((hex >> 8) & 0xff) / 255;
  const b = (hex & 0xff) / 255;
  return new QVec3(r, g, b);
}

// Gradient fade: RGB from startColor to endColor, alpha 1→0
function fadeGrad(startRgb: QVec3, endRgb: QVec3): Gradient {
  return new Gradient(
    [
      [startRgb, 0],
      [endRgb, 1],
    ],
    [
      [1, 0],
      [0, 1],
    ], // alpha: full at t=0, zero at t=1
  );
}

function solidGrad(rgb: QVec3): Gradient {
  return new Gradient(
    [
      [rgb, 0],
      [rgb, 1],
    ],
    [
      [1, 0],
      [1, 1],
    ],
  );
}

// Fade-out curve: full opacity → 0 over lifetime
const FADE_OUT = new PiecewiseBezier([[new Bezier(1, 0.7, 0.3, 0), 0]]);
// Size shrink: start full, shrink to 0
const SHRINK = new PiecewiseBezier([[new Bezier(1, 0.6, 0.2, 0), 0]]);
// Expand-then-fade for explosions
const EXPAND_FADE = new PiecewiseBezier([[new Bezier(0.1, 0.8, 1.2, 0), 0]]);

// ── VFXSystem ────────────────────────────────────────────────────────

export class VFXSystem {
  private batchRenderer: BatchedRenderer;
  private scene: THREE.Scene;
  private clock = new THREE.Clock();

  /** shipId → array of engine-trail ParticleSystems */
  private engineTrails = new Map<number, ParticleSystem[]>();
  private engineAnchors = new Map<number, THREE.Group[]>();

  /** Active one-shot ParticleSystems (explosions, hits, etc.) */
  private oneShots: Array<{ ps: ParticleSystem; ttl: number }> = [];

  /** Mine warning meshes: mineId → { sphere, light } */
  private mineWarnings = new Map<number, { sphere: THREE.Mesh; light: THREE.PointLight }>();

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.batchRenderer = new BatchedRenderer();
    scene.add(this.batchRenderer);
  }

  // ── Engine Trails ────────────────────────────────────────────────

  /**
   * Attach engine-trail particle systems to a ship group.
   * Should be called once when the ship mesh is created.
   */
  attachEngineTrails(shipId: number, shipGroup: THREE.Group, teamColorHex: number, shipClass: string): void {
    if (this.engineTrails.has(shipId)) return; // already attached

    // Collect thruster anchor positions from existing thruster sprites
    const thrusterPositions: THREE.Vector3[] = [];
    shipGroup.traverse((child) => {
      if (child instanceof THREE.Sprite && (child.name === 'thruster' || child.name.startsWith('thruster_'))) {
        thrusterPositions.push(child.position.clone());
      }
    });

    // Fallback: one centred thruster if no anchors found
    if (thrusterPositions.length === 0) {
      const size = classSize(shipClass);
      thrusterPositions.push(new THREE.Vector3(0, 0, -size * 0.55));
    }

    const systems: ParticleSystem[] = [];
    const anchors: THREE.Group[] = [];

    for (const localPos of thrusterPositions) {
      // An anchor group positioned at the thruster, parented to the ship group
      const anchor = new THREE.Group();
      anchor.position.copy(localPos);
      shipGroup.add(anchor);
      anchors.push(anchor);

      // Outer glow trail (team colour, wider, slower fade)
      const outerPS = this.makeEngineTrail(anchor, teamColorHex, 0.25, 0.18, 0.45);
      // Hot-core trail (white, smaller, brighter)
      const corePS = this.makeEngineTrail(anchor, 0xffffff, 0.08, 0.25, 0.3);

      systems.push(outerPS, corePS);
    }

    this.engineTrails.set(shipId, systems);
    this.engineAnchors.set(shipId, anchors);
  }

  private makeEngineTrail(anchor: THREE.Group, colorHex: number, size: number, emitRate: number, lifetime: number): ParticleSystem {
    const rgb = hexToVec3(colorHex);
    const rgbFade = fadeGrad(rgb, rgb);
    const mat = new THREE.MeshBasicMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      color: new THREE.Color(rgb.x, rgb.y, rgb.z),
      side: THREE.DoubleSide,
    });

    const ps = new ParticleSystem({
      duration: 99999,
      looping: true,
      startLife: new ConstantValue(lifetime),
      startSpeed: new ConstantValue(0),
      startSize: new ConstantValue(size),
      startColor: new ConstantColor(new QVec4(rgb.x, rgb.y, rgb.z, 1)),
      worldSpace: true,
      emissionOverTime: new ConstantValue(emitRate * 60),
      shape: new PointEmitter(),
      material: mat,
      renderMode: RenderMode.Trail,
      rendererEmitterSettings: {
        startLength: new ConstantValue(size * 4),
        followLocalOrigin: false,
      },
      behaviors: [new SizeOverLife(SHRINK), new ColorOverLife(rgbFade)],
    });

    anchor.add(ps.emitter);
    this.batchRenderer.addSystem(ps);
    ps.emitter.setRotationFromEuler(new THREE.Euler(0, Math.PI, 0)); // emit backward
    return ps;
  }

  /** Enable/disable engine trails based on ship movement state. */
  setEngineActive(shipId: number, active: boolean, boost = false): void {
    const trails = this.engineTrails.get(shipId);
    if (!trails) return;
    const rate = active ? (boost ? 120 : 60) : 0;
    for (const ps of trails) {
      (ps.emissionOverTime as ConstantValue).value = rate;
    }
  }

  /** Remove all engine trails for a ship (on death/remove). */
  removeEngineTrails(shipId: number): void {
    const trails = this.engineTrails.get(shipId);
    if (trails) {
      for (const ps of trails) {
        this.batchRenderer.deleteSystem(ps);
        ps.emitter.parent?.remove(ps.emitter);
      }
      this.engineTrails.delete(shipId);
    }
    this.engineAnchors.delete(shipId);
  }

  // ── Explosions ───────────────────────────────────────────────────

  /**
   * Spawn an explosion burst at world position (game coords).
   * size: ship class size factor (fighters ~2.8, dreadnoughts ~8).
   */
  spawnExplosion(gx: number, gy: number, gz: number, size: number, teamColor = 0xff6622): void {
    const wx = gx * WORLD_SCALE;
    const wy = gz * WORLD_SCALE + 5;
    const wz = gy * WORLD_SCALE;

    const pos = new THREE.Vector3(wx, wy, wz);

    // Flash burst — bright white core
    this.spawnBurst(pos, 0xffffff, size * 0.3, size * 1.5, 30, 0.4);
    // Fireball — orange/red expanding cloud
    this.spawnBurst(pos, teamColor, size * 0.5, size * 2.0, 60, 0.8);
    // Debris chunks
    this.spawnDebris(pos, size);
  }

  private spawnBurst(pos: THREE.Vector3, colorHex: number, minSize: number, maxSize: number, count: number, lifetime: number): void {
    const rgb = hexToVec3(colorHex);
    const mat = new THREE.MeshBasicMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      color: new THREE.Color(rgb.x, rgb.y, rgb.z),
    });
    const endRgb = new QVec3(rgb.x * 0.5, rgb.y * 0.3, 0);

    const ps = new ParticleSystem({
      duration: 0.05,
      looping: false,
      startLife: new ConstantValue(lifetime),
      startSpeed: new IntervalValue(size(minSize), size(maxSize)),
      startSize: new IntervalValue(minSize * 0.5, maxSize * 0.5),
      startColor: new ConstantColor(new QVec4(rgb.x, rgb.y, rgb.z, 1)),
      worldSpace: true,
      emissionOverTime: new ConstantValue(0),
      emissionBursts: [{ time: 0, count: new ConstantValue(count), cycle: 1, interval: 0, probability: 1 }],
      shape: new SphereEmitter({ radius: minSize * 0.3, arc: Math.PI * 2, thickness: 1 }),
      material: mat,
      renderMode: RenderMode.BillBoard,
      behaviors: [new SizeOverLife(EXPAND_FADE), new ColorOverLife(fadeGrad(rgb, endRgb))],
    });

    const anchor = new THREE.Group();
    anchor.position.copy(pos);
    this.scene.add(anchor);
    anchor.add(ps.emitter);
    this.batchRenderer.addSystem(ps);

    this.oneShots.push({ ps, ttl: lifetime + 0.2 });
  }

  private spawnDebris(pos: THREE.Vector3, size: number): void {
    const startRgb = new QVec3(1.0, 0.67, 0.27); // #ffaa44
    const endRgb = new QVec3(0.6, 0.2, 0.0);
    const mat = new THREE.MeshBasicMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      color: 0xffaa44,
    });

    const ps = new ParticleSystem({
      duration: 0.05,
      looping: false,
      startLife: new IntervalValue(0.5, 1.2),
      startSpeed: new IntervalValue(size * 0.3, size * 1.8),
      startSize: new ConstantValue(size * 0.12),
      startColor: new ConstantColor(new QVec4(1.0, 0.67, 0.27, 1)),
      worldSpace: true,
      emissionOverTime: new ConstantValue(0),
      emissionBursts: [{ time: 0, count: new ConstantValue(20), cycle: 1, interval: 0, probability: 1 }],
      shape: new SphereEmitter({ radius: size * 0.1, arc: Math.PI * 2, thickness: 1 }),
      material: mat,
      renderMode: RenderMode.BillBoard,
      behaviors: [
        new SizeOverLife(SHRINK),
        new ColorOverLife(fadeGrad(startRgb, endRgb)),
        new ApplyForce(new QVec3(0, -1.5, 0), new ConstantValue(1)),
      ],
    });

    const anchor = new THREE.Group();
    anchor.position.copy(pos);
    this.scene.add(anchor);
    anchor.add(ps.emitter);
    this.batchRenderer.addSystem(ps);

    this.oneShots.push({ ps, ttl: 1.4 });
  }

  // ── Projectile Trails ────────────────────────────────────────────

  private projTrails = new Map<number, { ps: ParticleSystem; anchor: THREE.Group }>();

  /** Attach a ribbon trail to a projectile (call on creation). */
  attachProjectileTrail(projId: number, colorHex: number, type: string): void {
    if (this.projTrails.has(projId)) return;

    const isMissile = type === 'missile' || type === 'torpedo';
    const rgb = hexToVec3(colorHex);
    const mat = new THREE.MeshBasicMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      color: new THREE.Color(rgb.x, rgb.y, rgb.z),
      side: THREE.DoubleSide,
    });

    const ps = new ParticleSystem({
      duration: 99999,
      looping: true,
      startLife: new ConstantValue(isMissile ? 0.35 : 0.15),
      startSpeed: new ConstantValue(0),
      startSize: new ConstantValue(isMissile ? 0.3 : 0.12),
      startColor: new ConstantColor(new QVec4(rgb.x, rgb.y, rgb.z, 1)),
      worldSpace: true,
      emissionOverTime: new ConstantValue(120),
      shape: new PointEmitter(),
      material: mat,
      renderMode: RenderMode.Trail,
      rendererEmitterSettings: {
        startLength: new ConstantValue(isMissile ? 1.8 : 0.6),
        followLocalOrigin: false,
      },
      behaviors: [new ColorOverLife(fadeGrad(rgb, rgb))],
    });

    const anchor = new THREE.Group();
    this.scene.add(anchor);
    anchor.add(ps.emitter);
    this.batchRenderer.addSystem(ps);
    this.projTrails.set(projId, { ps, anchor });
  }

  /** Update projectile trail position (call every frame). */
  updateProjectileTrail(projId: number, gx: number, gy: number, gz: number): void {
    const trail = this.projTrails.get(projId);
    if (!trail) return;
    trail.anchor.position.set(gx * WORLD_SCALE, gz * WORLD_SCALE + 5, gy * WORLD_SCALE);
  }

  /** Remove projectile trail on hit/expire. */
  removeProjectileTrail(projId: number): void {
    const trail = this.projTrails.get(projId);
    if (!trail) return;
    this.batchRenderer.deleteSystem(trail.ps);
    this.scene.remove(trail.anchor);
    this.projTrails.delete(projId);
  }

  // ── Mine Warnings ────────────────────────────────────────────────

  /** Spawn a mine warning marker at game coords. */
  spawnMineWarning(mineId: number, gx: number, gy: number, teamColorHex: number): void {
    if (this.mineWarnings.has(mineId)) return;

    const col = new THREE.Color(teamColorHex);
    const sphere = new THREE.Mesh(
      new THREE.SphereGeometry(0.6, 16, 8),
      new THREE.MeshBasicMaterial({
        color: col,
        transparent: true,
        opacity: 0.25,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        wireframe: false,
      }),
    );
    sphere.renderOrder = 6;

    const light = new THREE.PointLight(teamColorHex, 0.6, 8);

    sphere.position.set(gx * WORLD_SCALE, 5, gy * WORLD_SCALE);
    light.position.copy(sphere.position);
    this.scene.add(sphere);
    this.scene.add(light);

    this.mineWarnings.set(mineId, { sphere, light });
  }

  updateMineWarning(mineId: number, t: number): void {
    const w = this.mineWarnings.get(mineId);
    if (!w) return;
    // Pulse: 2Hz blink
    const pulse = 0.18 + 0.12 * Math.abs(Math.sin(t * Math.PI * 2));
    (w.sphere.material as THREE.MeshBasicMaterial).opacity = pulse;
    const s = 0.9 + 0.2 * Math.abs(Math.sin(t * Math.PI * 2));
    w.sphere.scale.setScalar(s);
    w.light.intensity = pulse * 3;
  }

  removeMineWarning(mineId: number): void {
    const w = this.mineWarnings.get(mineId);
    if (!w) return;
    this.scene.remove(w.sphere);
    this.scene.remove(w.light);
    this.mineWarnings.delete(mineId);
  }

  // ── Main Update ──────────────────────────────────────────────────

  update(dt: number): void {
    this.batchRenderer.update(dt);

    // Cleanup one-shot systems
    for (let i = this.oneShots.length - 1; i >= 0; i--) {
      this.oneShots[i].ttl -= dt;
      if (this.oneShots[i].ttl <= 0) {
        const { ps } = this.oneShots[i];
        this.batchRenderer.deleteSystem(ps);
        ps.emitter.parent?.remove(ps.emitter);
        this.oneShots.splice(i, 1);
      }
    }
  }

  dispose(): void {
    this.scene.remove(this.batchRenderer);
    for (const trails of this.engineTrails.values()) {
      for (const ps of trails) this.batchRenderer.deleteSystem(ps);
    }
    for (const { ps } of this.oneShots) this.batchRenderer.deleteSystem(ps);
    for (const { ps, anchor } of this.projTrails.values()) {
      this.batchRenderer.deleteSystem(ps);
      this.scene.remove(anchor);
    }
    for (const { sphere, light } of this.mineWarnings.values()) {
      this.scene.remove(sphere);
      this.scene.remove(light);
    }
  }
}

// ── Helpers ─────────────────────────────────────────────────────────
function classSize(cls: string): number {
  switch (cls) {
    case 'dreadnought':
      return 8;
    case 'battleship':
      return 6;
    case 'carrier':
      return 5.5;
    case 'cruiser':
      return 5;
    case 'destroyer':
      return 4;
    default:
      return 2.8;
  }
}

// Avoid shadowing the built-in size variable in behaviors
function size(v: number): number {
  return v;
}
