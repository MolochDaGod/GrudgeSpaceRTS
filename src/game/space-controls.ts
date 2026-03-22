import * as THREE from 'three';
import type { SpaceGameState, SelectionBox, CameraState, Vec3, Command } from './space-types';

const WORLD_SCALE      = 0.05;
const EDGE_SCROLL_ZONE = 30;
// Pan/edge speeds are intentionally a multiplier — actual pixel-speed
// scales with zoom level so navigation feels the same at any distance.
// Formula: effective_speed = BASE × (zoom / ZOOM_REF)
const PAN_SPEED_BASE  = 1200;  // game units/s at reference zoom
const EDGE_SPEED_BASE = 1200;
const ZOOM_REF        = 200;   // zoom level where base speed feels 'normal'

export class SpaceControls {
  selectionBox: SelectionBox = { active: false, startX: 0, startY: 0, endX: 0, endY: 0 };
  // Solar System Scrim scale: 12 = planet surface, 2400 = full sector view
  cameraState: CameraState = { x: 0, y: 0, z: 0, zoom: 200, minZoom: 12, maxZoom: 2400, angle: 55, rotation: 0, bookmarks: [] };

  private container: HTMLElement;
  private camera: THREE.PerspectiveCamera;
  private state: SpaceGameState;
  private renderer: THREE.WebGLRenderer;
  private raycaster = new THREE.Raycaster();
  /** Public so space-renderer can raycast planets on the same mouse NDC. */
  public mouseNdc = new THREE.Vector2();
  private keys = new Set<string>();
  private mouseDown = false;
  private rightMouseDown = false;
  /** Public so HUD action buttons can activate attack-move / patrol modes. */
  commandMode: 'normal' | 'attack_move' | 'patrol' = 'normal';

  constructor(container: HTMLElement, camera: THREE.PerspectiveCamera, state: SpaceGameState, renderer: THREE.WebGLRenderer) {
    this.container = container;
    this.camera = camera;
    this.state = state;
    this.renderer = renderer;

    container.addEventListener('mousedown', this.onMouseDown);
    container.addEventListener('mousemove', this.onMouseMove);
    container.addEventListener('mouseup', this.onMouseUp);
    container.addEventListener('contextmenu', e => e.preventDefault());
    container.addEventListener('wheel', this.onWheel, { passive: false });
    container.addEventListener('dblclick', this.onDoubleClick);
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
  }

  /** Set by SpaceRenderer so clicking an empty area checks planet collision. */
  public onPlanetClick?: (planetId: number) => void;
  /** Set by SpaceRenderer to route Q/W/E/R ability hotkeys (matches ability.key). */
  public onAbilityActivateByKey?: (key: string) => void;

  private onMouseDown = (e: MouseEvent) => {
    if (e.button === 0) {
      this.mouseDown = true;
      const rect = this.container.getBoundingClientRect();
      this.selectionBox = { active: true, startX: e.clientX - rect.left, startY: e.clientY - rect.top, endX: e.clientX - rect.left, endY: e.clientY - rect.top };
    } else if (e.button === 2) {
      this.rightMouseDown = true;
      this.issueCommand(e);
    }
  };

  private onMouseMove = (e: MouseEvent) => {
    const rect = this.container.getBoundingClientRect();
    this.mouseNdc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouseNdc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    if (this.mouseDown && this.selectionBox.active) {
      this.selectionBox.endX = e.clientX - rect.left;
      this.selectionBox.endY = e.clientY - rect.top;
    }
  };

  private onMouseUp = (e: MouseEvent) => {
    if (e.button === 0) {
      this.mouseDown = false;
      if (this.selectionBox.active) {
        this.performSelection(e);
        this.selectionBox.active = false;
      }
    } else if (e.button === 2) {
      this.rightMouseDown = false;
    }
  };

  // Set by SpaceRenderer to cancel the intro animation when the player scrolls.
  onIntroCancel: (() => void) | null = null;

