/**
 * ground-rts-renderer.ts — 2D Canvas renderer for Top-Down RTS Micro Wars.
 *
 * Renders: tilemap, unit sprites (frame animation), health bars, selection rings,
 * projectiles, floating damage numbers, minimap, map objects.
 */

import type { GroundRTSState, RTSUnit, SpriteAnim, Vec2, Projectile, FloatText } from './ground-rts-types';
import { TEAM_COLORS, TILE_PATHS } from './ground-rts-types';

// ── Image Cache ──────────────────────────────────────────────────────
const imageCache = new Map<string, HTMLImageElement>();
const loadingImages = new Set<string>();

function getImage(path: string): HTMLImageElement | null {
  if (imageCache.has(path)) return imageCache.get(path)!;
  if (loadingImages.has(path)) return null;
  loadingImages.add(path);
  const img = new Image();
  img.src = path;
  img.onload = () => {
    imageCache.set(path, img);
    loadingImages.delete(path);
  };
  img.onerror = () => {
    loadingImages.delete(path);
  };
  return null;
}

function getSpriteFrame(anim: SpriteAnim, frame: number): string {
  const actualFrame = (anim.startFrame ?? 0) + frame;
  const idx = String(actualFrame).padStart(anim.pad ?? 3, '0');
  const suffix = anim.suffix ?? '';
  return `${anim.basePath}/${anim.prefix}${idx}${suffix}.png`;
}

// ── Camera ───────────────────────────────────────────────────────────
export interface Camera {
  x: number; // world-space center X
  y: number; // world-space center Y
  zoom: number; // 1.0 = 100%, 0.5 = zoomed out
}

export function createCamera(mapW: number, mapH: number): Camera {
  return { x: mapW / 2, y: mapH / 2, zoom: 0.5 };
}

// ── Main Render ──────────────────────────────────────────────────────
export function renderGroundRTS(
  ctx: CanvasRenderingContext2D,
  state: GroundRTSState,
  camera: Camera,
  canvasW: number,
  canvasH: number,
  selectionBox: { x1: number; y1: number; x2: number; y2: number } | null,
): void {
  ctx.clearRect(0, 0, canvasW, canvasH);

  // World transform
  ctx.save();
  const scale = camera.zoom;
  const offX = canvasW / 2 - camera.x * scale;
  const offY = canvasH / 2 - camera.y * scale;
  ctx.translate(offX, offY);
  ctx.scale(scale, scale);

  // Compute viewport for culling
  _vp = getViewport(camera, canvasW, canvasH);

  renderTilemap(ctx, state);
  renderMapObjects(ctx, state);
  renderUnits(ctx, state);
  renderProjectiles(ctx, state);
  renderFloatTexts(ctx, state);

  ctx.restore();

  // UI overlays (screen-space)
  if (selectionBox) renderSelectionBox(ctx, selectionBox);
  renderMinimap(ctx, state, camera, canvasW, canvasH);
  renderHUD(ctx, state, canvasW, canvasH);
}

// ── Viewport Culling Helper ───────────────────────────────────────
function getViewport(camera: Camera, canvasW: number, canvasH: number): { x1: number; y1: number; x2: number; y2: number } {
  const halfW = canvasW / camera.zoom / 2;
  const halfH = canvasH / camera.zoom / 2;
  return { x1: camera.x - halfW, y1: camera.y - halfH, x2: camera.x + halfW, y2: camera.y + halfH };
}

// Store viewport for culling during world-space rendering
let _vp = { x1: 0, y1: 0, x2: 9999, y2: 9999 };

