import { interactionGroups } from "@react-three/rapier";

/** Rapier interaction groups (0–15). Keep membership + filters symmetric on both bodies. */
export const CollisionGroup = {
  environment: 0,
  player: 1,
  enemy: 2,
} as const;

export const collision = {
  environment: interactionGroups([CollisionGroup.environment], [
    CollisionGroup.player,
    CollisionGroup.enemy,
  ]),
  player: interactionGroups([CollisionGroup.player], [
    CollisionGroup.environment,
    CollisionGroup.enemy,
  ]),
  enemy: interactionGroups([CollisionGroup.enemy], [
    CollisionGroup.environment,
    CollisionGroup.player,
  ]),
} as const;