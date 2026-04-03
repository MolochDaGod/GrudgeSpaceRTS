/**
 * ground-rts-controls.ts — Input handling for Top-Down RTS Micro Wars.
 *
 * - Left click: select unit / box-select
 * - Right click: move selected units / attack-move if holding A
 * - A + right click: attack-move
 * - Ctrl+1-9: assign control group
 * - 1-9: recall control group
 * - S: stop selected units
 * - WASD / arrow keys / edge scroll: pan camera
 * - Mouse wheel: zoom
 */

import type { GroundRTSState, RTSUnit, Vec2 } from './ground-rts-types';
import type { Camera } from './ground-rts-renderer';
import { screenToWorld } from './ground-rts-renderer';
import { commandMove, commandAttackMove, commandAttackTarget, commandStop } from './ground-rts-engine';

const EDGE_SCROLL_ZONE = 30;
const EDGE_SCROLL_SPEED = 600;
const KEY_SCROLL_SPEED = 800;
const ZOOM_MIN = 0.2;
const ZOOM_MAX = 2.0;
const ZOOM_STEP = 0.1;

export interface ControlState {
  keysDown: Set<string>;
  mouseDown: boolean;
  rightMouseDown: boolean;
  mouseX: number;
  mouseY: number;
  selectionBox: { x1: number; y1: number; x2: number; y2: number } | null;
  aKeyHeld: boolean;
}

export function createControlState(): ControlState {
  return {
    keysDown: new Set(),
    mouseDown: false,
    rightMouseDown: false,
    mouseX: 0,
    mouseY: 0,
    selectionBox: null,
    aKeyHeld: false,
  };
}

// ── Event Handlers (bind to canvas) ──────────────────────────────────
export function handleMouseDown(
  e: MouseEvent,
  ctrl: ControlState,
  state: GroundRTSState,
  camera: Camera,
  canvasW: number,
  canvasH: number,
): void {
  const rect = (e.target as HTMLElement).getBoundingClientRect();
  const sx = e.clientX - rect.left;
  const sy = e.clientY - rect.top;
  ctrl.mouseX = sx;
  ctrl.mouseY = sy;

  if (e.button === 0) {
    // Left click — start selection box
    ctrl.mouseDown = true;
    ctrl.selectionBox = { x1: sx, y1: sy, x2: sx, y2: sy };
  } else if (e.button === 2) {
    // Right click — move or attack-move
    ctrl.rightMouseDown = true;
    const world = screenToWorld(sx, sy, camera, canvasW, canvasH);
    const selected = getSelectedIds(state);
    if (selected.length === 0) return;

    // Check if clicking on an enemy → direct attack
    const clickedEnemy = findUnitAt(state, world, 1);
    if (clickedEnemy) {
      commandAttackTarget(state, selected, clickedEnemy.id);
      return;
    }

    if (ctrl.aKeyHeld) {
      commandAttackMove(state, selected, world);
    } else {
      commandMove(state, selected, world);
    }
  }
}

export function handleMouseMove(e: MouseEvent, ctrl: ControlState): void {
  const rect = (e.target as HTMLElement).getBoundingClientRect();
  ctrl.mouseX = e.clientX - rect.left;
  ctrl.mouseY = e.clientY - rect.top;

  if (ctrl.mouseDown && ctrl.selectionBox) {
    ctrl.selectionBox.x2 = ctrl.mouseX;
    ctrl.selectionBox.y2 = ctrl.mouseY;
  }
}

export function handleMouseUp(
  e: MouseEvent,
  ctrl: ControlState,
  state: GroundRTSState,
  camera: Camera,
  canvasW: number,
  canvasH: number,
): void {
  if (e.button === 0 && ctrl.mouseDown) {
    ctrl.mouseDown = false;
    if (ctrl.selectionBox) {
      const box = ctrl.selectionBox;
      const w = Math.abs(box.x2 - box.x1);
      const h = Math.abs(box.y2 - box.y1);

      if (w < 5 && h < 5) {
        // Click select — single unit
        const world = screenToWorld(box.x1, box.y1, camera, canvasW, canvasH);
        const clicked = findUnitAt(state, world, 0);
        if (!e.shiftKey) deselectAll(state);
        if (clicked) clicked.selected = true;
      } else {
        // Box select
        if (!e.shiftKey) deselectAll(state);
        const tl = screenToWorld(Math.min(box.x1, box.x2), Math.min(box.y1, box.y2), camera, canvasW, canvasH);
        const br = screenToWorld(Math.max(box.x1, box.x2), Math.max(box.y1, box.y2), camera, canvasW, canvasH);
        for (const [, unit] of state.units) {
          if (unit.team !== 0 || unit.state === 'dead' || unit.state === 'dying') continue;
          if (unit.x >= tl.x && unit.x <= br.x && unit.y >= tl.y && unit.y <= br.y) {
            unit.selected = true;
          }
        }
      }
      ctrl.selectionBox = null;
    }
  }
  if (e.button === 2) ctrl.rightMouseDown = false;
}

