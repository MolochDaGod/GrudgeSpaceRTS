import type { SpaceGameState, SpaceShip, SpaceStation, Planet, OrbitalTower, Projectile, SpriteEffect, PlayerResources, Team, Vec3, ExplosionType, ExplosionScale, HitFxType, ShipAbilityState } from './space-types';
import { SHIP_DEFINITIONS, TEAM_COLORS, EXPLOSION_SCALE_VALUES, MAP_WIDTH, MAP_HEIGHT } from './space-types';

export class SpaceEngine {
  state!: SpaceGameState;
  private aiWaveTimer = 30;
  private resourceTimer = 0;

  initGame() {
    this.state = {
      ships: new Map(),
      stations: new Map(),
      planets: this.generatePlanets(),
      towers: new Map(),
      projectiles: new Map(),
      spriteEffects: [],
      glbEffects: [],
      alerts: [],
      resources: {
        0: { credits: 0, energy: 0, minerals: 0, supply: 0, maxSupply: 0 },
        1: { credits: 500, energy: 200, minerals: 300, supply: 0, maxSupply: 50 },
        2: { credits: 500, energy: 200, minerals: 300, supply: 0, maxSupply: 50 },
      } as Record<Team, PlayerResources>,
      gameTime: 0, nextId: 1,
      selectedIds: new Set(),
      controlGroups: new Map(),
      gameOver: false, winner: null,
    };

    // Spawn player starting fleet near first planet
    const p0 = this.state.planets[0];
    this.spawnShip('red_fighter', 1 as Team, p0.x - 100, p0.y + 80);
    this.spawnShip('red_fighter', 1 as Team, p0.x - 100, p0.y + 120);
    this.spawnShip('red_fighter', 1 as Team, p0.x - 100, p0.y + 160);
    this.spawnShip('galactix_racer', 1 as Team, p0.x - 150, p0.y + 100);
    this.spawnShip('micro_recon', 1 as Team, p0.x - 180, p0.y + 130);
    this.spawnShip('dual_striker', 1 as Team, p0.x - 60, p0.y + 100);
    this.spawnShip('warship', 1 as Team, p0.x - 200, p0.y + 100);

    // Enemy starting fleet — IDENTICAL to player (fair, modern RTS)
    const pLast = this.state.planets[this.state.planets.length - 1];
    this.spawnShip('red_fighter', 2 as Team, pLast.x + 100, pLast.y - 80);
    this.spawnShip('red_fighter', 2 as Team, pLast.x + 100, pLast.y - 120);
    this.spawnShip('red_fighter', 2 as Team, pLast.x + 100, pLast.y - 160);
    this.spawnShip('galactix_racer', 2 as Team, pLast.x + 150, pLast.y - 100);
    this.spawnShip('micro_recon', 2 as Team, pLast.x + 180, pLast.y - 130);
    this.spawnShip('dual_striker', 2 as Team, pLast.x + 60, pLast.y - 100);
    this.spawnShip('warship', 2 as Team, pLast.x + 200, pLast.y - 100);

    // Enable autocast on all enemy abilities for competent AI play
    for (const [, ship] of this.state.ships) {
      if (ship.team === 2) {
        for (const ab of ship.abilities) ab.autoCast = true;
      }
    }
  }

  private generatePlanets(): Planet[] {
    const names = ['Terra Nova', 'Helios Prime', 'Voidreach', 'Crux Station', 'Nebula Gate', 'Iron Forge', 'Starfall'];
    const colors = [0x4488cc, 0xcc6644, 0x88aa44, 0xaa44cc, 0x44ccaa, 0xccaa44, 0x6666cc];
    return names.map((name, i) => ({
      id: i,
      x: (i % 3 - 1) * 800 + (Math.random() - 0.5) * 200,
      y: (Math.floor(i / 3) - 1) * 800 + (Math.random() - 0.5) * 200,
      z: 0,
      radius: 60 + Math.random() * 40,
      name,
      owner: 0 as Team,
      stationId: null,
      resourceYield: { credits: 10 + i * 5, energy: 5 + i * 3, minerals: 8 + i * 4 },
      color: colors[i],
      hasAsteroidField: i % 2 === 1,
    }));
  }