// ── Tilemap (per-cell type, viewport culled, impassable overlay) ────
function renderTilemap(ctx: CanvasRenderingContext2D, state: GroundRTSState): void {
  const ts = state.tileSize;
  const typeGrid: string[][] | undefined = (state as any)._tileTypeGrid;
  const cStart = Math.max(0, Math.floor(_vp.x1 / ts));
  const cEnd = Math.min(state.tileCols - 1, Math.ceil(_vp.x2 / ts));
  const rStart = Math.max(0, Math.floor(_vp.y1 / ts));
  const rEnd = Math.min(state.tileRows - 1, Math.ceil(_vp.y2 / ts));

  for (let r = rStart; r <= rEnd; r++) {
    for (let c = cStart; c <= cEnd; c++) {
      const tileIdx = state.tileGrid[r][c];
      const walkVal = state.walkGrid[r]?.[c] ?? 0;
      // Determine which tileset to use per cell
      const cellType = (typeGrid?.[r]?.[c] ?? state.tileType) as 'sand' | 'ground' | 'stones' | 'water';
      const paths = TILE_PATHS[cellType];
      const path = paths[tileIdx % paths.length];
      const img = getImage(path);
      const x = c * ts;
      const y = r * ts;

      if (img) {
        ctx.drawImage(img, x, y, ts, ts);
      } else {
        // Placeholder color per type
        const placeholders: Record<string, string> = { sand: '#c4a86a', ground: '#8a7a5a', stones: '#6a6a6a', water: '#1a2a4a' };
        ctx.fillStyle = placeholders[cellType] ?? '#c4a86a';
        ctx.fillRect(x, y, ts, ts);
      }

      // Darken impassable tiles (water = black/dark overlay)
      if (walkVal === 2) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
        ctx.fillRect(x, y, ts, ts);
      }
      // Slight tint on slow tiles
      else if (walkVal === 1) {
        ctx.fillStyle = 'rgba(80, 60, 20, 0.15)';
        ctx.fillRect(x, y, ts, ts);
      }
    }
  }
}

// ── Map Objects ──────────────────────────────────────────────────────
function renderMapObjects(ctx: CanvasRenderingContext2D, state: GroundRTSState): void {
  for (const obj of state.mapObjects) {
    const img = getImage(obj.spritePath);
    if (img) {
      ctx.drawImage(img, obj.x - obj.width / 2, obj.y - obj.height / 2, obj.width, obj.height);
    } else {
      ctx.fillStyle = obj.blocking ? '#665544' : '#446633';
      ctx.fillRect(obj.x - obj.width / 2, obj.y - obj.height / 2, obj.width, obj.height);
    }
  }
}

// ── Units ────────────────────────────────────────────────────────────
function renderUnits(ctx: CanvasRenderingContext2D, state: GroundRTSState): void {
  // Sort: dead units first (draw underneath), then by Y for depth
  const sorted = [...state.units.values()].sort((a, b) => {
    if (a.state === 'dead' && b.state !== 'dead') return -1;
    if (b.state === 'dead' && a.state !== 'dead') return 1;
    return a.y - b.y;
  });

  for (const unit of sorted) {
    renderUnit(ctx, unit, state);
  }
}

