/**
 * GalaxyMap.tsx — Interactive 3D galaxy with 9 star systems.
 *
 * Uses React Three Fiber + custom GPU particle shader for spiral arms.
 * Player's home system is lit; 8 others are greyed/locked.
 * Doubles as a loading screen: camera wanders, then zoom-rushes to target.
 */

import { useRef, useMemo, useCallback, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Text } from '@react-three/drei';
import * as THREE from 'three';

// ── System Data ─────────────────────────────────────────────────
export type SystemFaction = 'wisdom' | 'construct' | 'void' | 'legion' | 'boss' | 'player';

export interface StarSystem {
  id: string;
  name: string;
  position: [number, number, number];
  color: string;
  faction: SystemFaction;
  locked: boolean;
  description: string;
}

/**
 * 9 galactic systems:
 *  - Grudge Prime: player home (always unlocked)
 *  - 2× Wisdom, 2× Construct, 2× Void, 2× Legion: faction-held, capturable
 *  - 1× The Maw: boss fight planet (endgame)
 *
 * All locked systems greyed out until player conquers their home system in campaign.
 */
export const STAR_SYSTEMS: StarSystem[] = [
  // Player home
  { id: 'grudge_prime',    name: 'Grudge Prime',       position: [0, 0.2, 0],       color: '#4488ff', faction: 'player',    locked: false, description: 'Your homeworld — start here' },
  // Wisdom (blue-cyan)
  { id: 'wisdom_spire',    name: 'Wisdom Spire',       position: [-2.8, 0.1, 2.5],  color: '#44ccff', faction: 'wisdom',    locked: true, description: 'Seat of the Wisdom faction — research bonus' },
  { id: 'prisma_reach',    name: 'Prisma Reach',       position: [-3.8, -0.1, -0.5],color: '#66ddff', faction: 'wisdom',    locked: true, description: 'Wisdom outpost — scanner arrays' },
  // Construct (gold-orange)
  { id: 'forge_bastion',   name: 'Forge Bastion',      position: [3.2, -0.1, -1.5], color: '#ffaa22', faction: 'construct', locked: true, description: 'Construct capital — build speed +25%' },
  { id: 'anvil_yard',      name: 'Anvil Yard',         position: [4.0, 0.2, 1.5],   color: '#ffcc44', faction: 'construct', locked: true, description: 'Construct shipyard — heavy hulls' },
  // Void (purple)
  { id: 'void_reach',      name: 'Void Reach',         position: [-3.0, 0.3, -2.5], color: '#aa44ff', faction: 'void',      locked: true, description: 'Void nexus — dark energy powers' },
  { id: 'shadow_drift',    name: 'Shadow Drift',       position: [-1.5, -0.2, -3.8],color: '#8833cc', faction: 'void',      locked: true, description: 'Void relay — cloak duration +50%' },
  // Legion (red)
  { id: 'legion_wake',     name: "Legion's Wake",      position: [2.5, 0.1, 2.8],   color: '#ff4444', faction: 'legion',    locked: true, description: 'Legion stronghold — fleet supply +30%' },
  { id: 'warcry_front',    name: 'Warcry Front',       position: [1.5, -0.3, -2.0], color: '#ff6644', faction: 'legion',    locked: true, description: 'Legion barracks — veteran crews' },
  // Boss
  // { id: 'the_maw',      name: 'The Maw',            position: [0, 0.5, -5],      color: '#ff2200', faction: 'boss',      locked: true, description: 'Ancient threat — conquer all factions first' },
];

// ── Galaxy Particle Shader (trinketmage-inspired spiral arms) ───
const GALAXY_VERTEX = /* glsl */ `
  precision highp float;
  attribute float size;
  attribute vec3 seed;
  uniform float uTime;
  uniform float uBranches;
  uniform float uRadius;
  uniform float uSpin;
  uniform float uRandomness;
  uniform float uSize;
  varying vec3 vColor;

  // Simple pseudo-random
  float rand(vec2 co) {
    return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453);
  }

  void main() {
    float t = position.x; // 0..1 parameter along the arm
    float angle = t * uSpin + seed.x * 6.28318;
    float branchAngle = floor(seed.y * uBranches) / uBranches * 6.28318;
    float radius = t * uRadius;

    // Randomness (scatter from arm center)
    float rx = pow(seed.x, 3.0) * (seed.z > 0.5 ? 1.0 : -1.0) * uRandomness * radius;
    float ry = pow(seed.y, 3.0) * (seed.x > 0.5 ? 1.0 : -1.0) * uRandomness * radius * 0.3;
    float rz = pow(seed.z, 3.0) * (seed.y > 0.5 ? 1.0 : -1.0) * uRandomness * radius;

    vec3 pos;
    pos.x = cos(angle + branchAngle) * radius + rx;
    pos.y = ry;
    pos.z = sin(angle + branchAngle) * radius + rz;

    // Slow rotation
    float rot = uTime * 0.05;
    float ca = cos(rot), sa = sin(rot);
    vec3 rotated = vec3(pos.x * ca - pos.z * sa, pos.y, pos.x * sa + pos.z * ca);

    vec4 mvPos = modelViewMatrix * vec4(rotated, 1.0);
    gl_Position = projectionMatrix * mvPos;
    gl_PointSize = size * uSize * (200.0 / -mvPos.z);

    // Color: inner hot orange → outer cool purple
    vec3 colorInn = vec3(1.0, 0.4, 0.1);
    vec3 colorOut = vec3(0.5, 0.3, 1.0);
    vColor = mix(colorInn, colorOut, t);
  }
`;