  private onWheel = (e: WheelEvent) => {
    e.preventDefault();
    // Any manual scroll cancels the opening cinematic.
    if (this.onIntroCancel) { this.onIntroCancel(); this.onIntroCancel = null; }
    // Logarithmic zoom: step proportional to current distance.
    const factor = 1 + e.deltaY * 0.0012;
    this.cameraState.zoom = Math.max(
      this.cameraState.minZoom,
      Math.min(this.cameraState.maxZoom, this.cameraState.zoom * factor),
    );
  };

  private onDoubleClick = (e: MouseEvent) => {
    // Select all units of same type on screen
    const worldPos = this.screenToWorld(e.clientX, e.clientY);
    if (!worldPos) return;
    const clickedShip = this.findShipAtScreen(e.clientX, e.clientY);
    if (clickedShip && clickedShip.team === 1) {
      this.state.selectedIds.clear();
      for (const [id, ship] of this.state.ships) {
        if (ship.team === 1 && ship.shipType === clickedShip.shipType && !ship.dead) {
          ship.selected = true;
          this.state.selectedIds.add(id);
        }
      }
    }
  };

  private onKeyDown = (e: KeyboardEvent) => {
    this.keys.add(e.key.toLowerCase());

    // Control groups: Ctrl+1-9 to assign, 1-9 to recall
    if (e.key >= '1' && e.key <= '9') {
      const num = parseInt(e.key);
      if (e.ctrlKey) {
        this.state.controlGroups.set(num, new Set(this.state.selectedIds));
      } else if (!e.altKey) {
        const group = this.state.controlGroups.get(num);
        if (group) {
          this.clearSelection();
          for (const id of group) {
            const ship = this.state.ships.get(id);
            if (ship && !ship.dead) {
              ship.selected = true;
              this.state.selectedIds.add(id);
            }
          }
        }
      }
    }

    const hasSelection = this.state.selectedIds.size > 0;
    switch (e.key.toLowerCase()) {
      // ─ Ability hotkeys: W/R activate abilities. Q/E reserved for camera orbit.
      case 'w': case 'r':
        if (hasSelection) this.onAbilityActivateByKey?.(e.key.toUpperCase());
        break;
      // Q/E are handled continuously in update() for camera rotation
      case 'q': case 'e': break;
      // ─ Command shortcuts (G = attack-move, A = always pan) ────────
      case 'g': this.commandMode = 'attack_move'; break;
      // S always pans camera (no stop command). H = hold/defend in place.
      case 'h': if (hasSelection) this.issueHoldCommand(); break;
      case 'p': this.commandMode = 'patrol'; break;
      case 'escape': this.commandMode = 'normal'; this.clearSelection(); break;
      case 'f1': case 'f2': case 'f3': case 'f4': {
        const idx = parseInt(e.key.slice(1)) - 1;
        if (e.ctrlKey) {
          this.cameraState.bookmarks[idx] = { x: this.cameraState.x, y: this.cameraState.y, z: 0 };
        } else if (this.cameraState.bookmarks[idx]) {
          this.cameraState.x = this.cameraState.bookmarks[idx].x;
          this.cameraState.y = this.cameraState.bookmarks[idx].y;
        }
        e.preventDefault();
        break;
      }
    }
  };

  private onKeyUp = (e: KeyboardEvent) => {
    this.keys.delete(e.key.toLowerCase());
  };

