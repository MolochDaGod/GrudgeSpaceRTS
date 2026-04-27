/**
 * UniverseView.tsx — Phase 1 Star-Citizen-style universe map.
 *
 * Top-down visualisation of the campaign universe driven by StarNav:
 *   - SCNavigationPlanner pre-computes the visibility graph at mount.
 *   - Each ObjectContainer renders as a glowing billboard sized by bodyRadius.
 *   - Click a body → planner.plan_route(...) returns segments / ETA / jumps.
 *   - FLY button stores the chosen target in localStorage and exits to /game.
 *
 * Pure additive — does not touch the existing space RTS or HUD.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { SCNavigationPlanner, type ObjectContainer, type NavigationPlan } from './nav';
import { CAMPAIGN_CONTAINERS, CAMPAIGN_POIS } from './nav/universe-seed';

interface Props {
  onExit: () => void;
}

/** Convert a body's metres-from-origin position to scene-friendly units (1 unit = 1 Bn m). */
const SCENE_SCALE = 1e-9;

const BODY_TINT: Record<string, number> = {
  Star: 0xffaa44,
  Planet: 0x44aaff,
  Moon: 0x88aabb,
  JumpPoint: 0xff66ff,
  Lagrange: 0x44ffaa,
  RestStop: 0xcccccc,
  NavalStation: 0xff4444,
  RefineryStation: 0xffcc44,
};

function fmtDistance(m: number): string {
  if (m >= 1e9) return `${(m / 1e9).toFixed(2)} Bn km`;
  if (m >= 1e6) return `${(m / 1e6).toFixed(1)} M km`;
  if (m >= 1e3) return `${(m / 1e3).toFixed(0)} km`;
  return `${m.toFixed(0)} m`;
}
function fmtEta(seconds: number): string {
  if (!isFinite(seconds) || seconds <= 0) return '—';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  if (m >= 60) return `${Math.floor(m / 60)}h ${m % 60}m`;
  return `${m}m ${s.toString().padStart(2, '0')}s`;
}