  private spawnShip(type: string, team: Team, x: number, y: number): SpaceShip {
    const def = SHIP_DEFINITIONS[type];
    if (!def) throw new Error(`Unknown ship type: ${type}`);
    const id = this.state.nextId++;
    const s = def.stats;
    const ship: SpaceShip = {
      id, x, y, z: 0, team, hp: s.maxHp, maxHp: s.maxHp, dead: false,
      shipType: type, shipClass: def.class,
      shield: s.maxShield, maxShield: s.maxShield, shieldRegen: s.shieldRegen,
      armor: s.armor, speed: s.speed, turnRate: s.turnRate,
      vx: 0, vy: 0, vz: 0, facing: team === 1 ? 0 : Math.PI, pitch: 0, roll: 0,
      targetId: null, moveTarget: null, attackMoveTarget: null,
      isAttackMoving: false, holdPosition: false, patrolPoints: [], patrolIndex: 0,
      attackDamage: s.attackDamage, attackRange: s.attackRange,
      attackCooldown: s.attackCooldown, attackTimer: 0, attackType: s.attackType,
      supplyCost: s.supplyCost,
      abilities: (s.abilities || []).map(a => ({ ability: a, cooldownRemaining: 0, active: false, activeTimer: 0, autoCast: false })),
      animState: 'idle', animTimer: Math.random() * 10,
      selected: false, controlGroup: 0, stationId: null,
      orbitTarget: null, orbitRadius: 0, orbitAngle: 0,
      isDocked: false, damageLevel: 0,
    };
    this.state.ships.set(id, ship);
    return ship;
  }

  update(dt: number) {
    if (this.state.gameOver) return;
    this.state.gameTime += dt;

    this.updateShips(dt);
    this.updateProjectiles(dt);
    this.updateEffects(dt);
    this.updateResources(dt);
    this.updateAIBehavior(dt);
    this.cleanupDead();
  }

