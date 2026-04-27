/**
 * NavMfd.tsx — current-system anchor + planet roster summary.
 */

import { SC } from '../sc-tokens';
import type { MfdContent, MfdProps } from './index';

function pickAnchor(props: MfdProps) {
  const state = props.renderer?.engine?.state;
  if (!state?.planets?.length) return null;
  const owned = state.planets.find((p) => p.owner === 1);
  return owned ?? state.planets[0];
}

function Body(props: MfdProps) {
  const anchor = pickAnchor(props);
  const state = props.renderer?.engine?.state;
  const owned = state?.planets?.filter((p) => p.owner === 1).length ?? 0;
  const total = state?.planets?.length ?? 0;
  if (!anchor) return <div style={{ fontSize: 11, color: SC.textGhost }}>No planets in system.</div>;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div
        style={{
          fontSize: 12,
          fontWeight: 800,
          color: SC.text,
          textTransform: 'uppercase',
          letterSpacing: 2,
        }}
      >
        {anchor.name ?? `Planet ${anchor.id}`}
      </div>
      <div style={{ fontSize: 9, letterSpacing: 1.5, color: SC.textDim }}>
        TYPE {anchor.planetType?.toUpperCase() ?? '—'} · LVL {anchor.planetLevel ?? 1}
      </div>
      <div style={{ fontSize: 9, letterSpacing: 1.5, color: SC.textDim, marginTop: 4 }}>
        OWNERSHIP {owned} / {total}
      </div>
      <div style={{ marginTop: 4, fontSize: 9, color: SC.textGhost, letterSpacing: 1.5 }}>
        Click header → Star Map · Quantum drive on QUANTUM MFD
      </div>
    </div>
  );
}

export const NavMfd: MfdContent = {
  id: 'nav',
  title: 'NAV',
  statusOf: (props) => {
    const a = pickAnchor(props);
    return a?.planetType?.toUpperCase() ?? '—';
  },
  statusToneOf: () => 'accent',
  Body,
};
