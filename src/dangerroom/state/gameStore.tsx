import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
} from "react";
import type { ReactNode } from "react";
import type { Ability, ClassDef } from "../data/types";
import { ANIMAL_SPAWNS, DUMMY_SPAWNS, worldPositions } from "./world";
import {
  poolsFromNexus,
  primaryResourceFromStats,
  type NexusStats,
  emptyNexusStats,
} from "../nexus/attributes";
import {
  resolveLoadout,
  sumLoadoutBonuses,
  type NexusItemDef,
} from "../nexus/items";
import { getOrigin, applyOriginSeeds } from "../nexus/origins";
import { buildSurvivorProfile } from "../nexus/survivalCombat";
import { getNexusToonByKey } from "../nexus/nexusToons";
import { combatAim } from "./combatAim";
import {
  BLOCK_DAMAGE_MULT,
  RIPOSTE_DAMAGE_MULT,
  combatParry,
  clearIncomingStrike,
} from "./combatParry";
import { fireBlockParryVfx, strikeContactPoint } from "./blockParryVfx";
import { fireClash } from "./combatClash";
import {
  isAerialSlam,
  isHeavyHit,
  launchEnemy,
} from "./combatKnockback";
import { fireGroundImpactVfx } from "./impactVfx";
import { playerMode } from "./playerMode";
import { combatTimeScale, devSettings } from "./devSettings";
import { buildMMImpulse, resolveAbilityMM } from "./mmScale";

export interface DummyState {
  id: string;
  name: string;
  hp: number;
  maxHp: number;
  alive: boolean;
  respawnAt: number | null;
  flashUntil: number;
  /** "enemy" dummies count as kills; "animal" entities drop skins (loot). */
  kind: "enemy" | "animal";
  /** Skin/pelt granted when an animal is killed. */
  loot?: string;
}

export interface DamageNumber {
  id: string;
  targetId: "player" | string;
  amount: number;
  color: string;
  crit: boolean;
  createdAt: number;
}

export interface VfxEvent {
  id: string;
  kind: "melee" | "ranged" | "heal" | "shield" | "dash";
  color: string;
  fromId: "player";
  toId: string | null;
  createdAt: number;
}

export interface LogEntry {
  id: string;
  text: string;
  createdAt: number;
}

interface GameState {
  /** Always `survivor` when deployed — no class roles. */
  classId: string | null;
  /** Nexus toon key `gender:bodyId`. */
  raceId: string | null;
  /** Survival origin id (military, medic, …). */
  originId: string | null;
  hp: number;
  maxHp: number;
  resource: number;
  maxResource: number;
  shield: number;
  shieldUntil: number;
  speedMultiplier: number;
  speedMultiplierUntil: number;
  manaRegenBonus: number;
  manaRegenBonusUntil: number;
  cooldownReadyAt: Record<string, number>;
  dotEffects: { targetId: string; power: number; tickEvery: number; nextTickAt: number; endsAt: number }[];
  targetId: string | null;
  dummies: Record<string, DummyState>;
  damageNumbers: DamageNumber[];
  vfx: VfxEvent[];
  log: LogEntry[];
  kills: number;
  pelts: number;
  swingUntil: number;
  lastAbilityAnimation: string;
  /** Increments on every ability use so one-shot attack clips restart from frame 0. */
  swingSeq: number;
  /** Nexus 8-stat allocation (survival SSOT). */
  nexusStats: NexusStats;
  /** Equipped / bag item ids. */
  inventory: string[];
  loadout: NexusItemDef[];
  /** Flat damage bonus from gear + nexus phys/mag blend. */
  damageBonus: number;
  armorBonus: number;
}