const GALAXY_FRAGMENT = /* glsl */ `
  precision highp float;
  varying vec3 vColor;

  void main() {
    // Soft circular point with glow
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5) discard;
    float alpha = 1.0 - smoothstep(0.0, 0.5, d);
    alpha *= 0.7;
    gl_FragColor = vec4(vColor, alpha);
  }
`;

// ── Galaxy Particles Component ──────────────────────────────────
const PARTICLE_COUNT = 128 * 128;

function GalaxyParticles() {
  const meshRef = useRef<THREE.Points>(null!);
  const materialRef = useRef<THREE.ShaderMaterial>(null!);

  const { positions, sizes, seeds } = useMemo(() => {
    const p = new Float32Array(PARTICLE_COUNT * 3);
    const s = new Float32Array(PARTICLE_COUNT);
    const sd = new Float32Array(PARTICLE_COUNT * 3);
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      p[i * 3] = i / PARTICLE_COUNT; // t parameter 0..1
      p[i * 3 + 1] = 0;
      p[i * 3 + 2] = 0;
      s[i] = Math.random() * 1.5 + 0.5;
      sd[i * 3] = Math.random();
      sd[i * 3 + 1] = Math.random();
      sd[i * 3 + 2] = Math.random();
    }
    return { positions: p, sizes: s, seeds: sd };
  }, []);

  useFrame(({ clock }) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = clock.getElapsedTime();
    }
  });

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-size" args={[sizes, 1]} />
        <bufferAttribute attach="attributes-seed" args={[seeds, 3]} />
      </bufferGeometry>
      <shaderMaterial
        ref={materialRef}
        vertexShader={GALAXY_VERTEX}
        fragmentShader={GALAXY_FRAGMENT}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        uniforms={{
          uTime: { value: 0 },
          uSize: { value: 2.0 },
          uBranches: { value: 4 },
          uRadius: { value: 5 },
          uSpin: { value: Math.PI * 1.5 },
          uRandomness: { value: 0.5 },
        }}
      />
    </points>
  );
}

// ── System Node (glowing sphere + label) ────────────────────────
function SystemNode({
  system,
  onClick,
  hovered,
  onHover,
}: {
  system: StarSystem;
  onClick?: (id: string) => void;
  hovered: boolean;
  onHover: (id: string | null) => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const baseScale = system.locked ? 0.08 : 0.14;

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const pulse = 1 + Math.sin(clock.getElapsedTime() * 2 + system.position[0]) * 0.1;
    const s = hovered ? baseScale * 1.5 : baseScale * pulse;
    meshRef.current.scale.setScalar(s);
  });

  const color = system.locked ? '#333344' : system.color;
  const emissive = system.locked ? '#111122' : system.color;

  return (
    <group position={system.position}>
      <mesh
        ref={meshRef}
        onClick={(e) => {
          e.stopPropagation();
          if (!system.locked && onClick) onClick(system.id);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          onHover(system.id);
          document.body.style.cursor = system.locked ? 'not-allowed' : 'pointer';
        }}
        onPointerOut={() => {
          onHover(null);
          document.body.style.cursor = 'default';
        }}
      >
        <sphereGeometry args={[1, 16, 16]} />
        <meshStandardMaterial
          color={color}
          emissive={emissive}
          emissiveIntensity={system.locked ? 0.2 : 1.5}
          toneMapped={false}
        />
      </mesh>
      {/* Glow ring */}
      {!system.locked && (
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.16, 0.22, 32]} />
          <meshBasicMaterial
            color={system.color}
            transparent
            opacity={0.3}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}
      {/* Label */}
      <Text
        position={[0, system.locked ? -0.18 : -0.24, 0]}
        fontSize={0.09}
        color={system.locked ? '#444455' : '#ffffff'}
        anchorX="center"
        anchorY="top"
        outlineWidth={0.004}
        outlineColor="#000000"
      >
        {system.name}
        {system.locked ? ' 🔒' : ''}
      </Text>
    </group>
  );
}