export default function UniverseView({ onExit }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [selected, setSelected] = useState<ObjectContainer | null>(null);
  const [plan, setPlan] = useState<NavigationPlan | null>(null);
  const [origin, setOrigin] = useState<string>('Stanton');

  // Build the planner once. Holds the visibility graph + OM lattice.
  const planner = useMemo(() => new SCNavigationPlanner(CAMPAIGN_POIS, CAMPAIGN_CONTAINERS), []);

  // ── Three.js scene ─────────────────────────────────────────────
  useEffect(() => {
    const host = containerRef.current;
    if (!host) return;

    const w = host.clientWidth;
    const h = host.clientHeight;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(w, h);
    host.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020310);

    // Top-down ortho camera, viewing the system in scaled units.
    const aspect = w / h;
    const viewSize = 110; // covers Stanton + Pyro plus margin
    const camera = new THREE.OrthographicCamera(-viewSize * aspect, viewSize * aspect, viewSize, -viewSize, -1000, 1000);
    camera.position.set(0, 200, 0);
    camera.lookAt(0, 0, 0);

    // Distant starfield backdrop.
    {
      const starCount = 1500;
      const positions = new Float32Array(starCount * 3);
      for (let i = 0; i < starCount; i++) {
        positions[i * 3] = (Math.random() - 0.5) * 600;
        positions[i * 3 + 1] = -50 - Math.random() * 100;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 600;
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      const mat = new THREE.PointsMaterial({ color: 0xaaaacc, size: 0.4, sizeAttenuation: true });
      scene.add(new THREE.Points(geo, mat));
    }

    // Body billboards keyed by name so the click handler can resolve the entry.
    const bodySprites: { mesh: THREE.Mesh; container: ObjectContainer; ring: THREE.Mesh | null }[] = [];

    for (const c of CAMPAIGN_CONTAINERS) {
      const tint = BODY_TINT[c.cont_type] ?? 0xffffff;

      // Body itself — flat disc on the y=0 plane sized by bodyRadius (clamped).
      const radius = Math.max(0.4, Math.min(8, c.bodyRadius * SCENE_SCALE * 1e3));
      const geo = new THREE.CircleGeometry(radius, 48);
      const mat = new THREE.MeshBasicMaterial({ color: tint, transparent: true, opacity: 0.95 });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.set(c.posX * SCENE_SCALE, 0, c.posZ === 0 ? c.posY * SCENE_SCALE : c.posZ * SCENE_SCALE);
      // Use posY for top-down 'forward' since most seeds put bodies on the XY plane.
      mesh.position.set(c.posX * SCENE_SCALE, 0, c.posY * SCENE_SCALE);
      (mesh as unknown as { __container: ObjectContainer }).__container = c;
      scene.add(mesh);

      // Halo (additive glow).
      const halo = new THREE.Mesh(
        new THREE.CircleGeometry(radius * 2.5, 48),
        new THREE.MeshBasicMaterial({ color: tint, transparent: true, opacity: 0.18, blending: THREE.AdditiveBlending }),
      );
      halo.rotation.x = -Math.PI / 2;
      halo.position.copy(mesh.position).setY(-0.02);
      scene.add(halo);

      // OM ring for celestial bodies — shows the orbital marker shell at scale.
      let ring: THREE.Mesh | null = null;
      if (c.cont_type === 'Planet' || c.cont_type === 'Moon') {
        const omR = c.omRadius * SCENE_SCALE;
        if (omR > 0 && omR < 30) {
          const ringGeo = new THREE.RingGeometry(omR, omR + 0.05, 96);
          const ringMat = new THREE.MeshBasicMaterial({ color: tint, transparent: true, opacity: 0.35, side: THREE.DoubleSide });
          ring = new THREE.Mesh(ringGeo, ringMat);
          ring.rotation.x = -Math.PI / 2;
          ring.position.copy(mesh.position).setY(0.05);
          scene.add(ring);
        }
      }

      bodySprites.push({ mesh, container: c, ring });
    }

    // ── Click → raycast pick a body ────────────────────────────────
    const raycaster = new THREE.Raycaster();
    const ndc = new THREE.Vector2();
    const onClick = (e: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      ndc.set(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
      raycaster.setFromCamera(ndc, camera);
      const hits = raycaster.intersectObjects(
        bodySprites.map((b) => b.mesh),
        false,
      );
      if (hits.length > 0) {
        const c = (hits[0].object as THREE.Mesh & { __container?: ObjectContainer }).__container;
        if (c) {
          setSelected(c);
          // Plan a route from origin → selected.
          try {
            const result = planner.planNavigation?.(c.name) ?? null;
            setPlan((result as NavigationPlan | null) ?? null);
          } catch (err) {
            console.warn('[UniverseView] plan_route failed', err);
            setPlan(null);
          }
        }
      }
    };
    renderer.domElement.addEventListener('click', onClick);

    // ── Render loop ──────────────────────────────────────────────
    let frame = 0;
    let disposed = false;
    const tick = () => {
      if (disposed) return;
      frame = requestAnimationFrame(tick);
      renderer.render(scene, camera);
    };
    tick();

    // ── Resize ───────────────────────────────────────────────────
    const onResize = () => {
      const nw = host.clientWidth;
      const nh = host.clientHeight;
      const a = nw / nh;
      camera.left = -viewSize * a;
      camera.right = viewSize * a;
      camera.updateProjectionMatrix();
      renderer.setSize(nw, nh);
    };
    window.addEventListener('resize', onResize);

    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      renderer.domElement.removeEventListener('click', onClick);
      window.removeEventListener('resize', onResize);
      scene.traverse((obj) => {
        const m = obj as THREE.Mesh;
        if (m.geometry) m.geometry.dispose();
        const mat = m.material;
        if (mat) {
          if (Array.isArray(mat)) mat.forEach((mm) => mm.dispose());
          else (mat as THREE.Material).dispose();
        }
      });
      renderer.dispose();
      if (renderer.domElement.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement);
    };
  }, [planner]);

  // ── FLY: hand off the selected target to the space engine via localStorage ──
  const handleFly = () => {
    if (!selected) return;
    try {
      localStorage.setItem('campaign_target', JSON.stringify({ name: selected.name, system: selected.system, type: selected.cont_type }));
    } catch {
      /* localStorage unavailable — fine */
    }
    onExit(); // App.tsx routes back to /game (or wherever the host wants)
  };

  return (
    <div style={shellStyle}>
      <div ref={containerRef} style={{ position: 'absolute', inset: 0 }} />

      {/* Top status bar */}
      <div style={topBarStyle}>
        <div style={titleStyle}>UNIVERSE MAP</div>
        <div style={subtitleStyle}>
          Origin: {origin} · {CAMPAIGN_CONTAINERS.length} bodies · {CAMPAIGN_POIS.length} POIs
        </div>
      </div>

      {/* Origin selector */}
      <div style={originBarStyle}>
        <div style={originLabelStyle}>JUMP FROM</div>
        <select value={origin} onChange={(e) => setOrigin(e.target.value)} style={originSelectStyle}>
          {CAMPAIGN_CONTAINERS.filter((c) => c.cont_type !== 'JumpPoint').map((c) => (
            <option key={c.name} value={c.name}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* Body legend (top-right) */}
      <div style={legendStyle}>
        <div style={legendTitleStyle}>BODY TYPES</div>
        {Object.entries(BODY_TINT).map(([type, hex]) => (
          <div key={type} style={legendRowStyle}>
            <span style={{ ...legendDotStyle, background: `#${hex.toString(16).padStart(6, '0')}` }} />
            <span style={legendNameStyle}>{type}</span>
          </div>
        ))}
      </div>

      {/* Right route panel */}
      <div style={panelStyle}>
        <div style={panelTitleStyle}>NAV PLAN</div>
        {selected ? (
          <>
            <div style={panelHeaderStyle}>
              <div style={panelHeaderName}>{selected.name}</div>
              <div style={panelHeaderType}>
                {selected.cont_type} · {selected.system}
              </div>
            </div>
            {plan ? (
              <>
                <div style={panelSummaryRow}>
                  <span style={panelLabelStyle}>DISTANCE</span>
                  <span style={panelValStyle}>{fmtDistance(plan.totalDistance)}</span>
                </div>
                <div style={panelSummaryRow}>
                  <span style={panelLabelStyle}>ETA</span>
                  <span style={panelValStyle}>{fmtEta(plan.totalEstimatedTime)}</span>
                </div>
                <div style={panelSummaryRow}>
                  <span style={panelLabelStyle}>QUANTUM JUMPS</span>
                  <span style={panelValStyle}>{plan.quantumJumps}</span>
                </div>
                <div style={panelSummaryRow}>
                  <span style={panelLabelStyle}>COMPLEXITY</span>
                  <span style={panelValStyle}>{plan.pathComplexity.toUpperCase()}</span>
                </div>
                <div style={segmentsHeaderStyle}>SEGMENTS</div>
                <div style={segmentsListStyle}>
                  {plan.segments.map((seg, i) => (
                    <div key={i} style={segmentRowStyle}>
                      <div style={segmentNameStyle}>
                        {seg.from.name} → {seg.to.name}
                      </div>
                      <div style={segmentMetaStyle}>
                        {fmtDistance(seg.distance)} · {seg.travelType.toUpperCase()} · {fmtEta(seg.estimatedTime)}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div style={panelEmptyStyle}>No plan available — selected body may be unreachable from origin.</div>
            )}
          </>
        ) : (
          <div style={panelEmptyStyle}>Click a body in the map to plot a route.</div>
        )}

        <div style={btnRowStyle}>
          <button onClick={onExit} style={cancelBtnStyle}>
            BACK
          </button>
          <button onClick={handleFly} disabled={!selected} style={flyBtnStyle(!!selected)}>
            FLY →
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Styles ─────────────────────────────────────────────────────────
const shellStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: '#02020a',
  color: '#cde',
  fontFamily: "'Segoe UI', monospace",
  zIndex: 200,
};
const topBarStyle: React.CSSProperties = {
  position: 'absolute',
  top: 16,
  left: '50%',
  transform: 'translateX(-50%)',
  textAlign: 'center',
  pointerEvents: 'none',
};
const titleStyle: React.CSSProperties = {
  fontSize: 16,
  fontWeight: 900,
  letterSpacing: 6,
  color: '#44ddff',
  textShadow: '0 0 16px rgba(68,221,255,0.4)',
};
const subtitleStyle: React.CSSProperties = {
  fontSize: 10,
  letterSpacing: 3,
  color: 'rgba(180,220,255,0.55)',
  marginTop: 4,
};

const originBarStyle: React.CSSProperties = {
  position: 'absolute',
  top: 16,
  left: 16,
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  padding: '6px 10px',
  borderRadius: 6,
  background: 'rgba(8,16,32,0.78)',
  border: '1px solid rgba(80,180,255,0.25)',
};
const originLabelStyle: React.CSSProperties = { fontSize: 9, letterSpacing: 2, color: 'rgba(180,220,255,0.55)' };
const originSelectStyle: React.CSSProperties = {
  background: 'rgba(8,16,32,0.85)',
  color: '#cde',
  border: '1px solid rgba(80,180,255,0.35)',
  padding: '4px 8px',
  borderRadius: 3,
  fontFamily: 'inherit',
  fontSize: 11,
};

const legendStyle: React.CSSProperties = {
  position: 'absolute',
  top: 70,
  right: 18,
  width: 130,
  background: 'rgba(8,16,32,0.78)',
  border: '1px solid rgba(80,180,255,0.25)',
  borderRadius: 6,
  padding: '8px 10px',
};
const legendTitleStyle: React.CSSProperties = {
  fontSize: 9,
  fontWeight: 800,
  letterSpacing: 2,
  color: 'rgba(120,200,255,0.6)',
  marginBottom: 6,
};
const legendRowStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 };
const legendDotStyle: React.CSSProperties = { width: 10, height: 10, borderRadius: '50%', display: 'inline-block' };
const legendNameStyle: React.CSSProperties = { fontSize: 9, color: 'rgba(180,220,255,0.7)' };

const panelStyle: React.CSSProperties = {
  position: 'absolute',
  bottom: 18,
  right: 18,
  width: 320,
  maxHeight: 'calc(100vh - 100px)',
  overflowY: 'auto',
  background: 'rgba(8,16,32,0.85)',
  border: '1px solid rgba(80,180,255,0.35)',
  borderRadius: 8,
  padding: 14,
  boxShadow: '0 4px 20px rgba(0,0,0,0.6)',
};
const panelTitleStyle: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 900,
  letterSpacing: 4,
  color: '#44ddff',
  marginBottom: 10,
  paddingBottom: 6,
  borderBottom: '1px solid rgba(80,180,255,0.25)',
};
const panelHeaderStyle: React.CSSProperties = { marginBottom: 12 };
const panelHeaderName: React.CSSProperties = { fontSize: 14, fontWeight: 800, color: '#fff' };
const panelHeaderType: React.CSSProperties = { fontSize: 9, letterSpacing: 2, color: 'rgba(180,220,255,0.55)', marginTop: 2 };

const panelSummaryRow: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  fontSize: 11,
  marginBottom: 4,
};
const panelLabelStyle: React.CSSProperties = { color: 'rgba(180,220,255,0.5)', letterSpacing: 1.5 };
const panelValStyle: React.CSSProperties = { color: '#fff', fontWeight: 700 };

const segmentsHeaderStyle: React.CSSProperties = {
  fontSize: 9,
  letterSpacing: 2,
  color: 'rgba(120,200,255,0.55)',
  marginTop: 12,
  marginBottom: 6,
  paddingBottom: 4,
  borderBottom: '1px solid rgba(80,180,255,0.15)',
};
const segmentsListStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 6 };
const segmentRowStyle: React.CSSProperties = {
  padding: '6px 8px',
  borderRadius: 4,
  background: 'rgba(20,28,42,0.7)',
  border: '1px solid rgba(80,180,255,0.15)',
};
const segmentNameStyle: React.CSSProperties = { fontSize: 11, fontWeight: 700, color: '#cde' };
const segmentMetaStyle: React.CSSProperties = { fontSize: 9, letterSpacing: 1, color: 'rgba(180,220,255,0.55)', marginTop: 2 };

const panelEmptyStyle: React.CSSProperties = {
  fontSize: 11,
  color: 'rgba(180,220,255,0.4)',
  padding: '8px 0',
};

const btnRowStyle: React.CSSProperties = { display: 'flex', gap: 8, marginTop: 14 };
const cancelBtnStyle: React.CSSProperties = {
  flex: 1,
  padding: '8px 14px',
  border: '1px solid rgba(255,80,80,0.4)',
  background: 'rgba(40,8,8,0.65)',
  color: '#ff8888',
  cursor: 'pointer',
  fontSize: 10,
  letterSpacing: 3,
  fontFamily: 'inherit',
  borderRadius: 4,
  fontWeight: 800,
};
const flyBtnStyle = (enabled: boolean): React.CSSProperties => ({
  flex: 1.4,
  padding: '8px 14px',
  border: `1px solid ${enabled ? '#44ddff' : 'rgba(80,180,255,0.2)'}`,
  background: enabled ? 'rgba(68,221,255,0.18)' : 'rgba(8,16,32,0.6)',
  color: enabled ? '#44ddff' : 'rgba(180,220,255,0.3)',
  cursor: enabled ? 'pointer' : 'not-allowed',
  fontSize: 11,
  letterSpacing: 3,
  fontFamily: 'inherit',
  borderRadius: 4,
  fontWeight: 900,
  boxShadow: enabled ? '0 0 12px rgba(68,221,255,0.3)' : 'none',
});