type Action =
  | {
      type: "DEPLOY_SURVIVOR";
      toonKey: string;
      originId: string;
      nexusStats: NexusStats;
    }
  | { type: "SET_TARGET"; targetId: string | null }
  | { type: "USE_ABILITY"; ability: Ability; now: number; inRange: boolean }
  | { type: "TICK"; now: number; dt: number }
  | { type: "RESET_DUMMY"; id: string }
  | { type: "REMOVE_DAMAGE_NUMBER"; id: string }
  | { type: "REMOVE_VFX"; id: string }
  | { type: "ENEMY_STRIKE"; attackerId: string; attackerName: string; damage: number; now: number }
  | { type: "IMPACT_DAMAGE"; targetId: string; amount: number; label: string; now: number };

function freshDummies(): Record<string, DummyState> {
  const record: Record<string, DummyState> = {};
  for (const spawn of DUMMY_SPAWNS) {
    record[spawn.id] = {
      id: spawn.id,
      name: spawn.name,
      hp: spawn.maxHp,
      maxHp: spawn.maxHp,
      alive: true,
      respawnAt: null,
      flashUntil: 0,
      kind: "enemy",
    };
  }
  for (const a of ANIMAL_SPAWNS) {
    record[a.id] = {
      id: a.id,
      name: a.name,
      hp: a.maxHp,
      maxHp: a.maxHp,
      alive: true,
      respawnAt: null,
      flashUntil: 0,
      kind: "animal",
      loot: a.loot,
    };
  }
  return record;
}

function initialState(): GameState {
  return {
    classId: null,
    raceId: null,
    originId: null,
    hp: 0,
    maxHp: 0,
    resource: 0,
    maxResource: 0,
    shield: 0,
    shieldUntil: 0,
    speedMultiplier: 1,
    speedMultiplierUntil: 0,
    manaRegenBonus: 0,
    manaRegenBonusUntil: 0,
    cooldownReadyAt: {},
    dotEffects: [],
    targetId: null,
    dummies: freshDummies(),
    damageNumbers: [],
    vfx: [],
    log: [],
    kills: 0,
    pelts: 0,
    swingUntil: 0,
    lastAbilityAnimation: "idle",
    swingSeq: 0,
    nexusStats: emptyNexusStats(),
    inventory: [],
    loadout: [],
    damageBonus: 0,
    armorBonus: 0,
  };
}

let uid = 0;
function nextId(prefix: string): string {
  uid += 1;
  return `${prefix}-${uid}`;
}

function pushLog(log: LogEntry[], text: string, now: number): LogEntry[] {
  const entry: LogEntry = { id: nextId("log"), text, createdAt: now };
  const next = [...log, entry];
  return next.slice(-30);
}