export function handleWheel(e: WheelEvent, camera: Camera): void {
  if (e.deltaY < 0) {
    camera.zoom = Math.min(ZOOM_MAX, camera.zoom + ZOOM_STEP);
  } else {
    camera.zoom = Math.max(ZOOM_MIN, camera.zoom - ZOOM_STEP);
  }
}

export function handleKeyDown(e: KeyboardEvent, ctrl: ControlState, state: GroundRTSState): void {
  ctrl.keysDown.add(e.key.toLowerCase());
  if (e.key.toLowerCase() === 'a') ctrl.aKeyHeld = true;

  // S = stop
  if (e.key.toLowerCase() === 's' && !e.ctrlKey) {
    const selected = getSelectedIds(state);
    if (selected.length > 0) commandStop(state, selected);
  }

  // Control groups
  const num = parseInt(e.key);
  if (num >= 1 && num <= 9) {
    if (e.ctrlKey) {
      // Assign control group
      const selected = getSelectedIds(state);
      for (const [, unit] of state.units) {
        if (unit.controlGroup === num) unit.controlGroup = 0;
      }
      for (const id of selected) {
        const unit = state.units.get(id);
        if (unit) unit.controlGroup = num;
      }
    } else {
      // Recall control group
      deselectAll(state);
      for (const [, unit] of state.units) {
        if (unit.controlGroup === num && unit.state !== 'dead' && unit.state !== 'dying') {
          unit.selected = true;
        }
      }
    }
  }
}

export function handleKeyUp(e: KeyboardEvent, ctrl: ControlState): void {
  ctrl.keysDown.delete(e.key.toLowerCase());
  if (e.key.toLowerCase() === 'a') ctrl.aKeyHeld = false;
}

// ── Camera Pan (called every frame) ──────────────────────────────────
export function updateCamera(
  camera: Camera,
  ctrl: ControlState,
  state: GroundRTSState,
  canvasW: number,
  canvasH: number,
  dt: number,
): void {
  let dx = 0,
    dy = 0;

  // WASD / arrows
  if (ctrl.keysDown.has('w') || ctrl.keysDown.has('arrowup')) dy -= KEY_SCROLL_SPEED * dt;
  if (ctrl.keysDown.has('s') || ctrl.keysDown.has('arrowdown')) dy += KEY_SCROLL_SPEED * dt;
  if (ctrl.keysDown.has('a') || ctrl.keysDown.has('arrowleft')) dx -= KEY_SCROLL_SPEED * dt;
  if (ctrl.keysDown.has('d') || ctrl.keysDown.has('arrowright')) dx += KEY_SCROLL_SPEED * dt;

  // Edge scroll
  if (ctrl.mouseX < EDGE_SCROLL_ZONE) dx -= EDGE_SCROLL_SPEED * dt;
  if (ctrl.mouseX > canvasW - EDGE_SCROLL_ZONE) dx += EDGE_SCROLL_SPEED * dt;
  if (ctrl.mouseY < EDGE_SCROLL_ZONE) dy -= EDGE_SCROLL_SPEED * dt;
  if (ctrl.mouseY > canvasH - EDGE_SCROLL_ZONE) dy += EDGE_SCROLL_SPEED * dt;

  camera.x = Math.max(0, Math.min(state.mapWidth, camera.x + dx));
  camera.y = Math.max(0, Math.min(state.mapHeight, camera.y + dy));
}

// ── Helpers ──────────────────────────────────────────────────────────
function getSelectedIds(state: GroundRTSState): number[] {
  const ids: number[] = [];
  for (const [id, unit] of state.units) {
    if (unit.selected && unit.team === 0 && unit.state !== 'dead' && unit.state !== 'dying') {
      ids.push(id);
    }
  }
  return ids;
}

function deselectAll(state: GroundRTSState): void {
  for (const [, unit] of state.units) unit.selected = false;
}

function findUnitAt(state: GroundRTSState, world: Vec2, team: 0 | 1): RTSUnit | null {
  let closest: RTSUnit | null = null;
  let closestDist = 30; // click radius
  for (const [, unit] of state.units) {
    if (unit.team !== team || unit.state === 'dead' || unit.state === 'dying') continue;
    const d = Math.sqrt((unit.x - world.x) ** 2 + (unit.y - world.y) ** 2);
    if (d < closestDist) {
      closestDist = d;
      closest = unit;
    }
  }
  return closest;
}
