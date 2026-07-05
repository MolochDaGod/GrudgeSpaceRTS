/**
 * Lightweight enemy AI state machine. Each dummy owns a brain that transitions
 * between idle/patrol (wander near home), chase (pursue the player once aggroed),
 * attack (hold at strike distance and face the player), and return (walk back to
 * home when the player breaks the leash). The brain only produces a desired
 * planar velocity + facing; the Dummy component applies it through a kinematic
 * Rapier body and keeps the authoritative position in worldPositions so the
 * existing distance-based combat systems keep working unchanged.
 */

export type AiState = "idle" | "patrol" | "chase" | "attack" | "return" | "stagger";
export type AiDisposition = "hostile" | "neutral" | "ally" | "boss";

export interface AiBrain {
  state: AiState;
  wanderX: number;
  wanderZ: number;
  nextWanderAt: number;
  nextStrikeAt: number;
  staggerUntil: number;
  phase: number;
}

export interface AiParams {
  disposition: AiDisposition;
  aggroRange: number;
  attackRange: number;
  leash: number;
  speed: number;
  wanderRadius: number;
  strikeCooldown: number;
  strikeDamage: number;
}

export interface AiStep {
  vx: number;
  vz: number;
  moving: boolean;
  /** Desired facing angle (atan2(dx,dz)) or null to keep current. */
  faceAngle: number | null;
  state: AiState;
  /** Wind-up telegraph for parry — player should react before strikeAt. */
  telegraph: boolean;
  strikeAt: number;
  strikeDamage: number;
}

export function createBrain(homeX: number, homeZ: number): AiBrain {
  return {
    state: "idle",
    wanderX: homeX,
    wanderZ: homeZ,
    nextWanderAt: 0,
    nextStrikeAt: 0,
    staggerUntil: 0,
    phase: 0,
  };
}

export function staggerBrain(brain: AiBrain, now: number, ms = 900) {
  brain.state = "stagger";
  brain.staggerUntil = now + ms;
}

function pickWander(brain: AiBrain, homeX: number, homeZ: number, radius: number, now: number) {
  const a = Math.random() * Math.PI * 2;
  const r = Math.random() * radius;
  brain.wanderX = homeX + Math.cos(a) * r;
  brain.wanderZ = homeZ + Math.sin(a) * r;
  brain.nextWanderAt = now + 2500 + Math.random() * 3500;
}

export function stepBrain(
  brain: AiBrain,
  params: AiParams,
  selfX: number,
  selfZ: number,
  homeX: number,
  homeZ: number,
  playerX: number,
  playerZ: number,
  now: number,
  alive: boolean,
): AiStep {
  const noStrike = { telegraph: false, strikeAt: 0, strikeDamage: 0 };

  if (!alive) {
    brain.state = "idle";
    return { vx: 0, vz: 0, moving: false, faceAngle: null, state: "idle", ...noStrike };
  }

  if (brain.state === "stagger") {
    if (now >= brain.staggerUntil) brain.state = "idle";
    return { vx: 0, vz: 0, moving: false, faceAngle: null, state: "stagger", ...noStrike };
  }

  const dpx = playerX - selfX;
  const dpz = playerZ - selfZ;
  const distPlayer = Math.hypot(dpx, dpz);
  const distHome = Math.hypot(selfX - homeX, selfZ - homeZ);

  // State transitions.
  if (brain.state === "chase" || brain.state === "attack") {
    if (distHome > params.leash) brain.state = "return";
    else if (distPlayer <= params.attackRange) brain.state = "attack";
    else if (distPlayer <= params.aggroRange) brain.state = "chase";
    else brain.state = "return";
  } else if (brain.state === "return") {
    if (distHome < 1.5) brain.state = "idle";
    else if (distPlayer <= params.aggroRange * 0.8 && distHome <= params.leash) brain.state = "chase";
  } else {
    // idle / patrol — neutrals never chase; allies only chase if boss-tagged params say so
    if (params.disposition === "hostile" || params.disposition === "boss") {
      if (distPlayer <= params.aggroRange && distHome <= params.leash) brain.state = "chase";
    }
  }

  switch (brain.state) {
    case "attack": {
      const faceAngle = distPlayer > 1e-3 ? Math.atan2(dpx, dpz) : null;
      let telegraph = false;
      let strikeAt = 0;
      if (now >= brain.nextStrikeAt && distPlayer <= params.attackRange + 0.5) {
        strikeAt = now + 420;
        brain.nextStrikeAt = now + params.strikeCooldown;
        telegraph = true;
      }
      return {
        vx: 0,
        vz: 0,
        moving: false,
        faceAngle,
        state: "attack",
        telegraph,
        strikeAt,
        strikeDamage: params.strikeDamage,
      };
    }
    case "chase": {
      // Stop a little short of the strike distance so we settle into attack.
      const stopAt = params.attackRange * 0.85;
      if (distPlayer <= stopAt || distPlayer < 1e-3) {
        return {
          vx: 0,
          vz: 0,
          moving: false,
          faceAngle: Math.atan2(dpx, dpz),
          state: "chase",
          ...noStrike,
        };
      }
      const nx = dpx / distPlayer;
      const nz = dpz / distPlayer;
      return {
        vx: nx * params.speed,
        vz: nz * params.speed,
        moving: true,
        faceAngle: Math.atan2(dpx, dpz),
        state: "chase",
        ...noStrike,
      };
    }
    case "return": {
      const dhx = homeX - selfX;
      const dhz = homeZ - selfZ;
      const d = Math.hypot(dhx, dhz) || 1;
      const nx = dhx / d;
      const nz = dhz / d;
      return {
        vx: nx * params.speed,
        vz: nz * params.speed,
        moving: true,
        faceAngle: Math.atan2(dhx, dhz),
        state: "return",
        ...noStrike,
      };
    }
    default: {
      // idle / patrol: wander lazily around home.
      if (now >= brain.nextWanderAt) pickWander(brain, homeX, homeZ, params.wanderRadius, now);
      const dwx = brain.wanderX - selfX;
      const dwz = brain.wanderZ - selfZ;
      const d = Math.hypot(dwx, dwz);
      if (d < 0.6) return { vx: 0, vz: 0, moving: false, faceAngle: null, state: "idle", ...noStrike };
      const nx = dwx / d;
      const nz = dwz / d;
      const slow = params.speed * 0.4;
      return {
        vx: nx * slow,
        vz: nz * slow,
        moving: true,
        faceAngle: Math.atan2(dwx, dwz),
        state: "patrol",
        ...noStrike,
      };
    }
  }
}
