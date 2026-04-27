/**
 * QuantumMfd.tsx — quantum-drive MFD.
 *
 * Reads the campaign target the player picked in the Universe View
 * (`localStorage.campaign_target`) and runs `SCNavigationPlanner` against
 * the seed universe to produce a route summary (distance / ETA / quantum
 * jumps). A CHARGE button starts a 6 s timer (cosmetic for now); the
 * actual jump-execute path lands in Phase 6 multi-system handover.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { Bar } from '../sc-primitives';
import { SC } from '../sc-tokens';
import { SCNavigationPlanner, type NavigationPlan } from '../../nav';
import { CAMPAIGN_CONTAINERS, CAMPAIGN_POIS } from '../../nav/universe-seed';
import type { MfdContent, MfdProps } from './index';

interface SavedTarget {
  name: string;
  system: string;
  type: string;
}

function readTarget(): SavedTarget | null {
  try {
    const raw = localStorage.getItem('campaign_target');
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<SavedTarget>;
    if (typeof parsed?.name === 'string') return parsed as SavedTarget;
  } catch {
    /* ignore */
  }
  return null;
}

const CHARGE_SEC = 6;

function fmtDistance(m: number): string {
  if (m >= 1e9) return `${(m / 1e9).toFixed(2)} Bn km`;
  if (m >= 1e6) return `${(m / 1e6).toFixed(1)} M km`;
  if (m >= 1e3) return `${(m / 1e3).toFixed(0)} km`;
  return `${m.toFixed(0)} m`;
}

function Body(_props: MfdProps) {
  const planner = useMemo(() => new SCNavigationPlanner(CAMPAIGN_POIS, CAMPAIGN_CONTAINERS), []);
  const [target, setTarget] = useState<SavedTarget | null>(readTarget);
  const [plan, setPlan] = useState<NavigationPlan | null>(null);
  const [charging, setCharging] = useState(false);
  const [chargeProgress, setChargeProgress] = useState(0);
  const chargeTimer = useRef<number | null>(null);

  // Re-read target on mount + on storage events from other tabs.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'campaign_target') setTarget(readTarget());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  // Plan whenever the target changes.
  useEffect(() => {
    if (!target) {
      setPlan(null);
      return;
    }
    try {
      const result = (planner as { planNavigation?: (n: string) => NavigationPlan | null }).planNavigation?.(target.name) ?? null;
      setPlan(result);
    } catch {
      setPlan(null);
    }
  }, [target, planner]);

  // Charge timer — pure UX for now, no engine effect.
  useEffect(() => {
    if (!charging) return;
    const start = Date.now();
    const tick = () => {
      const elapsed = (Date.now() - start) / 1000;
      const t = Math.min(1, elapsed / CHARGE_SEC);
      setChargeProgress(t);
      if (t < 1) {
        chargeTimer.current = window.requestAnimationFrame(tick);
      } else {
        setCharging(false);
        // Clear the saved target on completion (the jump 'consumed' it).
        try {
          localStorage.removeItem('campaign_target');
        } catch {
          /* noop */
        }
        setTarget(null);
        setChargeProgress(0);
      }
    };
    chargeTimer.current = window.requestAnimationFrame(tick);
    return () => {
      if (chargeTimer.current) window.cancelAnimationFrame(chargeTimer.current);
    };
  }, [charging]);

  if (!target) {
    return (
      <div style={{ fontSize: 11, color: SC.textGhost }}>
        No quantum target locked.
        <br />
        Open <span style={{ color: SC.accent }}>UNIVERSE MAP</span> to plot one.
      </div>
    );
  }

  const obstructed = !!plan?.obstructionDetected;
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
        {target.name}
      </div>
      <div style={{ fontSize: 9, letterSpacing: 1.5, color: SC.textDim }}>
        {target.type.toUpperCase()} · {target.system.toUpperCase()}
      </div>
      {plan ? (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, marginTop: 2 }}>
            <span style={{ color: SC.textDim, letterSpacing: 1.5 }}>DIST</span>
            <span style={{ color: SC.text, fontWeight: 700 }}>{fmtDistance(plan.totalDistance)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10 }}>
            <span style={{ color: SC.textDim, letterSpacing: 1.5 }}>QT JUMPS</span>
            <span style={{ color: SC.text, fontWeight: 700 }}>{plan.quantumJumps}</span>
          </div>
          {obstructed && <div style={{ fontSize: 9, color: SC.warn, letterSpacing: 1.5 }}>⚠ OBSTRUCTION — auto-routing</div>}
        </>
      ) : (
        <div style={{ fontSize: 9, color: SC.textGhost }}>Plotting…</div>
      )}
      <Bar
        label={charging ? 'CHARGING' : 'DRIVE READY'}
        value={charging ? chargeProgress : 1}
        readout={charging ? `${Math.ceil((1 - chargeProgress) * CHARGE_SEC)}s` : 'IDLE'}
        tone={charging ? 'warn' : obstructed ? 'alert' : 'accent'}
        style={{ marginTop: 4 }}
      />
      <button
        onClick={() => setCharging((c) => !c)}
        style={{
          marginTop: 4,
          padding: '5px 10px',
          fontSize: 10,
          letterSpacing: 3,
          fontWeight: 800,
          borderRadius: SC.radiusChip,
          border: charging ? SC.borderWarn : SC.borderAccent,
          background: charging ? SC.surfaceWarn : SC.surfaceAccent,
          color: charging ? SC.warn : SC.accent,
          fontFamily: SC.font,
          cursor: 'pointer',
        }}
      >
        {charging ? 'ABORT JUMP' : 'CHARGE QUANTUM'}
      </button>
    </div>
  );
}

export const QuantumMfd: MfdContent = {
  id: 'quantum',
  title: 'QUANTUM',
  statusOf: () => (readTarget() ? 'TARGET LOCKED' : 'STANDBY'),
  statusToneOf: () => (readTarget() ? 'warn' : 'dim'),
  Body,
};
