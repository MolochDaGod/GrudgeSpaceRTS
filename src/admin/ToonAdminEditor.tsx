/**
 * ToonAdminEditor.tsx — Grudge Smash Character Pixel Editor
 *
 * The single source of truth for character moves, colliders, effects,
 * and model hierarchy.  All data lives in the ToonCharacter JSON shape
 * defined in toon-types.ts.
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import type {
  ToonCharacter,
  ToonPart,
  ToonCollider,
  ToonAttack,
  ToonEffect,
  ToonAnimation,
  ColliderType,
  EffectType,
} from './toon-types';
import {
  createDefaultCharacter,
  createEmptyFrame,
  createEmptyPixelGrid,
  base64ToUint8,
  uint8ToBase64,
  COLLIDER_COLORS,
} from './toon-types';

// ── Drawing Tools ─────────────────────────────────────────────────
type DrawTool = 'pencil' | 'eraser' | 'fill' | 'picker' | 'line' | 'rect';
type SelectionKind = 'part' | 'collider' | 'attack' | 'effect' | null;

// ── Shared Styles (matches AdminApp aesthetic) ────────────────────
const S = {
  input: {
    padding: '4px 8px',
    background: 'rgba(6,14,30,0.9)',
    border: '1px solid #1a3050',
    borderRadius: 4,
    color: '#cde',
    fontSize: 11,
    outline: 'none',
  } as React.CSSProperties,
  btn: (color = '#4488ff') =>
    ({
      padding: '4px 12px',
      borderRadius: 4,
      border: `1px solid ${color}66`,
      background: `${color}18`,
      color,
      cursor: 'pointer',
      fontSize: 10,
      fontWeight: 700,
      letterSpacing: 0.5,
    }) as React.CSSProperties,
  label: { fontSize: 9, color: '#68a', letterSpacing: 0.5 } as React.CSSProperties,
  sectionTitle: { fontSize: 11, fontWeight: 800, color: '#4488ff', letterSpacing: 1.5, marginBottom: 6 } as React.CSSProperties,
  panel: {
    background: 'rgba(4,10,22,0.95)',
    border: '1px solid #1a3050',
    borderRadius: 6,
    padding: 8,
  } as React.CSSProperties,
};

// ── Helpers ───────────────────────────────────────────────────────
function hexToRgba(hex: string): [number, number, number, number] {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  const a = h.length >= 8 ? parseInt(h.slice(6, 8), 16) : 255;
  return [r, g, b, a];
}

function rgbaToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('');
}

let _uid = 1;
function uid(prefix: string) {
  return `${prefix}_${Date.now()}_${_uid++}`;
}

// ── Hierarchy Tree Panel ──────────────────────────────────────────
function HierarchyTree({
  char,
  selectedPartId,
  onSelectPart,
  onAddPart,
  onRemovePart,
}: {
  char: ToonCharacter;
  selectedPartId: string | null;
  onSelectPart: (id: string) => void;
  onAddPart: (parentId: string) => void;
  onRemovePart: (id: string) => void;
}) {
  const renderNode = (partId: string, depth: number) => {
    const part = char.parts[partId];
    if (!part) return null;
    const isSel = partId === selectedPartId;
    return (
      <div key={partId}>
        <div
          onClick={() => onSelectPart(partId)}
          style={{
            padding: '3px 6px',
            paddingLeft: 6 + depth * 14,
            cursor: 'pointer',
            background: isSel ? 'rgba(68,136,255,0.15)' : 'transparent',
            borderLeft: isSel ? '2px solid #4488ff' : '2px solid transparent',
            color: isSel ? '#4df' : part.visible ? '#8ac' : '#445',
            fontSize: 10,
            fontWeight: isSel ? 700 : 400,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <span style={{ opacity: 0.4 }}>{part.children.length > 0 ? '▸' : '·'}</span>
          <span style={{ flex: 1 }}>{part.name}</span>
          <span style={{ fontSize: 8, color: '#445' }}>z{part.zOrder}</span>
        </div>
        {part.children.map((cid) => renderNode(cid, depth + 1))}
      </div>
    );
  };

  return (
    <div style={S.panel}>
      <div style={S.sectionTitle}>HIERARCHY</div>
      {char.rootParts.map((id) => renderNode(id, 0))}
      <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
        <button
          onClick={() => {
            const parent = selectedPartId ?? char.rootParts[0];
            if (parent) onAddPart(parent);
          }}
          style={S.btn('#44ee88')}
        >
          + PART
        </button>
        {selectedPartId && !char.rootParts.includes(selectedPartId) && (
          <button onClick={() => onRemovePart(selectedPartId)} style={S.btn('#ff4444')}>
            DEL
          </button>
        )}
      </div>
    </div>
  );
}

// ── Properties Inspector ──────────────────────────────────────────
function PropsPanel({
  char,
  selKind,
  selId,
  onUpdatePart,
  onUpdateCollider,
  onUpdateAttack,
  onUpdateEffect,
}: {
  char: ToonCharacter;
  selKind: SelectionKind;
  selId: string | null;
  onUpdatePart: (id: string, patch: Partial<ToonPart>) => void;
  onUpdateCollider: (id: string, patch: Partial<ToonCollider>) => void;
  onUpdateAttack: (id: string, patch: Partial<ToonAttack>) => void;
  onUpdateEffect: (id: string, patch: Partial<ToonEffect>) => void;
}) {
  if (!selId) return <div style={{ ...S.panel, color: '#445', fontSize: 10 }}>Select an item</div>;

  const numField = (label: string, value: number, onChange: (v: number) => void, width = 50) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      <span style={S.label}>{label}</span>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(+e.target.value)}
        style={{ ...S.input, width }}
      />
    </div>
  );

  const textField = (label: string, value: string, onChange: (v: string) => void) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      <span style={{ ...S.label, width: 36 }}>{label}</span>
      <input value={value} onChange={(e) => onChange(e.target.value)} style={{ ...S.input, flex: 1 }} />
    </div>
  );

  if (selKind === 'part') {
    const p = char.parts[selId];
    if (!p) return null;
    return (
      <div style={S.panel}>
        <div style={S.sectionTitle}>PART — {p.name}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {textField('Name', p.name, (v) => onUpdatePart(selId, { name: v }))}
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {numField('X', p.offsetX, (v) => onUpdatePart(selId, { offsetX: v }))}
            {numField('Y', p.offsetY, (v) => onUpdatePart(selId, { offsetY: v }))}
            {numField('Scale', p.scale, (v) => onUpdatePart(selId, { scale: v }), 40)}
            {numField('Z', p.zOrder, (v) => onUpdatePart(selId, { zOrder: v }), 35)}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={S.label}>Visible</span>
            <button onClick={() => onUpdatePart(selId, { visible: !p.visible })} style={S.btn(p.visible ? '#44ee88' : '#ff4444')}>
              {p.visible ? 'ON' : 'OFF'}
            </button>
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            {numField('PxW', p.pixels.width, () => {}, 40)}
            {numField('PxH', p.pixels.height, () => {}, 40)}
          </div>
        </div>
      </div>
    );
  }

  if (selKind === 'collider') {
    const c = char.colliders[selId];
    if (!c) return null;
    return (
      <div style={S.panel}>
        <div style={{ ...S.sectionTitle, color: COLLIDER_COLORS[c.type] }}>COLLIDER — {c.name}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {textField('Name', c.name, (v) => onUpdateCollider(selId, { name: v }))}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={S.label}>Type</span>
            <select
              value={c.type}
              onChange={(e) => onUpdateCollider(selId, { type: e.target.value as ColliderType })}
              style={{ ...S.input, width: 80 }}
            >
              <option value="hitbox">Hitbox</option>
              <option value="hurtbox">Hurtbox</option>
              <option value="pushbox">Pushbox</option>
            </select>
          </div>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {numField('X', c.x, (v) => onUpdateCollider(selId, { x: v }))}
            {numField('Y', c.y, (v) => onUpdateCollider(selId, { y: v }))}
            {numField('W', c.w, (v) => onUpdateCollider(selId, { w: v }))}
            {numField('H', c.h, (v) => onUpdateCollider(selId, { h: v }))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={S.label}>Part</span>
            <select
              value={c.attachedToPart ?? ''}
              onChange={(e) => onUpdateCollider(selId, { attachedToPart: e.target.value || null })}
              style={{ ...S.input, width: 80 }}
            >
              <option value="">None</option>
              {Object.keys(char.parts).map((pid) => (
                <option key={pid} value={pid}>{char.parts[pid].name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
    );
  }

  if (selKind === 'attack') {
    const a = char.attacks[selId];
    if (!a) return null;
    return (
      <div style={S.panel}>
        <div style={{ ...S.sectionTitle, color: '#ff8822' }}>ATTACK — {a.name}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {textField('Name', a.name, (v) => onUpdateAttack(selId, { name: v }))}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={S.label}>Anim</span>
            <select
              value={a.animationId}
              onChange={(e) => onUpdateAttack(selId, { animationId: e.target.value })}
              style={{ ...S.input, width: 90 }}
            >
              {Object.keys(char.animations).map((aid) => (
                <option key={aid} value={aid}>{char.animations[aid].name}</option>
              ))}
            </select>
          </div>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {numField('DMG', a.damage, (v) => onUpdateAttack(selId, { damage: v }))}
            {numField('KBx', a.knockbackX, (v) => onUpdateAttack(selId, { knockbackX: v }))}
            {numField('KBy', a.knockbackY, (v) => onUpdateAttack(selId, { knockbackY: v }))}
          </div>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {numField('Start', a.startupFrame, (v) => onUpdateAttack(selId, { startupFrame: v }), 35)}
            {numField('ActS', a.activeFrameStart, (v) => onUpdateAttack(selId, { activeFrameStart: v }), 35)}
            {numField('ActE', a.activeFrameEnd, (v) => onUpdateAttack(selId, { activeFrameEnd: v }), 35)}
            {numField('Rec', a.recoveryFrame, (v) => onUpdateAttack(selId, { recoveryFrame: v }), 35)}
          </div>
        </div>
      </div>
    );
  }

  if (selKind === 'effect') {
    const fx = char.effects[selId];
    if (!fx) return null;
    return (
      <div style={S.panel}>
        <div style={{ ...S.sectionTitle, color: '#aa44ff' }}>EFFECT — {fx.name}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {textField('Name', fx.name, (v) => onUpdateEffect(selId, { name: v }))}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={S.label}>Type</span>
            <select
              value={fx.type}
              onChange={(e) => onUpdateEffect(selId, { type: e.target.value as EffectType })}
              style={{ ...S.input, width: 80 }}
            >
              <option value="particle">Particle</option>
              <option value="flash">Flash</option>
              <option value="shake">Shake</option>
              <option value="trail">Trail</option>
              <option value="burst">Burst</option>
            </select>
          </div>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {numField('X', fx.offsetX, (v) => onUpdateEffect(selId, { offsetX: v }))}
            {numField('Y', fx.offsetY, (v) => onUpdateEffect(selId, { offsetY: v }))}
            {numField('Size', fx.size, (v) => onUpdateEffect(selId, { size: v }))}
            {numField('Ms', fx.durationMs, (v) => onUpdateEffect(selId, { durationMs: v }), 55)}
            {numField('Frame', fx.spawnFrame, (v) => onUpdateEffect(selId, { spawnFrame: v }), 40)}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={S.label}>Color</span>
            <input
              type="color"
              value={fx.color}
              onChange={(e) => onUpdateEffect(selId, { color: e.target.value })}
              style={{ width: 24, height: 20, border: 'none', background: 'transparent', cursor: 'pointer' }}
            />
          </div>
        </div>
      </div>
    );
  }

  return null;
}

// ── Timeline Panel ────────────────────────────────────────────────
function TimelinePanel({
  anim,
  currentFrame,
  onSelectFrame,
  onAddFrame,
  onDuplicateFrame,
  onDeleteFrame,
  playing,
  onTogglePlay,
  onChangeFps,
  allAnims,
  currentAnimId,
  onSelectAnim,
  onAddAnim,
}: {
  anim: ToonAnimation;
  currentFrame: number;
  onSelectFrame: (i: number) => void;
  onAddFrame: () => void;
  onDuplicateFrame: () => void;
  onDeleteFrame: () => void;
  playing: boolean;
  onTogglePlay: () => void;
  onChangeFps: (fps: number) => void;
  allAnims: Record<string, ToonAnimation>;
  currentAnimId: string;
  onSelectAnim: (id: string) => void;
  onAddAnim: () => void;
}) {
  return (
    <div style={{ ...S.panel, display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        <span style={S.sectionTitle}>TIMELINE</span>
        <select
          value={currentAnimId}
          onChange={(e) => onSelectAnim(e.target.value)}
          style={{ ...S.input, width: 100 }}
        >
          {Object.values(allAnims).map((a) => (
            <option key={a.id} value={a.id}>{a.name}</option>
          ))}
        </select>
        <button onClick={onAddAnim} style={S.btn('#44ee88')}>+ ANIM</button>
        <button onClick={onTogglePlay} style={S.btn(playing ? '#ff4444' : '#44ee88')}>
          {playing ? '■ STOP' : '▶ PLAY'}
        </button>
        <span style={S.label}>FPS</span>
        <input
          type="number"
          value={anim.fps}
          onChange={(e) => onChangeFps(+e.target.value)}
          style={{ ...S.input, width: 40 }}
        />
      </div>
      <div style={{ display: 'flex', gap: 3, overflowX: 'auto', paddingBottom: 4 }}>
        {anim.frames.map((_, i) => (
          <div
            key={i}
            onClick={() => onSelectFrame(i)}
            style={{
              width: 36,
              height: 36,
              borderRadius: 4,
              border: i === currentFrame ? '2px solid #ffcc00' : '1px solid #1a3050',
              background: i === currentFrame ? 'rgba(255,204,0,0.1)' : 'rgba(6,14,30,0.8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              fontSize: 10,
              fontWeight: 700,
              color: i === currentFrame ? '#fc4' : '#68a',
              flexShrink: 0,
            }}
          >
            {i}
          </div>
        ))}
        <div style={{ display: 'flex', gap: 3 }}>
          <button onClick={onAddFrame} style={S.btn('#44ee88')}>+</button>
          <button onClick={onDuplicateFrame} style={S.btn('#4488ff')}>DUP</button>
          {anim.frames.length > 1 && <button onClick={onDeleteFrame} style={S.btn('#ff4444')}>DEL</button>}
        </div>
      </div>
    </div>
  );
}

// ── Main Canvas (Pixel Editor + Collider Gizmos) ──────────────────
function usePixelCanvas(
  char: ToonCharacter,
  selectedPartId: string | null,
  currentAnimId: string,
  currentFrame: number,
  tool: DrawTool,
  color: string,
  zoom: number,
  showGrid: boolean,
  showColliders: boolean,
  showOnionSkin: boolean,
  selectedColliderId: string | null,
  onColliderDrag: (id: string, dx: number, dy: number) => void,
  onColliderResize: (id: string, dw: number, dh: number) => void,
  onPickColor: (hex: string) => void,
  onPixelChange: (partId: string, pixels: Uint8Array) => void,
) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);
  const lastPosRef = useRef<{ px: number; py: number } | null>(null);
  const colliderDragRef = useRef<{ id: string; startX: number; startY: number; mode: 'move' | 'resize' } | null>(null);

  // Get pixel data for active part
  const getActivePixels = useCallback((): { data: Uint8Array; w: number; h: number } | null => {
    if (!selectedPartId) return null;
    const part = char.parts[selectedPartId];
    if (!part) return null;
    const anim = char.animations[currentAnimId];
    const frame = anim?.frames[currentFrame];
    const pg = frame?.partPixels[selectedPartId] ?? part.pixels;
    return { data: base64ToUint8(pg.data), w: pg.width, h: pg.height };
  }, [char, selectedPartId, currentAnimId, currentFrame]);

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = char.spriteWidth * zoom;
    const H = char.spriteHeight * zoom;
    canvas.width = W;
    canvas.height = H;

    // Background
    ctx.fillStyle = '#0a0e1a';
    ctx.fillRect(0, 0, W, H);

    // Checkerboard transparency pattern
    const cs = zoom < 4 ? 4 : zoom;
    for (let y = 0; y < H; y += cs * 2) {
      for (let x = 0; x < W; x += cs * 2) {
        ctx.fillStyle = '#12182a';
        ctx.fillRect(x, y, cs, cs);
        ctx.fillRect(x + cs, y + cs, cs, cs);
      }
    }

    // Onion skin (previous frame)
    if (showOnionSkin && currentFrame > 0) {
      ctx.globalAlpha = 0.2;
      drawCharacterFrame(ctx, char, currentAnimId, currentFrame - 1, zoom);
      ctx.globalAlpha = 1.0;
    }

    // Draw all parts for current frame
    drawCharacterFrame(ctx, char, currentAnimId, currentFrame, zoom);

    // Grid overlay
    if (showGrid && zoom >= 4) {
      ctx.strokeStyle = 'rgba(68,136,255,0.12)';
      ctx.lineWidth = 0.5;
      for (let x = 0; x <= W; x += zoom) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
      }
      for (let y = 0; y <= H; y += zoom) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
      }
    }

    // Collider overlays
    if (showColliders) {
      for (const c of Object.values(char.colliders)) {
        const isActive = c.activeFrames === null || c.activeFrames.includes(currentFrame);
        if (!isActive) continue;
        const col = COLLIDER_COLORS[c.type];
        const isSel = c.id === selectedColliderId;
        ctx.strokeStyle = col;
        ctx.lineWidth = isSel ? 2 : 1;
        ctx.fillStyle = col + '22';
        ctx.fillRect(c.x * zoom, c.y * zoom, c.w * zoom, c.h * zoom);
        ctx.strokeRect(c.x * zoom, c.y * zoom, c.w * zoom, c.h * zoom);

        // Label
        ctx.fillStyle = col;
        ctx.font = `bold ${Math.max(8, zoom * 0.8)}px monospace`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText(c.name, c.x * zoom + 2, c.y * zoom + 1);

        // Resize handle (bottom-right)
        if (isSel) {
          const hx = (c.x + c.w) * zoom - 6;
          const hy = (c.y + c.h) * zoom - 6;
          ctx.fillStyle = '#ffcc00';
          ctx.fillRect(hx, hy, 6, 6);
        }
      }
    }
  }, [char, currentAnimId, currentFrame, zoom, showGrid, showColliders, showOnionSkin, selectedColliderId]);

  useEffect(() => { redraw(); }, [redraw]);

  // Mouse handlers
  const toPixel = (e: React.MouseEvent): { px: number; py: number } | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    return { px: Math.floor(mx / zoom), py: Math.floor(my / zoom) };
  };

  const hitTestColliderHandle = (e: React.MouseEvent): { id: string; mode: 'move' | 'resize' } | null => {
    if (!showColliders) return null;
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    for (const c of Object.values(char.colliders)) {
      // Resize handle
      const hx = (c.x + c.w) * zoom - 6;
      const hy = (c.y + c.h) * zoom - 6;
      if (mx >= hx && mx <= hx + 8 && my >= hy && my <= hy + 8) {
        return { id: c.id, mode: 'resize' };
      }
      // Move (body)
      if (mx >= c.x * zoom && mx <= (c.x + c.w) * zoom && my >= c.y * zoom && my <= (c.y + c.h) * zoom) {
        return { id: c.id, mode: 'move' };
      }
    }
    return null;
  };

  const setPixel = (data: Uint8Array, w: number, px: number, py: number, rgba: [number, number, number, number]) => {
    if (px < 0 || py < 0 || px >= w || py >= (data.length / 4 / w)) return;
    const i = (py * w + px) * 4;
    data[i] = rgba[0]; data[i + 1] = rgba[1]; data[i + 2] = rgba[2]; data[i + 3] = rgba[3];
  };

  const getPixel = (data: Uint8Array, w: number, px: number, py: number): [number, number, number, number] => {
    const h = data.length / 4 / w;
    if (px < 0 || py < 0 || px >= w || py >= h) return [0, 0, 0, 0];
    const i = (py * w + px) * 4;
    return [data[i], data[i + 1], data[i + 2], data[i + 3]];
  };

  const floodFill = (data: Uint8Array, w: number, px: number, py: number, fillColor: [number, number, number, number]) => {
    const h = data.length / 4 / w;
    const target = getPixel(data, w, px, py);
    if (target[0] === fillColor[0] && target[1] === fillColor[1] && target[2] === fillColor[2] && target[3] === fillColor[3]) return;
    const stack: [number, number][] = [[px, py]];
    const visited = new Set<string>();
    while (stack.length > 0) {
      const [cx, cy] = stack.pop()!;
      const key = `${cx},${cy}`;
      if (visited.has(key)) continue;
      if (cx < 0 || cy < 0 || cx >= w || cy >= h) continue;
      const cur = getPixel(data, w, cx, cy);
      if (cur[0] !== target[0] || cur[1] !== target[1] || cur[2] !== target[2] || cur[3] !== target[3]) continue;
      visited.add(key);
      setPixel(data, w, cx, cy, fillColor);
      stack.push([cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]);
    }
  };

  const onMouseDown = (e: React.MouseEvent) => {
    // Check collider interaction first
    const collHit = hitTestColliderHandle(e);
    if (collHit && e.button === 0) {
      colliderDragRef.current = { id: collHit.id, startX: e.clientX, startY: e.clientY, mode: collHit.mode };
      return;
    }

    if (e.button !== 0) return;
    const pos = toPixel(e);
    if (!pos || !selectedPartId) return;
    const active = getActivePixels();
    if (!active) return;

    isDrawingRef.current = true;
    lastPosRef.current = pos;
    const rgba = tool === 'eraser' ? [0, 0, 0, 0] as [number, number, number, number] : hexToRgba(color);

    if (tool === 'pencil' || tool === 'eraser') {
      // Adjust for part offset
      const part = char.parts[selectedPartId];
      const lpx = pos.px - part.offsetX;
      const lpy = pos.py - part.offsetY;
      setPixel(active.data, active.w, lpx, lpy, rgba);
      onPixelChange(selectedPartId, active.data);
    } else if (tool === 'fill') {
      const part = char.parts[selectedPartId];
      const lpx = pos.px - part.offsetX;
      const lpy = pos.py - part.offsetY;
      floodFill(active.data, active.w, lpx, lpy, rgba);
      onPixelChange(selectedPartId, active.data);
    } else if (tool === 'picker') {
      const part = char.parts[selectedPartId];
      const lpx = pos.px - part.offsetX;
      const lpy = pos.py - part.offsetY;
      const [r, g, b] = getPixel(active.data, active.w, lpx, lpy);
      onPickColor(rgbaToHex(r, g, b));
    }
    redraw();
  };

  const onMouseMove = (e: React.MouseEvent) => {
    // Collider drag
    if (colliderDragRef.current) {
      const dx = Math.round((e.clientX - colliderDragRef.current.startX) / zoom);
      const dy = Math.round((e.clientY - colliderDragRef.current.startY) / zoom);
      if (dx !== 0 || dy !== 0) {
        if (colliderDragRef.current.mode === 'move') {
          onColliderDrag(colliderDragRef.current.id, dx, dy);
        } else {
          onColliderResize(colliderDragRef.current.id, dx, dy);
        }
        colliderDragRef.current.startX = e.clientX;
        colliderDragRef.current.startY = e.clientY;
      }
      return;
    }

    if (!isDrawingRef.current || !selectedPartId) return;
    if (tool !== 'pencil' && tool !== 'eraser') return;
    const pos = toPixel(e);
    if (!pos) return;
    const active = getActivePixels();
    if (!active) return;
    const part = char.parts[selectedPartId];
    const rgba = tool === 'eraser' ? [0, 0, 0, 0] as [number, number, number, number] : hexToRgba(color);

    // Bresenham line from last to current for smooth strokes
    const lp = lastPosRef.current ?? pos;
    const dx = Math.abs(pos.px - lp.px);
    const dy = Math.abs(pos.py - lp.py);
    const sx = lp.px < pos.px ? 1 : -1;
    const sy = lp.py < pos.py ? 1 : -1;
    let err = dx - dy;
    let cx = lp.px, cy = lp.py;
    while (true) {
      setPixel(active.data, active.w, cx - part.offsetX, cy - part.offsetY, rgba);
      if (cx === pos.px && cy === pos.py) break;
      const e2 = 2 * err;
      if (e2 > -dy) { err -= dy; cx += sx; }
      if (e2 < dx) { err += dx; cy += sy; }
    }
    lastPosRef.current = pos;
    onPixelChange(selectedPartId, active.data);
    redraw();
  };

  const onMouseUp = () => {
    isDrawingRef.current = false;
    lastPosRef.current = null;
    colliderDragRef.current = null;
  };

  return { canvasRef, onMouseDown, onMouseMove, onMouseUp };
}

function drawCharacterFrame(
  ctx: CanvasRenderingContext2D,
  char: ToonCharacter,
  animId: string,
  frameIdx: number,
  zoom: number,
) {
  const anim = char.animations[animId];
  const frame = anim?.frames[frameIdx];

  // Collect parts sorted by zOrder
  const allParts = Object.values(char.parts).filter((p) => p.visible).sort((a, b) => a.zOrder - b.zOrder);

  for (const part of allParts) {
    const pg = frame?.partPixels[part.id] ?? part.pixels;
    const off = frame?.partOffsets[part.id];
    const ox = part.offsetX + (off?.dx ?? 0);
    const oy = part.offsetY + (off?.dy ?? 0);
    const data = base64ToUint8(pg.data);

    for (let py = 0; py < pg.height; py++) {
      for (let px = 0; px < pg.width; px++) {
        const i = (py * pg.width + px) * 4;
        const a = data[i + 3];
        if (a === 0) continue;
        ctx.fillStyle = `rgba(${data[i]},${data[i + 1]},${data[i + 2]},${a / 255})`;
        ctx.fillRect((ox + px) * zoom, (oy + py) * zoom, zoom, zoom);
      }
    }
  }
}

// ── Attacks & Effects Lists ───────────────────────────────────────
function AttacksListPanel({
  char,
  selectedAttackId,
  onSelectAttack,
  onAddAttack,
  onRemoveAttack,
}: {
  char: ToonCharacter;
  selectedAttackId: string | null;
  onSelectAttack: (id: string) => void;
  onAddAttack: () => void;
  onRemoveAttack: (id: string) => void;
}) {
  return (
    <div style={S.panel}>
      <div style={{ ...S.sectionTitle, color: '#ff8822' }}>ATTACKS</div>
      {Object.values(char.attacks).map((a) => (
        <div
          key={a.id}
          onClick={() => onSelectAttack(a.id)}
          style={{
            padding: '3px 6px',
            cursor: 'pointer',
            background: a.id === selectedAttackId ? 'rgba(255,136,34,0.12)' : 'transparent',
            borderLeft: a.id === selectedAttackId ? '2px solid #ff8822' : '2px solid transparent',
            color: a.id === selectedAttackId ? '#ff8822' : '#8ac',
            fontSize: 10,
            display: 'flex',
            justifyContent: 'space-between',
          }}
        >
          <span>{a.name}</span>
          <span style={{ fontSize: 8, color: '#445' }}>{a.damage}dmg</span>
        </div>
      ))}
      <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
        <button onClick={onAddAttack} style={S.btn('#ff8822')}>+ ATTACK</button>
        {selectedAttackId && (
          <button onClick={() => onRemoveAttack(selectedAttackId)} style={S.btn('#ff4444')}>DEL</button>
        )}
      </div>
    </div>
  );
}

function EffectsListPanel({
  char,
  selectedEffectId,
  onSelectEffect,
  onAddEffect,
  onRemoveEffect,
}: {
  char: ToonCharacter;
  selectedEffectId: string | null;
  onSelectEffect: (id: string) => void;
  onAddEffect: () => void;
  onRemoveEffect: (id: string) => void;
}) {
  return (
    <div style={S.panel}>
      <div style={{ ...S.sectionTitle, color: '#aa44ff' }}>EFFECTS</div>
      {Object.values(char.effects).map((fx) => (
        <div
          key={fx.id}
          onClick={() => onSelectEffect(fx.id)}
          style={{
            padding: '3px 6px',
            cursor: 'pointer',
            background: fx.id === selectedEffectId ? 'rgba(170,68,255,0.12)' : 'transparent',
            borderLeft: fx.id === selectedEffectId ? '2px solid #aa44ff' : '2px solid transparent',
            color: fx.id === selectedEffectId ? '#aa44ff' : '#8ac',
            fontSize: 10,
            display: 'flex',
            justifyContent: 'space-between',
          }}
        >
          <span>{fx.name}</span>
          <span style={{ fontSize: 8, color: '#445' }}>{fx.type}</span>
        </div>
      ))}
      <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
        <button onClick={onAddEffect} style={S.btn('#aa44ff')}>+ EFFECT</button>
        {selectedEffectId && (
          <button onClick={() => onRemoveEffect(selectedEffectId)} style={S.btn('#ff4444')}>DEL</button>
        )}
      </div>
    </div>
  );
}

function CollidersListPanel({
  char,
  selectedColliderId,
  onSelectCollider,
  onAddCollider,
  onRemoveCollider,
}: {
  char: ToonCharacter;
  selectedColliderId: string | null;
  onSelectCollider: (id: string) => void;
  onAddCollider: () => void;
  onRemoveCollider: (id: string) => void;
}) {
  return (
    <div style={S.panel}>
      <div style={S.sectionTitle}>COLLIDERS</div>
      {Object.values(char.colliders).map((c) => (
        <div
          key={c.id}
          onClick={() => onSelectCollider(c.id)}
          style={{
            padding: '3px 6px',
            cursor: 'pointer',
            background: c.id === selectedColliderId ? `${COLLIDER_COLORS[c.type]}18` : 'transparent',
            borderLeft: c.id === selectedColliderId ? `2px solid ${COLLIDER_COLORS[c.type]}` : '2px solid transparent',
            color: c.id === selectedColliderId ? COLLIDER_COLORS[c.type] : '#8ac',
            fontSize: 10,
            display: 'flex',
            justifyContent: 'space-between',
          }}
        >
          <span>{c.name}</span>
          <span style={{ fontSize: 8, color: COLLIDER_COLORS[c.type] + '88' }}>{c.type}</span>
        </div>
      ))}
      <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
        <button onClick={onAddCollider} style={S.btn('#44ee88')}>+ COLLIDER</button>
        {selectedColliderId && (
          <button onClick={() => onRemoveCollider(selectedColliderId)} style={S.btn('#ff4444')}>DEL</button>
        )}
      </div>
    </div>
  );
}

// ── MAIN COMPONENT ────────────────────────────────────────────────
export default function ToonAdminEditor() {
  const [char, setChar] = useState<ToonCharacter>(createDefaultCharacter);

  // Selection state
  const [selectedPartId, setSelectedPartId] = useState<string | null>('body');
  const [selectedColliderId, setSelectedColliderId] = useState<string | null>(null);
  const [selectedAttackId, setSelectedAttackId] = useState<string | null>(null);
  const [selectedEffectId, setSelectedEffectId] = useState<string | null>(null);
  const [selKind, setSelKind] = useState<SelectionKind>('part');

  // Canvas state
  const [tool, setTool] = useState<DrawTool>('pencil');
  const [color, setColor] = useState('#ffffff');
  const [zoom, setZoom] = useState(8);
  const [showGrid, setShowGrid] = useState(true);
  const [showColliders, setShowColliders] = useState(true);
  const [showOnionSkin, setShowOnionSkin] = useState(false);

  // Animation state
  const [currentAnimId, setCurrentAnimId] = useState('idle');
  const [currentFrame, setCurrentFrame] = useState(0);
  const [playing, setPlaying] = useState(false);
  const playTimerRef = useRef<number | null>(null);

  const currentAnim = char.animations[currentAnimId];

  // Playback
  useEffect(() => {
    if (playing && currentAnim) {
      const ms = 1000 / currentAnim.fps;
      playTimerRef.current = window.setInterval(() => {
        setCurrentFrame((f) => {
          const next = f + 1;
          if (next >= currentAnim.frames.length) return currentAnim.loop ? 0 : f;
          return next;
        });
      }, ms);
    }
    return () => { if (playTimerRef.current) clearInterval(playTimerRef.current); };
  }, [playing, currentAnim]);

  // ── Mutation helpers ────────────────────────────────────────
  const updateChar = useCallback((fn: (c: ToonCharacter) => ToonCharacter) => {
    setChar((prev) => fn(prev));
  }, []);

  const onUpdatePart = (id: string, patch: Partial<ToonPart>) => {
    updateChar((c) => ({ ...c, parts: { ...c.parts, [id]: { ...c.parts[id], ...patch } } }));
  };
  const onUpdateCollider = (id: string, patch: Partial<ToonCollider>) => {
    updateChar((c) => ({ ...c, colliders: { ...c.colliders, [id]: { ...c.colliders[id], ...patch } } }));
  };
  const onUpdateAttack = (id: string, patch: Partial<ToonAttack>) => {
    updateChar((c) => ({ ...c, attacks: { ...c.attacks, [id]: { ...c.attacks[id], ...patch } } }));
  };
  const onUpdateEffect = (id: string, patch: Partial<ToonEffect>) => {
    updateChar((c) => ({ ...c, effects: { ...c.effects, [id]: { ...c.effects[id], ...patch } } }));
  };

  const onAddPart = (parentId: string) => {
    const id = uid('part');
    updateChar((c) => ({
      ...c,
      parts: {
        ...c.parts,
        [id]: { id, name: 'New Part', offsetX: 0, offsetY: 0, scale: 1, zOrder: 0, pixels: createEmptyPixelGrid(16, 16), children: [], visible: true },
        [parentId]: { ...c.parts[parentId], children: [...c.parts[parentId].children, id] },
      },
    }));
    setSelectedPartId(id);
    setSelKind('part');
  };

  const onRemovePart = (id: string) => {
    updateChar((c) => {
      const newParts = { ...c.parts };
      // Remove from parent's children
      for (const p of Object.values(newParts)) {
        if (p.children.includes(id)) {
          newParts[p.id] = { ...p, children: p.children.filter((cid) => cid !== id) };
        }
      }
      delete newParts[id];
      return { ...c, parts: newParts };
    });
    setSelectedPartId(null);
  };

  const onAddCollider = () => {
    const id = uid('coll');
    updateChar((c) => ({
      ...c,
      colliders: {
        ...c.colliders,
        [id]: { id, name: 'New Collider', type: 'hitbox', shape: 'rect', x: 16, y: 16, w: 20, h: 20, attachedToPart: null, activeFrames: null },
      },
    }));
    setSelectedColliderId(id);
    setSelKind('collider');
  };

  const onRemoveCollider = (id: string) => {
    updateChar((c) => {
      const newC = { ...c.colliders };
      delete newC[id];
      return { ...c, colliders: newC };
    });
    setSelectedColliderId(null);
  };

  const onAddAttack = () => {
    const id = uid('atk');
    updateChar((c) => ({
      ...c,
      attacks: {
        ...c.attacks,
        [id]: { id, name: 'New Attack', animationId: currentAnimId, damage: 10, knockbackX: 5, knockbackY: 0, startupFrame: 0, activeFrameStart: 1, activeFrameEnd: 2, recoveryFrame: 3, colliderIds: [], effectIds: [] },
      },
    }));
    setSelectedAttackId(id);
    setSelKind('attack');
  };

  const onRemoveAttack = (id: string) => {
    updateChar((c) => {
      const newA = { ...c.attacks };
      delete newA[id];
      return { ...c, attacks: newA };
    });
    setSelectedAttackId(null);
  };

  const onAddEffect = () => {
    const id = uid('fx');
    updateChar((c) => ({
      ...c,
      effects: {
        ...c.effects,
        [id]: { id, name: 'New Effect', type: 'particle', color: '#ff8800', durationMs: 200, spawnFrame: 0, offsetX: 0, offsetY: 0, size: 8 },
      },
    }));
    setSelectedEffectId(id);
    setSelKind('effect');
  };

  const onRemoveEffect = (id: string) => {
    updateChar((c) => {
      const newE = { ...c.effects };
      delete newE[id];
      return { ...c, effects: newE };
    });
    setSelectedEffectId(null);
  };

  // Animation management
  const onAddAnim = () => {
    const id = uid('anim');
    updateChar((c) => ({
      ...c,
      animations: { ...c.animations, [id]: { id, name: 'New Anim', frames: [createEmptyFrame()], fps: 8, loop: true } },
    }));
    setCurrentAnimId(id);
    setCurrentFrame(0);
  };

  const onAddFrame = () => {
    updateChar((c) => ({
      ...c,
      animations: {
        ...c.animations,
        [currentAnimId]: {
          ...c.animations[currentAnimId],
          frames: [...c.animations[currentAnimId].frames, createEmptyFrame()],
        },
      },
    }));
  };

  const onDuplicateFrame = () => {
    updateChar((c) => {
      const anim = c.animations[currentAnimId];
      const frame = anim.frames[currentFrame];
      const dup = JSON.parse(JSON.stringify(frame));
      const newFrames = [...anim.frames];
      newFrames.splice(currentFrame + 1, 0, dup);
      return { ...c, animations: { ...c.animations, [currentAnimId]: { ...anim, frames: newFrames } } };
    });
    setCurrentFrame((f) => f + 1);
  };

  const onDeleteFrame = () => {
    updateChar((c) => {
      const anim = c.animations[currentAnimId];
      if (anim.frames.length <= 1) return c;
      const newFrames = anim.frames.filter((_, i) => i !== currentFrame);
      return { ...c, animations: { ...c.animations, [currentAnimId]: { ...anim, frames: newFrames } } };
    });
    setCurrentFrame((f) => Math.max(0, f - 1));
  };

  // Pixel editing
  const onPixelChange = (partId: string, pixels: Uint8Array) => {
    const part = char.parts[partId];
    if (!part) return;
    const b64 = uint8ToBase64(pixels);
    updateChar((c) => ({
      ...c,
      parts: { ...c.parts, [partId]: { ...c.parts[partId], pixels: { ...c.parts[partId].pixels, data: b64 } } },
    }));
  };

  // Collider drag
  const onColliderDrag = (id: string, dx: number, dy: number) => {
    onUpdateCollider(id, { x: char.colliders[id].x + dx, y: char.colliders[id].y + dy });
    setSelectedColliderId(id);
    setSelKind('collider');
  };

  const onColliderResize = (id: string, dw: number, dh: number) => {
    const c = char.colliders[id];
    onUpdateCollider(id, { w: Math.max(4, c.w + dw), h: Math.max(4, c.h + dh) });
  };

  // Export / Import
  const exportJson = () => {
    navigator.clipboard.writeText(JSON.stringify(char, null, 2));
  };

  const importJson = () => {
    const text = prompt('Paste character JSON:');
    if (!text) return;
    try {
      const parsed = JSON.parse(text) as ToonCharacter;
      if (!parsed.id || !parsed.parts || !parsed.animations) throw new Error('Invalid');
      setChar(parsed);
      setSelectedPartId(parsed.rootParts[0] ?? null);
      setCurrentAnimId(Object.keys(parsed.animations)[0] ?? 'idle');
      setCurrentFrame(0);
    } catch {
      alert('Invalid JSON');
    }
  };

  // Canvas hook
  const { canvasRef, onMouseDown, onMouseMove, onMouseUp } = usePixelCanvas(
    char, selectedPartId, currentAnimId, currentFrame,
    tool, color, zoom, showGrid, showColliders, showOnionSkin,
    selectedColliderId, onColliderDrag, onColliderResize,
    (hex) => setColor(hex), onPixelChange,
  );

  const TOOLS: { key: DrawTool; label: string; icon: string }[] = [
    { key: 'pencil', label: 'Pencil', icon: '✏️' },
    { key: 'eraser', label: 'Eraser', icon: '🧹' },
    { key: 'fill', label: 'Fill', icon: '🪣' },
    { key: 'picker', label: 'Picker', icon: '💉' },
    { key: 'line', label: 'Line', icon: '📏' },
    { key: 'rect', label: 'Rect', icon: '▬' },
  ];

  return (
    <div>
      <div style={{ fontSize: 16, fontWeight: 800, color: '#4488ff', letterSpacing: 2, marginBottom: 4 }}>
        TOON EDITOR — SOURCE OF TRUTH
      </div>
      <div style={{ fontSize: 10, color: '#68a', marginBottom: 10 }}>
        Character: <strong style={{ color: '#cde' }}>{char.name}</strong>
        {' · '}
        <input
          value={char.name}
          onChange={(e) => updateChar((c) => ({ ...c, name: e.target.value }))}
          style={{ ...S.input, width: 140 }}
        />
        {' '}
        <input
          type="number"
          value={char.spriteWidth}
          onChange={(e) => updateChar((c) => ({ ...c, spriteWidth: +e.target.value }))}
          style={{ ...S.input, width: 40 }}
          title="Sprite Width"
        />
        ×
        <input
          type="number"
          value={char.spriteHeight}
          onChange={(e) => updateChar((c) => ({ ...c, spriteHeight: +e.target.value }))}
          style={{ ...S.input, width: 40 }}
          title="Sprite Height"
        />
      </div>

      {/* Top bar: tools + toggles + export */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        {TOOLS.map((t) => (
          <button key={t.key} onClick={() => setTool(t.key)} style={S.btn(tool === t.key ? '#ffcc00' : '#4488ff')}>
            {t.icon} {t.label.toUpperCase()}
          </button>
        ))}
        <span style={{ width: 1, height: 20, background: '#1a3050', margin: '0 4px' }} />
        <input
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          style={{ width: 24, height: 22, border: 'none', background: 'transparent', cursor: 'pointer' }}
          title="Draw Color"
        />
        <span style={{ width: 1, height: 20, background: '#1a3050', margin: '0 4px' }} />
        <button onClick={() => setZoom(Math.min(24, zoom + 2))} style={S.btn()}>🔍+</button>
        <button onClick={() => setZoom(Math.max(2, zoom - 2))} style={S.btn()}>🔍−</button>
        <span style={{ fontSize: 9, color: '#68a' }}>{zoom}x</span>
        <span style={{ width: 1, height: 20, background: '#1a3050', margin: '0 4px' }} />
        <button onClick={() => setShowGrid(!showGrid)} style={S.btn(showGrid ? '#44ee88' : '#445')}>GRID</button>
        <button onClick={() => setShowColliders(!showColliders)} style={S.btn(showColliders ? '#44ee88' : '#445')}>COLL</button>
        <button onClick={() => setShowOnionSkin(!showOnionSkin)} style={S.btn(showOnionSkin ? '#ffcc00' : '#445')}>ONION</button>
        <span style={{ width: 1, height: 20, background: '#1a3050', margin: '0 4px' }} />
        <button onClick={exportJson} style={S.btn('#ffaa22')}>EXPORT JSON</button>
        <button onClick={importJson} style={S.btn('#4488ff')}>IMPORT JSON</button>
        <button onClick={() => setChar(createDefaultCharacter())} style={S.btn('#ff4444')}>NEW CHAR</button>
      </div>

      {/* Palette */}
      <div style={{ display: 'flex', gap: 2, marginBottom: 8, flexWrap: 'wrap' }}>
        {char.palette.map((c, i) => (
          <div
            key={i}
            onClick={() => setColor(c)}
            style={{
              width: 18,
              height: 18,
              borderRadius: 3,
              background: c,
              border: c === color ? '2px solid #ffcc00' : '1px solid #1a3050',
              cursor: 'pointer',
            }}
          />
        ))}
      </div>

      {/* Main layout: left + center + right */}
      <div style={{ display: 'flex', gap: 8 }}>
        {/* Left column: hierarchy + colliders + attacks + effects */}
        <div style={{ width: 180, display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
          <HierarchyTree
            char={char}
            selectedPartId={selectedPartId}
            onSelectPart={(id) => { setSelectedPartId(id); setSelKind('part'); setSelectedColliderId(null); setSelectedAttackId(null); setSelectedEffectId(null); }}
            onAddPart={onAddPart}
            onRemovePart={onRemovePart}
          />
          <CollidersListPanel
            char={char}
            selectedColliderId={selectedColliderId}
            onSelectCollider={(id) => { setSelectedColliderId(id); setSelKind('collider'); setSelectedPartId(null); setSelectedAttackId(null); setSelectedEffectId(null); }}
            onAddCollider={onAddCollider}
            onRemoveCollider={onRemoveCollider}
          />
          <AttacksListPanel
            char={char}
            selectedAttackId={selectedAttackId}
            onSelectAttack={(id) => { setSelectedAttackId(id); setSelKind('attack'); setSelectedPartId(null); setSelectedColliderId(null); setSelectedEffectId(null); }}
            onAddAttack={onAddAttack}
            onRemoveAttack={onRemoveAttack}
          />
          <EffectsListPanel
            char={char}
            selectedEffectId={selectedEffectId}
            onSelectEffect={(id) => { setSelectedEffectId(id); setSelKind('effect'); setSelectedPartId(null); setSelectedColliderId(null); setSelectedAttackId(null); }}
            onAddEffect={onAddEffect}
            onRemoveEffect={onRemoveEffect}
          />
        </div>

        {/* Center: pixel canvas */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ ...S.panel, overflow: 'auto', maxHeight: '65vh' }}>
            <canvas
              ref={canvasRef}
              style={{ display: 'block', cursor: tool === 'picker' ? 'crosshair' : 'default', imageRendering: 'pixelated' }}
              onMouseDown={onMouseDown}
              onMouseMove={onMouseMove}
              onMouseUp={onMouseUp}
              onMouseLeave={onMouseUp}
            />
          </div>
        </div>

        {/* Right column: properties inspector */}
        <div style={{ width: 220, display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
          <PropsPanel
            char={char}
            selKind={selKind}
            selId={
              selKind === 'part' ? selectedPartId :
              selKind === 'collider' ? selectedColliderId :
              selKind === 'attack' ? selectedAttackId :
              selKind === 'effect' ? selectedEffectId :
              null
            }
            onUpdatePart={onUpdatePart}
            onUpdateCollider={onUpdateCollider}
            onUpdateAttack={onUpdateAttack}
            onUpdateEffect={onUpdateEffect}
          />
        </div>
      </div>

      {/* Bottom: timeline */}
      <div style={{ marginTop: 8 }}>
        {currentAnim && (
          <TimelinePanel
            anim={currentAnim}
            currentFrame={currentFrame}
            onSelectFrame={setCurrentFrame}
            onAddFrame={onAddFrame}
            onDuplicateFrame={onDuplicateFrame}
            onDeleteFrame={onDeleteFrame}
            playing={playing}
            onTogglePlay={() => setPlaying(!playing)}
            onChangeFps={(fps) => updateChar((c) => ({
              ...c,
              animations: { ...c.animations, [currentAnimId]: { ...c.animations[currentAnimId], fps: Math.max(1, fps) } },
            }))}
            allAnims={char.animations}
            currentAnimId={currentAnimId}
            onSelectAnim={(id) => { setCurrentAnimId(id); setCurrentFrame(0); setPlaying(false); }}
            onAddAnim={onAddAnim}
          />
        )}
      </div>
    </div>
  );
}
