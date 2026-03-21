import * as THREE from 'three';
import type { SpaceGameState, SelectionBox, CameraState, Vec3, Command } from './space-types';

const WORLD_SCALE = 0.05;
const EDGE_SCROLL_ZONE = 30;
const EDGE_SCROLL_SPEED = 800;
const CAMERA_PAN_SPEED = 600;
const ZOOM_SPEED = 8;

export class SpaceControls {
  selectionBox: SelectionBox = { active: false, startX: 0, startY: 0, endX: 0, endY: 0 };
  cameraState: CameraState = { x: 0, y: 0, z: 0, zoom: 200, minZoom: 35, maxZoom: 700, angle: 55, bookmarks: [] };

  private container: HTMLElement;
  private camera: THREE.PerspectiveCamera;
  private state: SpaceGameState;
  private renderer: THREE.WebGLRenderer;
  private raycaster = new THREE.Raycaster();
  private mouseNdc = new THREE.Vector2();
  private keys = new Set<string>();
  private mouseDown = false;
  private rightMouseDown = false;
  private commandMode: 'normal' | 'attack_move' | 'patrol' = 'normal';

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

  private onWheel = (e: WheelEvent) => {
    e.preventDefault();
    this.cameraState.zoom = Math.max(this.cameraState.minZoom, Math.min(this.cameraState.maxZoom, this.cameraState.zoom + e.deltaY * 0.1));
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

    switch (e.key.toLowerCase()) {
      case 'a': this.commandMode = 'attack_move'; break;
      case 's': this.issueStopCommand(); break;
      case 'h': this.issueHoldCommand(); break;
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
    // WASD camera movement
    let dx = 0, dy = 0;
    if (this.keys.has('w') || this.keys.has('arrowup')) dy -= CAMERA_PAN_SPEED * dt;
    if (this.keys.has('s') || this.keys.has('arrowdown')) dy += CAMERA_PAN_SPEED * dt;
    if (this.keys.has('a') || this.keys.has('arrowleft')) dx -= CAMERA_PAN_SPEED * dt;
    if (this.keys.has('d') || this.keys.has('arrowright')) dx += CAMERA_PAN_SPEED * dt;
    this.cameraState.x += dx;
    this.cameraState.y += dy;

    // Edge scroll
    const rect = this.container.getBoundingClientRect();
    const mx = (this.mouseNdc.x + 1) * 0.5 * rect.width;
    const my = (1 - (this.mouseNdc.y + 1) * 0.5) * rect.height;
    if (mx < EDGE_SCROLL_ZONE) this.cameraState.x -= EDGE_SCROLL_SPEED * dt;
    if (mx > rect.width - EDGE_SCROLL_ZONE) this.cameraState.x += EDGE_SCROLL_SPEED * dt;
    if (my < EDGE_SCROLL_ZONE) this.cameraState.y -= EDGE_SCROLL_SPEED * dt;
    if (my > rect.height - EDGE_SCROLL_ZONE) this.cameraState.y += EDGE_SCROLL_SPEED * dt;
  }

  // ── Selection ──────────────────────────────────────────────
  private performSelection(e: MouseEvent) {
    const box = this.selectionBox;
    const w = Math.abs(box.endX - box.startX);
    const h = Math.abs(box.endY - box.startY);

    if (!e.shiftKey) this.clearSelection();

    if (w < 5 && h < 5) {
      // Click select
      const ship = this.findShipAtScreen(e.clientX, e.clientY);
      if (ship && ship.team === 1) {
        ship.selected = true;
        this.state.selectedIds.add(ship.id);
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