function renderUnit(ctx: CanvasRenderingContext2D, unit: RTSUnit, _state: GroundRTSState): void {
  const sz = unit.def.spriteSize;
  const halfSz = sz / 2;

  // Viewport culling — skip units fully off-screen
  if (unit.x + halfSz < _vp.x1 || unit.x - halfSz > _vp.x2 || unit.y + halfSz < _vp.y1 || unit.y - halfSz > _vp.y2) return;

  // Get current animation
  let anim: SpriteAnim;
  if (unit.state === 'dying' || unit.state === 'dead') {
    anim = unit.def.anims.death;
  } else if (unit.state === 'attacking') {
    anim = unit.def.anims.attack;
  } else if (unit.state === 'walking') {
    anim = unit.def.anims.walk;
  } else {
    anim = unit.def.anims.idle ?? unit.def.anims.walk;
  }

  const framePath = getSpriteFrame(anim, Math.min(unit.animFrame, anim.frames - 1));
  const img = getImage(framePath);

  ctx.save();
  ctx.translate(unit.x, unit.y);

  // Team tint shadow under unit
  if (unit.state !== 'dead') {
    ctx.fillStyle = unit.team === 0 ? 'rgba(68,136,255,0.15)' : 'rgba(255,68,68,0.15)';
    ctx.beginPath();
    ctx.ellipse(0, halfSz * 0.3, halfSz * 0.5, halfSz * 0.2, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Selection ring
  if (unit.selected && unit.state !== 'dead' && unit.state !== 'dying') {
    ctx.strokeStyle = '#44ff44';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, halfSz * 0.7, 0, Math.PI * 2);
    ctx.stroke();
    // Attack range indicator
    if (unit.def.attackType !== 'melee') {
      ctx.strokeStyle = 'rgba(255,255,68,0.08)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(0, 0, unit.def.attackRange, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  // Rotate sprite to face direction
  ctx.rotate(unit.facing + Math.PI / 2); // sprites face up by default

  // Draw sprite (or placeholder)
  if (img) {
    if (unit.state === 'dead') ctx.globalAlpha = 0.4;
    else if (unit.state === 'dying') ctx.globalAlpha = 0.6;
    ctx.drawImage(img, -halfSz, -halfSz, sz, sz);
    ctx.globalAlpha = 1;
  } else {
    // Placeholder: team-colored circle with class indicator
    const col = TEAM_COLORS[unit.team];
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.arc(0, 0, halfSz * 0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    // Facing arrow
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.moveTo(-3, 2);
    ctx.lineTo(0, -halfSz * 0.6);
    ctx.lineTo(3, 2);
    ctx.closePath();
    ctx.fill();
  }

  ctx.restore();

  // Health bar (above unit, in world space) — always show for enemies, only when damaged for player
  const showHp = unit.state !== 'dead' && unit.state !== 'dying' && (unit.team === 1 || unit.hp < unit.maxHp);
  if (showHp) {
    const barW = sz * 0.8;
    const barH = unit.def.tier >= 4 ? 6 : 4;
    const barX = unit.x - barW / 2;
    const barY = unit.y - halfSz - 10;
    const pct = unit.hp / unit.maxHp;

    ctx.fillStyle = '#111';
    ctx.fillRect(barX - 1, barY - 1, barW + 2, barH + 2);
    ctx.fillStyle = '#333';
    ctx.fillRect(barX, barY, barW, barH);
    ctx.fillStyle = pct > 0.5 ? '#44ff44' : pct > 0.25 ? '#ffaa00' : '#ff4444';
    ctx.fillRect(barX, barY, barW * pct, barH);

    // Boss name tag
    if (unit.def.tier >= 4) {
      ctx.fillStyle = '#ff8844';
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(unit.def.displayName, unit.x, barY - 4);
    }
  }

  // Move target indicator for selected units
  if (unit.selected && unit.moveTarget && unit.state !== 'dead') {
    ctx.strokeStyle = 'rgba(68, 255, 68, 0.25)';
    ctx.lineWidth = 1;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(unit.x, unit.y);
    ctx.lineTo(unit.moveTarget.x, unit.moveTarget.y);
    ctx.stroke();
    ctx.setLineDash([]);
    // Target marker
    ctx.strokeStyle = 'rgba(68, 255, 68, 0.4)';
    ctx.beginPath();
    ctx.arc(unit.moveTarget.x, unit.moveTarget.y, 6, 0, Math.PI * 2);
    ctx.stroke();
  }
}

// ── Projectiles ──────────────────────────────────────────────────────
function renderProjectiles(ctx: CanvasRenderingContext2D, state: GroundRTSState): void {
  for (const [, proj] of state.projectiles) {
    ctx.fillStyle = proj.color;
    ctx.beginPath();
    ctx.arc(proj.x, proj.y, proj.radius, 0, Math.PI * 2);
    ctx.fill();

    // Glow
    ctx.fillStyle = proj.color + '44';
    ctx.beginPath();
    ctx.arc(proj.x, proj.y, proj.radius * 3, 0, Math.PI * 2);
    ctx.fill();
  }
}

// ── Float Texts ──────────────────────────────────────────────────────
function renderFloatTexts(ctx: CanvasRenderingContext2D, state: GroundRTSState): void {
  for (const ft of state.floatTexts) {
    const alpha = 1 - ft.age / 1.2;
    ctx.globalAlpha = Math.max(0, alpha);
    ctx.fillStyle = ft.color;
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(ft.text, ft.x, ft.y);
  }
  ctx.globalAlpha = 1;
}

// ── Selection Box ────────────────────────────────────────────────────
function renderSelectionBox(ctx: CanvasRenderingContext2D, box: { x1: number; y1: number; x2: number; y2: number }): void {
  const x = Math.min(box.x1, box.x2);
  const y = Math.min(box.y1, box.y2);
  const w = Math.abs(box.x2 - box.x1);
  const h = Math.abs(box.y2 - box.y1);
  ctx.strokeStyle = '#44ff44';
  ctx.lineWidth = 1;
  ctx.strokeRect(x, y, w, h);
  ctx.fillStyle = 'rgba(68, 255, 68, 0.1)';
  ctx.fillRect(x, y, w, h);
}

// ── Minimap ──────────────────────────────────────────────────────────
function renderMinimap(ctx: CanvasRenderingContext2D, state: GroundRTSState, camera: Camera, canvasW: number, canvasH: number): void {
  const mmW = 180;
  const mmH = 135;
  const mmX = canvasW - mmW - 10;
  const mmY = canvasH - mmH - 10;
  const scaleX = mmW / state.mapWidth;
  const scaleY = mmH / state.mapHeight;

  // Background
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.fillRect(mmX, mmY, mmW, mmH);

  // Walk grid overlay on minimap
  const cellW = mmW / state.tileCols;
  const cellH = mmH / state.tileRows;
  for (let r = 0; r < state.tileRows; r++) {
    for (let c = 0; c < state.tileCols; c++) {
      const walk = state.walkGrid[r]?.[c] ?? 0;
      if (walk === 2) {
        ctx.fillStyle = 'rgba(10, 20, 40, 0.9)';
        ctx.fillRect(mmX + c * cellW, mmY + r * cellH, cellW, cellH);
      } else if (walk === 1) {
        ctx.fillStyle = 'rgba(80, 70, 40, 0.4)';
        ctx.fillRect(mmX + c * cellW, mmY + r * cellH, cellW, cellH);
      } else {
        ctx.fillStyle = 'rgba(120, 100, 60, 0.3)';
        ctx.fillRect(mmX + c * cellW, mmY + r * cellH, cellW, cellH);
      }
    }
  }

  ctx.strokeStyle = '#555';
  ctx.lineWidth = 1;
  ctx.strokeRect(mmX, mmY, mmW, mmH);

  // Units
  for (const [, unit] of state.units) {
    if (unit.state === 'dead') continue;
    ctx.fillStyle = TEAM_COLORS[unit.team];
    const ux = mmX + unit.x * scaleX;
    const uy = mmY + unit.y * scaleY;
    const r = unit.def.tier >= 4 ? 3 : unit.def.tier >= 3 ? 2.5 : 2;
    ctx.fillRect(ux - r / 2, uy - r / 2, r, r);
  }

  // Camera viewport box
  const vpW = canvasW / camera.zoom;
  const vpH = canvasH / camera.zoom;
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 1;
  ctx.strokeRect(mmX + (camera.x - vpW / 2) * scaleX, mmY + (camera.y - vpH / 2) * scaleY, vpW * scaleX, vpH * scaleY);
}

// ── HUD ──────────────────────────────────────────────────────────────
function renderHUD(ctx: CanvasRenderingContext2D, state: GroundRTSState, canvasW: number, _canvasH: number): void {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
  ctx.fillRect(0, 0, canvasW, 36);

  ctx.fillStyle = '#fff';
  ctx.font = 'bold 14px monospace';
  ctx.textAlign = 'left';
  ctx.fillText(`Wave ${state.wave}`, 12, 24);
  ctx.fillText(`Kills: ${state.kills}`, 120, 24);
  ctx.fillText(`Enemies: ${state.enemiesAlive}`, 240, 24);

  const mins = Math.floor(state.gameTime / 60);
  const secs = Math.floor(state.gameTime % 60);
  ctx.textAlign = 'right';
  ctx.fillText(`${mins}:${String(secs).padStart(2, '0')}`, canvasW - 12, 24);

  if (!state.waveActive && state.wave > 0) {
    ctx.textAlign = 'center';
    ctx.fillStyle = '#44ff88';
    ctx.fillText(`Next wave in ${Math.ceil(state.waveTimer)}s`, canvasW / 2, 24);
  }

  if (state.gameOver) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvasW, _canvasH);
    ctx.fillStyle = state.victory ? '#44ff44' : '#ff4444';
    ctx.font = 'bold 48px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(state.victory ? 'VICTORY' : 'DEFEAT', canvasW / 2, _canvasH / 2 - 20);
    ctx.fillStyle = '#fff';
    ctx.font = '20px monospace';
    ctx.fillText(`Wave ${state.wave} — ${state.kills} kills`, canvasW / 2, _canvasH / 2 + 20);
    ctx.fillText('Press R to restart', canvasW / 2, _canvasH / 2 + 55);
  }
}

// ── Screen ↔ World conversion ────────────────────────────────────────
export function screenToWorld(sx: number, sy: number, camera: Camera, canvasW: number, canvasH: number): Vec2 {
  const offX = canvasW / 2 - camera.x * camera.zoom;
  const offY = canvasH / 2 - camera.y * camera.zoom;
  return {
    x: (sx - offX) / camera.zoom,
    y: (sy - offY) / camera.zoom,
  };
}
