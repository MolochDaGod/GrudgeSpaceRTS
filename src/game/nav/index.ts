/**
 * src/game/nav/index.ts — Barrel for the StarNav module.
 *
 * Source: pipelined from `_starnav-src/space-reversing-0.1.4/nav/src`.
 * Renamed to kebab-case to match the rest of the repo. Filenames map:
 *   - types.ts        → nav-types.ts
 *   - navCore.ts      → nav-core.ts
 *   - navPlan.ts      → nav-plan.ts
 *   - navPlanUtils.ts → nav-plan-utils.ts
 *   - navVis.ts       → nav-vis.ts (Three.js visualisation harness)
 *
 * Public API (campaign / mission flows can import from here):
 *
 *   import {
 *     SCNavigationCore,
 *     SCNavigationPlanner,
 *     CoordinateTransformer,
 *     type ObjectContainer,
 *     type PointOfInterest,
 *     type NavigationPlan,
 *     type Vector3,
 *   } from './nav';
 */

export * from './nav-types';
export { SCNavigationCore } from './nav-core';
export { SCNavigationPlanner, NavNode } from './nav-plan';
export type { PathSegment, NavigationPlan, MeetingPoint } from './nav-plan';
export { CoordinateTransformer } from './nav-plan-utils';