  update(dt: number) {
    // Speed scales linearly with zoom so panning feels consistent at any distance.
    const zoomScale = this.cameraState.zoom / ZOOM_REF;
    const panSpeed  = PAN_SPEED_BASE  * zoomScale;
    const edgeSpeed = EDGE_SPEED_BASE * zoomScale;

    // ── Camera yaw rotation (Q/E orbit around look-at point) ────────
    const ROTATE_SPEED = 90; // degrees per second
    if (this.keys.has('q')) this.cameraState.rotation -= ROTATE_SPEED * dt;
    if (this.keys.has('e')) this.cameraState.rotation += ROTATE_SPEED * dt;
    // Normalise to 0–360
    this.cameraState.rotation = ((this.cameraState.rotation % 360) + 360) % 360;

    // ── Camera panning (relative to current yaw) ─────────────────
    // W/D always pan. A pans only when no units selected (A = attack-move when selected).
    // S always pans (no stop command). Arrow keys ALWAYS pan regardless of selection.
    const sel = this.state.selectedIds.size > 0;
    let fwd = 0, right = 0; // forward/right in camera-relative space
    if (this.keys.has('w') || this.keys.has('arrowup'))                           fwd -= panSpeed * dt;
    if (this.keys.has('arrowdown') || this.keys.has('s'))                         fwd += panSpeed * dt;
    if (this.keys.has('arrowleft') || this.keys.has('a'))                          right -= panSpeed * dt;
    if (this.keys.has('d') || this.keys.has('arrowright'))                        right += panSpeed * dt;
    // Rotate pan direction by camera yaw so W always pushes "into" the screen
    const yawRad = this.cameraState.rotation * (Math.PI / 180);
    const cosY = Math.cos(yawRad), sinY = Math.sin(yawRad);
    this.cameraState.x += right * cosY - fwd * sinY;
    this.cameraState.y += right * sinY + fwd * cosY;

    // Edge scroll (cursor near viewport edge) — rotated by camera yaw
    const rect = this.container.getBoundingClientRect();
    const mx = (this.mouseNdc.x + 1) * 0.5 * rect.width;
    const my = (1 - (this.mouseNdc.y + 1) * 0.5) * rect.height;
    let eRight = 0, eFwd = 0;
    if (mx < EDGE_SCROLL_ZONE)               eRight -= edgeSpeed * dt;
    if (mx > rect.width  - EDGE_SCROLL_ZONE) eRight += edgeSpeed * dt;
    if (my < EDGE_SCROLL_ZONE)               eFwd   -= edgeSpeed * dt;
    if (my > rect.height - EDGE_SCROLL_ZONE) eFwd   += edgeSpeed * dt;
    this.cameraState.x += eRight * cosY - eFwd * sinY;
    this.cameraState.y += eRight * sinY + eFwd * cosY;
  }

  // ── Selection ──────────────────────────────────────────────
  private performSelection(e: MouseEvent) {
    const box = this.selectionBox;
    const w = Math.abs(box.endX - box.startX);
    const h = Math.abs(box.endY - box.startY);

    if (!e.shiftKey) this.clearSelection();

    if (w < 5 && h < 5) {
      // Click select: ship first, then station, then planet
      const ship = this.findShipAtScreen(e.clientX, e.clientY);
      if (ship && ship.team === 1) {
        ship.selected = true;
        this.state.selectedIds.add(ship.id);
        // Deselect any station
        for (const [, st] of this.state.stations) st.selected = false;
      } else {
        // Check if clicking near a friendly station
        const worldPos = this.screenToWorld(e.clientX, e.clientY);
        let clickedStation = false;
        if (worldPos) {
          const wx = worldPos.x / WORLD_SCALE, wy = worldPos.z / WORLD_SCALE;
          for (const [, st] of this.state.stations) {
            if (st.dead || st.team !== 1) continue;
            const d = Math.sqrt((st.x - wx) ** 2 + (st.y - wy) ** 2);
            if (d < 80) { // station click radius
              // Deselect all ships, select this station
              for (const sid of this.state.selectedIds) {
                const s = this.state.ships.get(sid); if (s) s.selected = false;
              }
              this.state.selectedIds.clear();
              for (const [, ost] of this.state.stations) ost.selected = false;
              st.selected = true;
              clickedStation = true;
              break;
            }
          }
        }
        if (!clickedStation && this.onPlanetClick) {
          this.onPlanetClick(-1);
        }
      }
    } else {
      // Box select
      const rect = this.container.getBoundingClientRect();
      const left = Math.min(box.startX, box.endX);
      const right = Math.max(box.startX, box.endX);
      const top = Math.min(box.startY, box.endY);
      const bottom = Math.max(box.startY, box.endY);

      for (const [id, ship] of this.state.ships) {
        if (ship.dead || ship.team !== 1) continue;
        const screen = this.worldToScreen(ship.x, ship.y, ship.z);
        if (!screen) continue;
        const sx = screen.x - rect.left;
        const sy = screen.y - rect.top;
        if (sx >= left && sx <= right && sy >= top && sy <= bottom) {
          ship.selected = true;
          this.state.selectedIds.add(id);
        }
      }
    }
  }