  private updateShips(dt: number) {
    for (const [id, ship] of this.state.ships) {
      if (ship.dead) continue;
      ship.animTimer += dt;
      ship.attackTimer = Math.max(0, ship.attackTimer - dt);

      // Shield regen
      ship.shield = Math.min(ship.maxShield, ship.shield + ship.shieldRegen * dt);
      ship.damageLevel = 1 - ship.hp / ship.maxHp;

      // Movement
      if (ship.moveTarget && !ship.holdPosition) {
        const dx = ship.moveTarget.x - ship.x;
        const dy = ship.moveTarget.y - ship.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 10) {
          const targetAngle = Math.atan2(dy, dx);
          ship.facing = lerpAngle(ship.facing, targetAngle, ship.turnRate * dt);
          ship.x += Math.cos(ship.facing) * ship.speed * dt;
          ship.y += Math.sin(ship.facing) * ship.speed * dt;
          ship.animState = 'moving';
          // Banking on turns
          const angleDiff = angleDelta(ship.facing, targetAngle);
          ship.roll = angleDiff * 2;
        } else {
          ship.moveTarget = null;
          ship.animState = 'idle';
        }
      } else if (!ship.targetId) {
        ship.animState = 'idle';
      }

      // Auto-acquire target
      if (!ship.targetId && !ship.holdPosition) {
        const nearest = this.findNearestEnemy(ship);
        if (nearest && this.dist(ship, nearest) < ship.attackRange * 1.5) {
          ship.targetId = nearest.id;
        }
      }

      // Combat
      if (ship.targetId) {
        const target = this.state.ships.get(ship.targetId);
        if (!target || target.dead) {
          ship.targetId = null;
        } else {
          const d = this.dist(ship, target);
          if (d > ship.attackRange) {
            // Move toward target
            if (!ship.holdPosition) {
              const angle = Math.atan2(target.y - ship.y, target.x - ship.x);
              ship.facing = lerpAngle(ship.facing, angle, ship.turnRate * dt);
              ship.x += Math.cos(ship.facing) * ship.speed * dt;
              ship.y += Math.sin(ship.facing) * ship.speed * dt;
              ship.animState = 'moving';
            }
          } else if (ship.attackTimer <= 0) {
            // Fire!
            this.fireProjectile(ship, target);
            ship.attackTimer = ship.attackCooldown;
            ship.animState = 'attacking';
            ship.animTimer = 0;
          }
        }
      }

      // Ability cooldowns + autocast
      for (const ab of ship.abilities) {
        ab.cooldownRemaining = Math.max(0, ab.cooldownRemaining - dt);
        if (ab.active) {
          ab.activeTimer -= dt;
          if (ab.activeTimer <= 0) ab.active = false;
        }
        // Autocast: fire ability when off cooldown, in combat, and has energy
        if (ab.autoCast && !ab.active && ab.cooldownRemaining <= 0 && ship.targetId !== null) {
          const res = this.state.resources[ship.team];
          if (res && res.energy >= ab.ability.energyCost) {
            ab.active = true;
            ab.activeTimer = ab.ability.duration;
            ab.cooldownRemaining = ab.ability.cooldown;
            res.energy -= ab.ability.energyCost;
            // Apply ability animation state
            if (ab.ability.type === 'barrel_roll') ship.animState = 'barrel_roll';
            else if (ab.ability.type === 'speed_boost') ship.animState = 'speed_boost';
            else if (ab.ability.type === 'cloak') ship.animState = 'cloaked';
            else if (ab.ability.type === 'warp') ship.animState = 'warping';
            else if (ab.ability.type === 'iron_dome') {
              this.spawnSpriteEffect(ship.x, ship.y, 0, 'waveform', 3.0);
            } else if (ab.ability.type === 'emp') {
              this.spawnSpriteEffect(ship.x, ship.y, 0, 'spark', 2.5);
            } else if (ab.ability.type === 'ram') {
              ship.speed *= 2.5;
              setTimeout(() => { ship.speed = SHIP_DEFINITIONS[ship.shipType]?.stats.speed ?? ship.speed; }, ab.ability.duration * 1000);
            }
            ship.animTimer = 0;
          }
        }
      }
    }
  }

  private fireProjectile(source: SpaceShip, target: SpaceShip) {
    const id = this.state.nextId++;
    const angle = Math.atan2(target.y - source.y, target.x - source.x);
    const speed = source.attackType === 'missile' ? 300 : source.attackType === 'railgun' ? 600 : 400;
    const proj: Projectile = {
      id,
      x: source.x, y: source.y, z: source.z,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      vz: 0,
      team: source.team,
      damage: source.attackDamage,
      type: source.attackType as Projectile['type'],
      sourceId: source.id,
      targetId: target.id,
      speed,
      lifetime: 0,
      maxLifetime: 3,
      homing: source.attackType === 'missile',
      homingStrength: 3,
      trailColor: source.team === 1 ? 0x4488ff : 0xff4444,
    };
    this.state.projectiles.set(id, proj);
  }

  private updateProjectiles(dt: number) {
    for (const [id, proj] of this.state.projectiles) {
      proj.lifetime += dt;
      if (proj.lifetime > proj.maxLifetime) {
        this.state.projectiles.delete(id);
        continue;
      }

      // Homing
      if (proj.homing) {
        const target = this.state.ships.get(proj.targetId);
        if (target && !target.dead) {
          const angle = Math.atan2(target.y - proj.y, target.x - proj.x);
          const curAngle = Math.atan2(proj.vy, proj.vx);
          const newAngle = lerpAngle(curAngle, angle, proj.homingStrength * dt);
          proj.vx = Math.cos(newAngle) * proj.speed;
          proj.vy = Math.sin(newAngle) * proj.speed;
        }
      }

      proj.x += proj.vx * dt;
      proj.y += proj.vy * dt;
      proj.z += proj.vz * dt;

      // Hit detection
      const target = this.state.ships.get(proj.targetId);
      if (target && !target.dead) {
        const d = Math.sqrt((proj.x - target.x) ** 2 + (proj.y - target.y) ** 2);
        if (d < 20) {
          this.applyDamage(target, proj.damage);
          this.state.projectiles.delete(id);

          // Spawn hit effect
          const hitTypes: HitFxType[] = ['hits-1', 'hits-2', 'hits-3', 'hits-4', 'hits-5', 'hits-6'];
          this.spawnSpriteEffect(target.x, target.y, 0, hitTypes[Math.floor(Math.random() * 6)], 0.6);

          // Spawn explosion on kill
          if (target.dead) {
            const expType: ExplosionType = target.shipClass === 'battleship' ? 'explosion-1-e'
              : target.shipClass === 'cruiser' || target.shipClass === 'destroyer' ? 'explosion-1-d'
              : 'explosion-1-b';
            const scale = target.shipClass === 'battleship' ? 4.0
              : target.shipClass === 'cruiser' ? 2.0 : 1.0;
            this.spawnSpriteEffect(target.x, target.y, 0, expType, scale);
          }
        }
      }
    }
  }

  private applyDamage(ship: SpaceShip, damage: number) {
    let remaining = damage;
    // Shield absorbs first
    if (ship.shield > 0) {
      const absorbed = Math.min(ship.shield, remaining);
      ship.shield -= absorbed;
      remaining -= absorbed;
    }
    // Armor reduces
    remaining = Math.max(0, remaining - ship.armor);
    ship.hp -= remaining;
    if (ship.hp <= 0) {
      ship.hp = 0;
      ship.dead = true;
      ship.animState = 'death_spiral';
    }
  }

  private spawnSpriteEffect(x: number, y: number, z: number, type: string, scale: number) {
    const spriteDef = this.getSpriteFrameCount(type);
    const effect: SpriteEffect = {
      id: this.state.nextId++, x, y, z, type: type as SpriteEffect['type'],
      scale, frame: 0, totalFrames: spriteDef,
      frameTimer: 0, frameDuration: 0.06, done: false, rotation: Math.random() * Math.PI * 2,
    };
    this.state.spriteEffects.push(effect);
  }

  private getSpriteFrameCount(type: string): number {
    const counts: Record<string, number> = {
      'explosion-1-a': 8, 'explosion-1-b': 8, 'explosion-1-c': 10, 'explosion-1-d': 12,
      'explosion-1-e': 22, 'explosion-1-f': 8, 'explosion-1-g': 7, 'explosion-b': 12,
      'bolt': 4, 'charged': 6, 'crossed': 6, 'pulse': 4, 'spark': 5, 'waveform': 4,
      'hits-1': 5, 'hits-2': 7, 'hits-3': 5, 'hits-4': 7, 'hits-5': 7, 'hits-6': 7,
    };
    return counts[type] || 8;
  }

  private updateEffects(dt: number) {
    for (const effect of this.state.spriteEffects) {
      if (effect.done) continue;
      effect.frameTimer += dt;
      if (effect.frameTimer >= effect.frameDuration) {
        effect.frameTimer = 0;
        effect.frame++;
        if (effect.frame >= effect.totalFrames) effect.done = true;
      }
    }
    this.state.spriteEffects = this.state.spriteEffects.filter(e => !e.done);
  }

  private updateResources(dt: number) {
    this.resourceTimer += dt;
    if (this.resourceTimer >= 1) {
      this.resourceTimer = 0;
      // Passive income for owned planets
      for (const planet of this.state.planets) {
        if (planet.owner !== 0) {
          const res = this.state.resources[planet.owner];
          res.credits += planet.resourceYield.credits;
          res.energy += planet.resourceYield.energy;
          res.minerals += planet.resourceYield.minerals;
        }
      }
    }
  }

  /** AI behavior — no spawning, just smart use of existing units */
  private updateAIBehavior(dt: number) {
    this.aiWaveTimer -= dt;
    if (this.aiWaveTimer <= 0) {
      this.aiWaveTimer = 8 + Math.random() * 6;

      // Count forces
      let aiCount = 0, playerCount = 0;
      for (const [, s] of this.state.ships) {
        if (s.dead) continue;
        if (s.team === 2) aiCount++;
        if (s.team === 1) playerCount++;
      }

      // Find nearest player ship to rally toward
      let rallyX = 0, rallyY = 0;
      let found = false;
      for (const [, s] of this.state.ships) {
        if (s.dead || s.team !== 1) continue;
        rallyX = s.x; rallyY = s.y; found = true; break;
      }
      if (!found) return; // player has no ships

      // AI attack-moves idle ships toward nearest player unit
      for (const [, ship] of this.state.ships) {
        if (ship.dead || ship.team !== 2) continue;
        if (!ship.moveTarget && !ship.targetId) {
          ship.moveTarget = {
            x: rallyX + (Math.random() - 0.5) * 200,
            y: rallyY + (Math.random() - 0.5) * 200,
            z: 0,
          };
          ship.isAttackMoving = true;
        }
      }
    }
  }

  private cleanupDead() {
    for (const [id, ship] of this.state.ships) {
      if (ship.dead && ship.animTimer > 3) {
        this.state.ships.delete(id);
      }
    }
  }

  private findNearestEnemy(ship: SpaceShip): SpaceShip | null {
    let best: SpaceShip | null = null;
    let bestDist = Infinity;
    for (const [, other] of this.state.ships) {
      if (other.dead || other.team === ship.team || other.team === 0) continue;
      const d = this.dist(ship, other);
      if (d < bestDist) { bestDist = d; best = other; }
    }
    return best;
  }

  private dist(a: { x: number; y: number }, b: { x: number; y: number }): number {
    return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
  }
}

// ── Helpers ──────────────────────────────────────────────────────
function lerpAngle(a: number, b: number, t: number): number {
  let diff = b - a;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  return a + diff * Math.min(t, 1);
}

function angleDelta(a: number, b: number): number {
  let diff = b - a;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  return diff;
}
