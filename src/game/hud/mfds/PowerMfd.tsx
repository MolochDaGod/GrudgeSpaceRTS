/**
 * PowerMfd.tsx — live power-triangle MFD body.
 *
 * Subscribes to the `power-triangle` module and renders three bars
 * (Weapons / Shields / Engines). Click a bar to push that pool +10%;
 * the global 1/2/3 hotkeys are bound at App boot via
 * `bindPowerHotkeys()`.
 */

import { useEffect, useState } from 'react';
import { Bar } from '../sc-primitives';
import { SC } from '../sc-tokens';
import { getPower, onPowerChange, pushPower, resetPower, type PowerTriangle } from '../../ship-systems/power-triangle';
import type { MfdContent, MfdProps } from './index';

function Body(_props: MfdProps) {
  const [t, setT] = useState<PowerTriangle>(getPower());
  useEffect(() => onPowerChange(setT), []);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <Bar
        label="WEAPONS"
        value={t.weapons * 1.5} // 1.5 because cap = 0.7 → fill ≈ 1.0
        readout={`${Math.round(t.weapons * 100)}%`}
        tone={t.weapons > 0.4 ? 'alert' : 'accent'}
        ticks
        style={{ cursor: 'pointer' }}
      />
      <Bar
        label="SHIELDS"
        value={t.shields * 1.5}
        readout={`${Math.round(t.shields * 100)}%`}
        tone={t.shields > 0.4 ? 'accent' : ('dim' as never)}
        ticks
      />
      <Bar
        label="ENGINES"
        value={t.engines * 1.5}
        readout={`${Math.round(t.engines * 100)}%`}
        tone={t.engines > 0.4 ? 'ok' : 'accent'}
        ticks
      />
      <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
        <PoolBtn label="1·WEP" onClick={() => pushPower('weapons')} />
        <PoolBtn label="2·SHD" onClick={() => pushPower('shields')} />
        <PoolBtn label="3·ENG" onClick={() => pushPower('engines')} />
        <PoolBtn label="0·RST" onClick={resetPower} />
      </div>
    </div>
  );
}

function PoolBtn({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        padding: '4px 0',
        fontSize: 9,
        fontWeight: 800,
        letterSpacing: 1.5,
        background: SC.surfaceSoft,
        border: SC.borderSoft,
        color: SC.textDim,
        borderRadius: SC.radiusChip,
        cursor: 'pointer',
        fontFamily: SC.font,
      }}
    >
      {label}
    </button>
  );
}

export const PowerMfd: MfdContent = {
  id: 'power',
  title: 'POWER',
  statusOf: () => {
    const t = getPower();
    if (t.weapons > 0.45) return 'OFFENSIVE';
    if (t.shields > 0.45) return 'DEFENSIVE';
    if (t.engines > 0.45) return 'EVASIVE';
    return 'BALANCED';
  },
  statusToneOf: () => {
    const t = getPower();
    if (t.weapons > 0.45) return 'alert';
    if (t.shields > 0.45) return 'accent';
    if (t.engines > 0.45) return 'ok';
    return 'dim';
  },
  Body,
};