  private clearSelection() {
    for (const id of this.state.selectedIds) {
      const ship = this.state.ships.get(id);
      if (ship) ship.selected = false;
    }
    this.state.selectedIds.clear();
  }

  // ── Commands ───────────────────────────────────────────────
  private issueCommand(e: MouseEvent) {
    const worldPos = this.screenToWorld(e.clientX, e.clientY);
    if (!worldPos || this.state.selectedIds.size === 0) return;

    // Check if clicking on enemy
    const targetShip = this.findShipAtScreen(e.clientX, e.clientY);
    if (targetShip && targetShip.team !== 1) {
      for (const id of this.state.selectedIds) {
        const ship = this.state.ships.get(id);
        if (ship) {
          ship.targetId = targetShip.id;
          ship.moveTarget = null;
          ship.holdPosition = false;
        }
      }
      return;
    }

    // Move or attack-move
    for (const id of this.state.selectedIds) {
      const ship = this.state.ships.get(id);
      if (!ship) continue;
      ship.moveTarget = { x: worldPos.x / WORLD_SCALE, y: worldPos.z / WORLD_SCALE, z: 0 };
      ship.targetId = null;
      ship.holdPosition = false;
      ship.isAttackMoving = this.commandMode === 'attack_move';
    }
    this.commandMode = 'normal';
  }

  private issueStopCommand() {
    for (const id of this.state.selectedIds) {
      const ship = this.state.ships.get(id);
      if (ship) { ship.moveTarget = null; ship.targetId = null; ship.isAttackMoving = false; }
    }
  }

  private issueHoldCommand() {
    for (const id of this.state.selectedIds) {
      const ship = this.state.ships.get(id);
      if (ship) { ship.holdPosition = true; ship.moveTarget = null; }
    }
  }

  // ── Raycasting ─────────────────────────────────────────────
  private screenToWorld(clientX: number, clientY: number): THREE.Vector3 | null {
    const rect = this.container.getBoundingClientRect();
    const ndc = new THREE.Vector2(
      ((clientX - rect.left) / rect.width) * 2 - 1,
      -((clientY - rect.top) / rect.height) * 2 + 1,
    );
    this.raycaster.setFromCamera(ndc, this.camera);
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const target = new THREE.Vector3();
    this.raycaster.ray.intersectPlane(plane, target);
    return target;
  }

  private worldToScreen(x: number, y: number, z: number): { x: number; y: number } | null {
    const pos = new THREE.Vector3(x * WORLD_SCALE, z * WORLD_SCALE, y * WORLD_SCALE);
    pos.project(this.camera);
    const rect = this.container.getBoundingClientRect();
    return {
      x: (pos.x + 1) * 0.5 * rect.width + rect.left,
      y: (1 - (pos.y + 1) * 0.5) * rect.height + rect.top,
    };
  }

  private findShipAtScreen(clientX: number, clientY: number) {
    const worldPos = this.screenToWorld(clientX, clientY);
    if (!worldPos) return null;
    const wx = worldPos.x / WORLD_SCALE;
    const wy = worldPos.z / WORLD_SCALE;
    let closest: { id: number; dist: number } | null = null;
    for (const [id, ship] of this.state.ships) {
      if (ship.dead) continue;
      const dx = ship.x - wx, dy = ship.y - wy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 30 && (!closest || dist < closest.dist)) {
        closest = { id, dist };
      }
    }
    return closest ? this.state.ships.get(closest.id)! : null;
  }

  dispose() {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
  }
}