function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case "DEPLOY_SURVIVOR": {
      const origin = getOrigin(action.originId);
      if (!origin) return state;
      const nexus = { ...action.nexusStats };
      const pools = poolsFromNexus(nexus);
      const prim = primaryResourceFromStats(nexus);
      const itemIds = origin.starterItems;
      const loadout = resolveLoadout(itemIds);
      const gear = sumLoadoutBonuses(loadout);
      const maxHp = pools.maxHealth + gear.health;
      const maxResource = prim.maxResource + gear.resource;
      const damageBonus =
        Math.max(pools.physicalDamage, pools.techDamage) + gear.damage;
      const toon = getNexusToonByKey(action.toonKey);
      return {
        ...initialState(),
        classId: "survivor",
        raceId: action.toonKey,
        originId: origin.id,
        hp: maxHp,
        maxHp,
        resource: maxResource,
        maxResource,
        nexusStats: nexus,
        inventory: [...itemIds],
        loadout,
        damageBonus,
        armorBonus: pools.armor + gear.armor,
        speedMultiplier: 1 + gear.moveSpeed * 0.05,
        log: [
          {
            id: nextId("log"),
            text: `Nexus Ground · ${toon?.label ?? "Survivor"} (${origin.label}) · stats live.`,
            createdAt: performance.now(),
          },
        ],
      };
    }
    case "SET_TARGET":
      return { ...state, targetId: action.targetId };
    case "USE_ABILITY": {
      const { ability, now, inRange } = action;
      if (!inRange) return state;
      if (state.resource < ability.cost) return state;
      const ready = state.cooldownReadyAt[ability.id] ?? 0;
      if (now < ready) return state;

      const animDuration = ability.animation.includes("combo") || ability.animation.includes("dash") ? 700 : 500;

      let nextState: GameState = {
        ...state,
        resource: Math.max(0, state.resource - ability.cost),
        cooldownReadyAt: {
          ...state.cooldownReadyAt,
          [ability.id]: now + ability.cooldown * 1000,
        },
        swingUntil: now + animDuration,
        lastAbilityAnimation: ability.animation,
        swingSeq: state.swingSeq + 1,
      };

      const target = state.targetId ? state.dummies[state.targetId] : undefined;
      const vfxKind: VfxEvent["kind"] =
        ability.effect === "melee" || ability.effect === "dash"
          ? "melee"
          : ability.effect === "ranged" || ability.effect === "dot"
            ? "ranged"
            : ability.effect === "shield"
              ? "shield"
              : "heal";

      const mm = resolveAbilityMM(ability);
      playerMode.lastMM = mm;
      const impulse = buildMMImpulse(mm, state.targetId, now);
      if (impulse) {
        playerMode.mmImpulseVx = impulse.vx;
        playerMode.mmImpulseVz = impulse.vz;
        playerMode.mmImpulseUntil = impulse.until;
      }

      nextState.vfx = [
        ...nextState.vfx,
        {
          id: nextId("vfx"),
          kind: vfxKind,
          color: ability.color,
          fromId: "player",
          toId: target && target.alive ? target.id : null,
          createdAt: now,
        },
      ];

      const riposte =
        combatParry.riposteReady &&
        now < combatParry.riposteUntil &&
        (ability.effect === "melee" || ability.effect === "dash");
      // Ability base + Nexus gear/stat damage bonus
      const basePower = ability.power + (state.damageBonus ?? 0) * 0.35;
      const strikePower = Math.round(
        riposte ? basePower * RIPOSTE_DAMAGE_MULT : basePower,
      );
      if (riposte) {
        combatParry.riposteReady = false;
        nextState.log = pushLog(nextState.log, "Riposte! Counter-attack lands.", now);
      }

      switch (ability.effect) {
        case "melee":
        case "dash": {
          if (target && target.alive) {
            const newHp = Math.max(0, target.hp - strikePower);
            const killed = newHp <= 0;
            nextState.dummies = {
              ...nextState.dummies,
              [target.id]: {
                ...target,
                hp: newHp,
                alive: !killed,
                respawnAt: killed ? now + 4000 : null,
                flashUntil: now + 180,
              },
            };
            nextState.damageNumbers = [
              ...nextState.damageNumbers,
              {
                id: nextId("dmg"),
                targetId: target.id,
                amount: strikePower,
                color: ability.color,
                crit: strikePower > 40 || riposte,
                createdAt: now,
              },
            ];
            const meleeSuffix = killed
              ? target.kind === "animal"
                ? ` — skinned (+${target.loot ?? "hide"})`
                : " — defeated!"
              : "";
            nextState.log = pushLog(
              nextState.log,
              `${ability.name} hits ${target.name} for ${strikePower}${meleeSuffix}`,
              now,
            );
            combatAim.hitMarker += 1;
            if (killed) {
              if (target.kind === "animal") nextState.pelts = nextState.pelts + 1;
              else nextState.kills = nextState.kills + 1;
            } else if (isHeavyHit(strikePower, ability.animation)) {
              const ep = worldPositions.dummies.get(target.id);
              const dx = (ep?.x ?? worldPositions.player.x) - worldPositions.player.x;
              const dz = (ep?.z ?? worldPositions.player.z) - worldPositions.player.z;
              launchEnemy(target.id, dx, dz, strikePower, now);
              fireClash("melee", target.id, 1.1);
              if (isAerialSlam(ability.animation) && ep) {
                playerMode.aerialSlamUntil = now + 520;
                fireGroundImpactVfx(ep.x, ep.y, ep.z, strikePower / 22);
              }
            }
          } else {
            nextState.log = pushLog(nextState.log, `${ability.name} needs a target in range.`, now);
          }
          break;
        }
        case "ranged": {
          if (target && target.alive) {
            const newHp = Math.max(0, target.hp - ability.power);
            const killed = newHp <= 0;
            nextState.dummies = {
              ...nextState.dummies,
              [target.id]: {
                ...target,
                hp: newHp,
                alive: !killed,
                respawnAt: killed ? now + 4000 : null,
                flashUntil: now + 180,
              },
            };
            nextState.damageNumbers = [
              ...nextState.damageNumbers,
              {
                id: nextId("dmg"),
                targetId: target.id,
                amount: ability.power,
                color: ability.color,
                crit: ability.power > 35,
                createdAt: now,
              },
            ];
            const rangedSuffix = killed
              ? target.kind === "animal"
                ? ` — skinned (+${target.loot ?? "hide"})`
                : " — defeated!"
              : "";
            nextState.log = pushLog(
              nextState.log,
              `${ability.name} strikes ${target.name} for ${ability.power}${rangedSuffix}`,
              now,
            );
            combatAim.hitMarker += 1;
            if (killed) {
              if (target.kind === "animal") nextState.pelts = nextState.pelts + 1;
              else nextState.kills = nextState.kills + 1;
            }
          } else {
            nextState.log = pushLog(nextState.log, `${ability.name} needs a target in range.`, now);
          }
          break;
        }
        case "dot": {
          if (target && target.alive) {
            nextState.dotEffects = [
              ...nextState.dotEffects,
              {
                targetId: target.id,
                power: ability.power,
                tickEvery: 1000,
                nextTickAt: now + 1000,
                endsAt: now + (ability.duration ?? 3) * 1000,
              },
            ];
            nextState.log = pushLog(nextState.log, `${ability.name} afflicts ${target.name}.`, now);
          } else {
            nextState.log = pushLog(nextState.log, `${ability.name} needs a target in range.`, now);
          }
          break;
        }
        case "heal": {
          nextState.hp = Math.min(state.maxHp, state.hp + ability.power);
          nextState.damageNumbers = [
            ...nextState.damageNumbers,
            {
              id: nextId("dmg"),
              targetId: "player",
              amount: ability.power,
              color: "#8bffb0",
              crit: false,
              createdAt: now,
            },
          ];
          nextState.log = pushLog(nextState.log, `${ability.name} restores ${ability.power} health.`, now);
          break;
        }
        case "shield": {
          nextState.shield = ability.power;
          nextState.shieldUntil = now + (ability.duration ?? 6) * 1000;
          nextState.log = pushLog(nextState.log, `${ability.name} raises a protective shield.`, now);
          break;
        }
        case "buff": {
          if (ability.id === "evasive-roll") {
            nextState.speedMultiplier = ability.power;
            nextState.speedMultiplierUntil = now + (ability.duration ?? 3) * 1000;
          } else {
            nextState.manaRegenBonus = ability.power;
            nextState.manaRegenBonusUntil = now + (ability.duration ?? 6) * 1000;
          }
          nextState.log = pushLog(nextState.log, `${ability.name} takes effect.`, now);
          break;
        }
      }

      return nextState;
    }
    case "ENEMY_STRIKE": {
      const { attackerId, attackerName, damage, now } = action;
      if (combatParry.parriedAttackerId === attackerId) {
        combatParry.parriedAttackerId = null;
        combatAim.hitMarker += 1;
        return {
          ...state,
          ...(devSettings.hitStop
            ? { speedMultiplier: 0.42, speedMultiplierUntil: now + 140 }
            : {}),
          log: pushLog(state.log, `Parry! ${attackerName}'s strike is deflected.`, now),
        };
      }
      // Armor mitigates flat damage (Nexus ENT + plate)
      const armorMit = Math.min(0.55, (state.armorBonus ?? 0) / (state.armorBonus + 80));
      let dmg = Math.round(damage * (1 - armorMit));
      const blocking = combatParry.blocking;
      if (blocking) dmg = Math.round(dmg * BLOCK_DAMAGE_MULT);
      const absorbed = state.shield > 0 ? Math.min(state.shield, dmg) : 0;
      const hpLoss = Math.max(0, dmg - absorbed);
      let shield = Math.max(0, state.shield - absorbed);
      let shieldUntil = state.shieldUntil;
      if (shield <= 0) shieldUntil = 0;
      const hp = Math.max(0, state.hp - hpLoss);
      const note =
        blocking && hpLoss < damage
          ? `Blocked — ${attackerName} hits for ${hpLoss}.`
          : `${attackerName} strikes you for ${hpLoss}.`;
      if (blocking) {
        const contact = strikeContactPoint(attackerId);
        fireBlockParryVfx("block", hpLoss < damage, contact);
        fireClash("block", attackerId, hpLoss < damage ? 0.9 : 0.55, contact);
      }
      return {
        ...state,
        hp,
        shield,
        shieldUntil,
        log: pushLog(state.log, note, now),
        damageNumbers: [
          ...state.damageNumbers,
          {
            id: nextId("dmg"),
            targetId: "player",
            amount: hpLoss,
            color: blocking && hpLoss < damage ? "#8ec8ff" : "#ff6a5a",
            crit: false,
            createdAt: now,
          },
        ],
      };
    }
    case "IMPACT_DAMAGE": {
      const { targetId, amount, label, now } = action;
      const target = state.dummies[targetId];
      if (!target || !target.alive || amount <= 0) return state;
      const newHp = Math.max(0, target.hp - amount);
      const killed = newHp <= 0;
      return {
        ...state,
        dummies: {
          ...state.dummies,
          [targetId]: {
            ...target,
            hp: newHp,
            alive: !killed,
            respawnAt: killed ? now + 4000 : null,
            flashUntil: now + 220,
          },
        },
        damageNumbers: [
          ...state.damageNumbers,
          {
            id: nextId("dmg"),
            targetId,
            amount,
            color: "#ff9a4a",
            crit: true,
            createdAt: now,
          },
        ],
        log: pushLog(state.log, label, now),
        kills: killed && target.kind === "enemy" ? state.kills + 1 : state.kills,
        pelts: killed && target.kind === "animal" ? state.pelts + 1 : state.pelts,
      };
    }
    case "TICK": {
      const { now, dt } = action;
      clearIncomingStrike(now);
      if (now > combatParry.riposteUntil) combatParry.riposteReady = false;
      let resource = state.resource;
      const baseRegen = state.maxResource * 0.06;
      const bonusRegen = now < state.manaRegenBonusUntil ? state.maxResource * 0.12 : 0;
      resource = Math.min(state.maxResource, resource + (baseRegen + bonusRegen) * dt);

      let shield = state.shield;
      if (now > state.shieldUntil) shield = 0;

      let speedMultiplier = state.speedMultiplier;
      if (now > state.speedMultiplierUntil) speedMultiplier = 1;

      let dummies = state.dummies;
      let damageNumbers = state.damageNumbers;
      let log = state.log;
      let kills = state.kills;
      let pelts = state.pelts;
      let dotEffects = state.dotEffects;

      if (dotEffects.length > 0) {
        const stillActive: typeof dotEffects = [];
        let dummiesCopy: Record<string, DummyState> | null = null;
        for (const dot of dotEffects) {
          // Read from the mutable copy once it exists so multiple DoTs on the
          // same target in one tick see the decremented hp / dead state and
          // can't double-award kills or pelts.
          const target = (dummiesCopy ?? dummies)[dot.targetId];
          if (!target || !target.alive) continue;
          if (now >= dot.endsAt) continue;
          if (now >= dot.nextTickAt) {
            if (!dummiesCopy) dummiesCopy = { ...dummies };
            const newHp = Math.max(0, target.hp - dot.power);
            const killed = newHp <= 0;
            dummiesCopy[target.id] = {
              ...target,
              hp: newHp,
              alive: !killed,
              respawnAt: killed ? now + 4000 : null,
              flashUntil: now + 150,
            };
            damageNumbers = [
              ...damageNumbers,
              {
                id: nextId("dmg"),
                targetId: target.id,
                amount: dot.power,
                color: "#8fe9ff",
                crit: false,
                createdAt: now,
              },
            ];
            if (killed) {
              if (target.kind === "animal") {
                pelts += 1;
                log = pushLog(log, `${target.name} is skinned (+${target.loot ?? "hide"}).`, now);
              } else {
                kills += 1;
                log = pushLog(log, `${target.name} succumbs to the affliction.`, now);
              }
            }
            stillActive.push({ ...dot, nextTickAt: now + dot.tickEvery });
          } else {
            stillActive.push(dot);
          }
        }
        if (dummiesCopy) dummies = dummiesCopy;
        dotEffects = stillActive;
      }

      const respawnEntries = Object.values(dummies).filter(
        (d) => !d.alive && d.respawnAt !== null && now >= d.respawnAt,
      );
      if (respawnEntries.length > 0) {
        dummies = { ...dummies };
        for (const d of respawnEntries) {
          dummies[d.id] = { ...d, hp: d.maxHp, alive: true, respawnAt: null };
        }
        log = pushLog(log, `${respawnEntries[0].name} returns to the training field.`, now);
      }

      if (
        resource === state.resource &&
        shield === state.shield &&
        speedMultiplier === state.speedMultiplier &&
        dummies === state.dummies &&
        damageNumbers === state.damageNumbers &&
        dotEffects === state.dotEffects
      ) {
        return state;
      }

      return { ...state, resource, shield, speedMultiplier, dummies, damageNumbers, log, kills, pelts, dotEffects };
    }
    case "RESET_DUMMY":
      return state;
    case "REMOVE_DAMAGE_NUMBER":
      return {
        ...state,
        damageNumbers: state.damageNumbers.filter((d) => d.id !== action.id),
      };
    case "REMOVE_VFX":
      return { ...state, vfx: state.vfx.filter((v) => v.id !== action.id) };
    default:
      return state;
  }
}

