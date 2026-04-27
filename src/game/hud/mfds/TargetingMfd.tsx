/**
 * TargetingMfd.tsx — selected-ship hull / shield readout.
 *
 * Reads from `renderer.engine.state.selectedIds` to find the primary
 * targeted ship and renders hull + shield bars with team tone.
 */

import { Bar } from '../sc-primitives';
import { SC } from '../sc-tokens';
import type { MfdContent, MfdProps } from './index';

function getPrimary(props: MfdProps) {
  const state = props.renderer?.engine?.state;
  if (!state) return null;
  const id = state.selectedIds?.values?.().next?.().value;
  if (id == null) return null;
  const s = state.ships?.get?.(id);
  if (!s || s.dead) return null;
  return s;
}

function Body(props: MfdProps) {
  const ship = getPrimary(props);
  if (!ship) {
    return <div style={{ fontSize: 11, color: SC.textGhost }}>Click a ship to lock target.</div>;
  }
  const hpPct = ship.hp / Math.max(1, ship.maxHp);
  const shieldPct = ship.shield / Math.max(1, ship.maxShield);
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
        {ship.shipType}
      </div>
      <div style={{ fontSize: 9, letterSpacing: 1.5, color: SC.textDim }}>
        TEAM {ship.team} · RANK {ship.rank ?? 0} · CLASS {ship.shipClass ?? '—'}
      </div>
      <Bar
        label="HULL"
        value={hpPct}
        readout={`${Math.round(ship.hp)} / ${Math.round(ship.maxHp)}`}
        tone={hpPct < 0.3 ? 'alert' : hpPct < 0.6 ? 'warn' : 'ok'}
      />
      <Bar label="SHIELD" value={shieldPct} readout={`${Math.round(ship.shield)} / ${Math.round(ship.maxShield)}`} tone="accent" />
    </div>
  );
}

export const TargetingMfd: MfdContent = {
  id: 'targeting',
  title: 'TARGETING',
  statusOf: (props) => {
    const ship = getPrimary(props);
    if (!ship) return 'NO LOCK';
    return `T${ship.team}`;
  },
  statusToneOf: (props) => {
    const ship = getPrimary(props);
    if (!ship) return 'dim';
    return ship.team === 1 ? 'ok' : 'alert';
  },
  Body,
};
