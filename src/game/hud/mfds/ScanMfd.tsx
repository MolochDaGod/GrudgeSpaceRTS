/**
 * ScanMfd.tsx — radar-style polar plot of nearby contacts.
 *
 * Renders a small SVG circle with up to 32 tracked ships positioned by
 * polar bearing relative to the player's first owned planet (or first
 * planet on the map). Friendly = cyan, hostile = red, neutral = grey.
 * No live ping animation yet — that gets added in Phase 4 when
 * sensor / detection ranges land.
 */

import { SC } from '../sc-tokens';
import type { MfdContent, MfdProps } from './index';

const RADIUS = 48;
const RANGE = 200; // game-units mapped to RADIUS px

function Body(props: MfdProps) {
  const state = props.renderer?.engine?.state;
  const origin = state?.planets?.find((p) => p.owner === 1) ?? state?.planets?.[0];
  if (!state || !origin) return <div style={{ fontSize: 11, color: SC.textGhost }}>No anchor for scan.</div>;

  const contacts: { x: number; y: number; tone: 'ok' | 'alert' | 'dim' }[] = [];
  state.ships?.forEach?.((s) => {
    if (s.dead) return;
    const dx = (s.x ?? 0) - (origin.x ?? 0);
    const dz = (s.z ?? 0) - (origin.z ?? 0);
    const dist = Math.hypot(dx, dz);
    if (dist > RANGE) return;
    const px = (dx / RANGE) * RADIUS;
    const py = (dz / RANGE) * RADIUS;
    const tone = s.team === 1 ? 'ok' : s.team === 0 ? 'dim' : 'alert';
    contacts.push({ x: px, y: py, tone });
  });

  const friendly = contacts.filter((c) => c.tone === 'ok').length;
  const hostile = contacts.filter((c) => c.tone === 'alert').length;

  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
      <svg width={RADIUS * 2 + 4} height={RADIUS * 2 + 4} style={{ flexShrink: 0 }}>
        <g transform={`translate(${RADIUS + 2}, ${RADIUS + 2})`}>
          {/* Concentric range rings */}
          {[0.33, 0.66, 1].map((r) => (
            <circle key={r} cx={0} cy={0} r={RADIUS * r} fill="none" stroke="rgba(80,180,255,0.18)" strokeWidth={1} />
          ))}
          {/* Crosshairs */}
          <line x1={-RADIUS} y1={0} x2={RADIUS} y2={0} stroke="rgba(80,180,255,0.16)" strokeWidth={1} />
          <line x1={0} y1={-RADIUS} x2={0} y2={RADIUS} stroke="rgba(80,180,255,0.16)" strokeWidth={1} />
          {/* Self */}
          <circle cx={0} cy={0} r={2} fill={SC.accent} />
          {/* Contacts */}
          {contacts.map((c, i) => {
            const fill = c.tone === 'ok' ? SC.ok : c.tone === 'alert' ? SC.alert : SC.textDim;
            return <circle key={i} cx={c.x} cy={c.y} r={2} fill={fill} />;
          })}
        </g>
      </svg>
      <div style={{ flex: 1, fontSize: 10, lineHeight: 1.6 }}>
        <div>
          <span style={{ color: SC.textDim, letterSpacing: 1.5, fontSize: 8 }}>RANGE</span>{' '}
          <span style={{ color: SC.text, fontWeight: 700 }}>{RANGE} u</span>
        </div>
        <div>
          <span style={{ color: SC.ok }}>● </span>
          <span style={{ color: SC.text }}>FRIENDLY {friendly}</span>
        </div>
        <div>
          <span style={{ color: SC.alert }}>● </span>
          <span style={{ color: SC.text }}>HOSTILE {hostile}</span>
        </div>
        <div style={{ marginTop: 6, fontSize: 9, color: SC.textGhost, letterSpacing: 1.5 }}>Anchor: {origin.name}</div>
      </div>
    </div>
  );
}

export const ScanMfd: MfdContent = {
  id: 'scan',
  title: 'SCAN',
  statusOf: (props) => {
    const state = props.renderer?.engine?.state;
    if (!state) return '—';
    let h = 0;
    state.ships?.forEach?.((s) => {
      if (!s.dead && s.team !== 1) h++;
    });
    return h > 0 ? `${h} HOSTILE` : 'CLEAR';
  },
  statusToneOf: (props) => {
    const state = props.renderer?.engine?.state;
    let h = 0;
    state?.ships?.forEach?.((s) => {
      if (!s.dead && s.team !== 1) h++;
    });
    return h > 0 ? 'alert' : 'ok';
  },
  Body,
};