interface GameContextValue {
  state: GameState;
  classDef: ClassDef | null;
  /** @deprecated use deploySurvivor */
  selectClass: (classId: string, raceId: string) => void;
  deploySurvivor: (args: {
    toonKey: string;
    originId: string;
    nexusStats: NexusStats;
  }) => void;
  setTarget: (id: string | null) => void;
  useAbility: (ability: Ability) => void;
  removeDamageNumber: (id: string) => void;
  removeVfx: (id: string) => void;
  cooldownFraction: (ability: Ability) => number;
  receiveEnemyStrike: (attackerId: string, attackerName: string, damage: number) => void;
  applyImpactDamage: (targetId: string, amount: number, label: string) => void;
  notifyParryStagger: (attackerId: string) => void;
}

const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, initialState);
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    let last = performance.now();
    let raf = 0;
    const loop = (now: number) => {
      const dt = Math.min(0.25, (now - last) / 1000) * combatTimeScale();
      last = now;
      dispatch({ type: "TICK", now, dt });
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  const deploySurvivor = useCallback(
    (args: { toonKey: string; originId: string; nexusStats: NexusStats }) =>
      dispatch({ type: "DEPLOY_SURVIVOR", ...args }),
    [],
  );
  const selectClass = useCallback((_classId: string, raceId: string) => {
    const origin = getOrigin("military")!;
    const seeds = applyOriginSeeds(origin);
    dispatch({
      type: "DEPLOY_SURVIVOR",
      toonKey: raceId.includes(":") ? raceId : `male:adventurer`,
      originId: origin.id,
      nexusStats: seeds,
    });
  }, []);
  const setTarget = useCallback((id: string | null) => dispatch({ type: "SET_TARGET", targetId: id }), []);

  const useAbility = useCallback((ability: Ability) => {
    const now = performance.now();
    const targetId = stateRef.current.targetId;
    let inRange = true;
    if (ability.effect === "melee" || ability.effect === "dash") {
      // Sensor-gated: the target must sit inside the player's forward swing arc
      // (published each frame by the Player into worldPositions.meleeHits) AND be
      // within the ability's reach. This replaces pure distance checks for close-
      // range abilities so you can't hit a dummy directly behind you.
      if (!targetId) {
        inRange = false;
      } else {
        const inArc = worldPositions.meleeHits.has(targetId);
        const dist = worldPositions.distanceToPlayer(targetId);
        inRange = inArc && dist <= ability.range;
      }
    } else if (ability.range > 0) {
      if (!targetId) {
        inRange = false;
      } else {
        const dist = worldPositions.distanceToPlayer(targetId);
        inRange = dist <= ability.range;
      }
    }
    dispatch({ type: "USE_ABILITY", ability, now, inRange });
  }, []);

  const removeDamageNumber = useCallback((id: string) => dispatch({ type: "REMOVE_DAMAGE_NUMBER", id }), []);
  const removeVfx = useCallback((id: string) => dispatch({ type: "REMOVE_VFX", id }), []);

  const receiveEnemyStrike = useCallback((attackerId: string, attackerName: string, damage: number) => {
    dispatch({ type: "ENEMY_STRIKE", attackerId, attackerName, damage, now: performance.now() });
  }, []);

  const applyImpactDamage = useCallback((targetId: string, amount: number, label: string) => {
    dispatch({ type: "IMPACT_DAMAGE", targetId, amount, label, now: performance.now() });
  }, []);

  const notifyParryStagger = useCallback((_attackerId: string) => {
    /* Dummy reads combatParry.parriedAttackerId and staggers locally. */
  }, []);

  const cooldownFraction = useCallback(
    (ability: Ability) => {
      const ready = stateRef.current.cooldownReadyAt[ability.id] ?? 0;
      const remaining = ready - performance.now();
      if (remaining <= 0) return 0;
      return Math.min(1, remaining / (ability.cooldown * 1000));
    },
    [],
  );

  const classDef = useMemo(() => {
    if (!state.classId || !state.originId) return null;
    const origin = getOrigin(state.originId);
    if (!origin) return null;
    const toon = state.raceId ? getNexusToonByKey(state.raceId) : undefined;
    return buildSurvivorProfile(origin, state.nexusStats, toon?.label ?? "Survivor");
  }, [state.classId, state.originId, state.nexusStats, state.raceId]);

  const value = useMemo<GameContextValue>(
    () => ({
      state,
      classDef,
      selectClass,
      deploySurvivor,
      setTarget,
      useAbility,
      removeDamageNumber,
      removeVfx,
      cooldownFraction,
      receiveEnemyStrike,
      applyImpactDamage,
      notifyParryStagger,
    }),
    [
      state,
      classDef,
      selectClass,
      deploySurvivor,
      setTarget,
      useAbility,
      removeDamageNumber,
      removeVfx,
      cooldownFraction,
      receiveEnemyStrike,
      applyImpactDamage,
      notifyParryStagger,
    ],
  );

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame(): GameContextValue {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGame must be used within GameProvider");
  return ctx;
}