// ── Camera Controller (idle wander + zoom transition) ───────────
function CameraRig({
  zoomTarget,
  onZoomComplete,
}: {
  zoomTarget: [number, number, number] | null;
  onZoomComplete?: () => void;
}) {
  const { camera } = useThree();
  const phaseRef = useRef<'idle' | 'search' | 'zoom' | 'done'>('idle');
  const timerRef = useRef(0);
  const startPosRef = useRef(new THREE.Vector3());
  const targetPosRef = useRef(new THREE.Vector3());

  useEffect(() => {
    if (zoomTarget) {
      phaseRef.current = 'search';
      timerRef.current = 0;
      startPosRef.current.copy(camera.position);
      // Target: close to the system node, offset above
      targetPosRef.current.set(zoomTarget[0], zoomTarget[1] + 0.5, zoomTarget[2] + 0.8);
    }
  }, [zoomTarget, camera]);

  useFrame((_, dt) => {
    const phase = phaseRef.current;
    if (phase === 'idle') {
      // Gentle orbit
      const t = performance.now() * 0.0001;
      camera.position.x = Math.cos(t) * 8;
      camera.position.z = Math.sin(t) * 8;
      camera.position.y = 3 + Math.sin(t * 0.7) * 0.5;
      camera.lookAt(0, 0, 0);
      return;
    }

    timerRef.current += dt;

    if (phase === 'search') {
      // Pan around for 1.5s
      const t = Math.min(timerRef.current / 1.5, 1);
      const searchAngle = Math.PI * 0.3 * t;
      camera.position.x = startPosRef.current.x + Math.sin(searchAngle) * 2;
      camera.position.z = startPosRef.current.z + Math.cos(searchAngle) * 1;
      camera.lookAt(0, 0, 0);
      if (t >= 1) {
        phaseRef.current = 'zoom';
        timerRef.current = 0;
        startPosRef.current.copy(camera.position);
      }
    } else if (phase === 'zoom') {
      // Rapid zoom into target over 1s with easeInCubic
      const t = Math.min(timerRef.current / 1.0, 1);
      const ease = t * t * t; // easeInCubic — slow start, fast end
      camera.position.lerpVectors(startPosRef.current, targetPosRef.current, ease);
      camera.lookAt(
        targetPosRef.current.x,
        targetPosRef.current.y - 0.5,
        targetPosRef.current.z - 0.8,
      );
      if (t >= 1) {
        phaseRef.current = 'done';
        onZoomComplete?.();
      }
    }
  });

  return null;
}

// ── Main Galaxy Map Component ───────────────────────────────────
interface GalaxyMapProps {
  onSelectSystem?: (systemId: string) => void;
  /** Set to a system position to trigger zoom-in loading transition. */
  zoomTarget?: [number, number, number] | null;
  onZoomComplete?: () => void;
  /** If true, disables OrbitControls (during zoom transitions). */
  controlsDisabled?: boolean;
}

export function GalaxyMap({
  onSelectSystem,
  zoomTarget = null,
  onZoomComplete,
  controlsDisabled = false,
}: GalaxyMapProps) {
  const [hoveredSystem, setHoveredSystem] = useState<string | null>(null);

  return (
    <Canvas
      camera={{ position: [0, 3, 8], fov: 60, near: 0.1, far: 100 }}
      style={{ position: 'absolute', inset: 0, background: '#010308' }}
      gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
    >
      {/* Lighting */}
      <ambientLight intensity={0.15} />
      <pointLight position={[0, 2, 0]} intensity={2} color="#4488ff" distance={20} />

      {/* Galaxy particle spiral */}
      <GalaxyParticles />

      {/* System nodes */}
      {STAR_SYSTEMS.map((sys) => (
        <SystemNode
          key={sys.id}
          system={sys}
          onClick={onSelectSystem}
          hovered={hoveredSystem === sys.id}
          onHover={setHoveredSystem}
        />
      ))}

      {/* Camera control */}
      {zoomTarget ? (
        <CameraRig zoomTarget={zoomTarget} onZoomComplete={onZoomComplete} />
      ) : (
        <>
          <CameraRig zoomTarget={null} />
          {!controlsDisabled && (
            <OrbitControls
              enableZoom
              enablePan={false}
              minDistance={3}
              maxDistance={15}
              maxPolarAngle={Math.PI * 0.45}
              autoRotate
              autoRotateSpeed={0.3}
            />
          )}
        </>
      )}
    </Canvas>
  );
}
