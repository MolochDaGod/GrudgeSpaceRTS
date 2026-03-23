import { useState, useCallback, useRef } from 'react';
import {
  SHIP_DEFINITIONS,
  HERO_DEFINITIONS,
  BUILDABLE_SHIPS,
  HERO_SHIPS,
  UPGRADE_COSTS,
  UPGRADE_BONUSES,
  CAPTURE_TIME,
  CAPTURE_RATE_PER_UNIT,
  DOMINATION_TIME,
  NEUTRAL_DEFENDERS,
  PLANET_TYPE_DATA,
  getMapSize,
  COMMANDER_SPEC_LABEL,
  COMMANDER_TRAIN_COST,
  COMMANDER_TRAIN_TIME,
  type ShipStats,
  type PlanetType,
} from '../game/space-types';
import {
  SHIP_PREFABS,
  CAPITAL_PREFABS,
  ENEMY_PREFABS,
  STATION_PREFABS,
  EFFECT_PREFABS,
  VOXEL_FLEET_PREFABS,
  VEHICLE_PREFABS,
  WEAPON_PREFABS,
  BATTLE_SHIP_PREFABS,
  TURRET_PREFABS,
} from '../game/space-prefabs';

const ADMIN_KEY = 'gspace-admin-v1';
const ADMIN_PW = 'nexus2025';

const SHIP_PREVIEW: Record<string, string> = {
  pirate_01: '/assets/space/sprites/pirate-ships/PNG/Ships/Ship_01.png',
  pirate_02: '/assets/space/sprites/pirate-ships/PNG/Ships/Ship_02.png',
  pirate_03: '/assets/space/sprites/pirate-ships/PNG/Ships/Ship_03.png',
  pirate_04: '/assets/space/sprites/pirate-ships/PNG/Ships/Ship_04.png',
  pirate_05: '/assets/space/sprites/pirate-ships/PNG/Ships/Ship_05.png',
  pirate_06: '/assets/space/sprites/pirate-ships/PNG/Ships/Ship_06.png',
  boss_captain_01: '/assets/space/sprites/boss-ships/PNG/Boss_Icons/Icon_01.png',
  boss_captain_02: '/assets/space/sprites/boss-ships/PNG/Boss_Icons/Icon_02.png',
  boss_captain_03: '/assets/space/sprites/boss-ships/PNG/Boss_Icons/Icon_03.png',
  micro_recon: '/assets/space/models/ships/MicroRecon/MicroRecon.gif',
  red_fighter: '/assets/space/models/ships/RedFighter/RedFighter.gif',
  galactix_racer: '/assets/space/models/ships/GalactixRacer/GalactixRacer.gif',
  dual_striker: '/assets/space/models/ships/DualStriker/DualStriker.gif',
  camo_stellar_jet: '/assets/space/models/ships/CamoStellarJet/CamoStellarJet.gif',
  meteor_slicer: '/assets/space/models/ships/MeteorSlicer/MeteorSlicer.gif',
  infrared_furtive: '/assets/space/models/ships/InfraredFurtive/InfraredFurtive.gif',
  ultraviolet_intruder: '/assets/space/models/ships/UltravioletIntruder/UltravioletIntruder.gif',
  warship: '/assets/space/models/ships/Warship/Warship.gif',
  star_marine_trooper: '/assets/space/models/ships/StarMarineTrooper/StarMarineTrooper.gif',
  interstellar_runner: '/assets/space/models/ships/InterstellarRunner/InterstellarRunner.gif',
  transtellar: '/assets/space/models/ships/Transtellar/Transtellar.gif',
  pyramid_ship: '/assets/space/models/ships/PyramidShip/AncientPyramidShip.gif',
  battleship: '/assets/space/models/capital/Battleships/Battleship.png',
  destroyer: '/assets/space/models/capital/Destroyer/Destroyer.png',
  cruiser: '/assets/space/models/capital/Cruiser/Cruiser.png',
  bomber: '/assets/space/models/capital/Bomber/Bomber.png',
  // Heroes (reuse capital PNGs)
  vanguard_prime: '/assets/space/models/capital/Battleships/Battleship.png',
  shadow_reaper: '/assets/space/models/capital/Bomber/Bomber.png',
  iron_bastion: '/assets/space/models/capital/Cruiser/Cruiser.png',
  storm_herald: '/assets/space/models/capital/Destroyer/Destroyer.png',
  plague_mother: '/assets/space/models/capital/Battleships/Battleship.png',
  custom_hero: '/assets/space/models/capital/Battleships/Battleship.png',
  // Boss dreadnoughts
  boss_ship_01: '/assets/space/models/new-ships/Ship_Boos_01_Hull.png',
  boss_ship_02: '/assets/space/models/new-ships/Ship_Boss_02_Hull.png',
  // Workers
  mining_drone: '/assets/space/models/ships/MicroRecon/MicroRecon.gif',
  energy_skimmer: '/assets/space/models/ships/MicroRecon/MicroRecon.gif',
  // Corvettes
  cf_corvette_01: '/assets/space/models/battle-ships/Corvette_01.png',
  cf_corvette_02: '/assets/space/models/battle-ships/Corvette_02.png',
  cf_corvette_03: '/assets/space/models/battle-ships/Corvette_03.png',
  cf_corvette_04: '/assets/space/models/battle-ships/Corvette_04.png',
  cf_corvette_05: '/assets/space/models/battle-ships/Corvette_05.png',
  // Frigates
  cf_frigate_01: '/assets/space/models/battle-ships/Frigate_01.png',
  cf_frigate_02: '/assets/space/models/battle-ships/Frigate_02.png',
  cf_frigate_03: '/assets/space/models/battle-ships/Frigate_03.png',
  cf_frigate_04: '/assets/space/models/battle-ships/Frigate_04.png',
  cf_frigate_05: '/assets/space/models/battle-ships/Frigate_05.png',
  // Light Cruisers
  cf_light_cruiser_01: '/assets/space/models/battle-ships/Light cruiser_01.png',
  cf_light_cruiser_02: '/assets/space/models/battle-ships/Light cruiser_02.png',
  cf_light_cruiser_03: '/assets/space/models/battle-ships/Light cruiser_03.png',
  cf_light_cruiser_04: '/assets/space/models/battle-ships/Light cruiser_04.png',
  cf_light_cruiser_05: '/assets/space/models/battle-ships/Light cruiser_05.png',
  // Destroyers (battle fleet)
  cf_destroyer_01: '/assets/space/models/battle-ships/Destroyer_01.png',
  cf_destroyer_02: '/assets/space/models/battle-ships/Destroyer_02.png',
  cf_destroyer_03: '/assets/space/models/battle-ships/Destroyer_03.png',
  cf_destroyer_04: '/assets/space/models/battle-ships/Destroyer_04.png',
  cf_destroyer_05: '/assets/space/models/battle-ships/Destroyer_05.png',
};

type Tab = 'fleet' | 'assets' | 'balance' | 'config';
const C = {
  bg: '#020408',
  panel: 'rgba(6,14,30,0.95)',
  border: '#1a3050',
  accent: '#4488ff',
  gold: '#ffaa22',
  text: '#cde',
  muted: 'rgba(160,200,255,0.4)',
  danger: '#ff4444',
  green: '#44dd88',
};
const card: React.CSSProperties = { border: `1px solid ${C.border}`, borderRadius: 8, background: C.panel, overflow: 'hidden' };
const tabBtn = (a: boolean): React.CSSProperties => ({
  padding: '7px 18px',
  border: 'none',
  borderRadius: 4,
  cursor: 'pointer',
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: 1,
  background: a ? C.accent : 'transparent',
  color: a ? '#fff' : C.muted,
});
const inp: React.CSSProperties = {
  background: 'rgba(8,18,36,0.9)',
  border: `1px solid ${C.border}`,
  borderRadius: 4,
  color: C.text,
  padding: '4px 8px',
  fontSize: 12,
  width: '100%',
};

function getAllShipKeys(): string[] {
  const b = Object.values(BUILDABLE_SHIPS).flat();
  const n = Object.keys(SHIP_DEFINITIONS).filter(
    (k) => k.startsWith('pirate_') || k.startsWith('boss_captain_') || k.startsWith('boss_ship_'),
  );
  return [...new Set([...b, ...HERO_SHIPS, ...n])];
}
function getDef(key: string) {
  return SHIP_DEFINITIONS[key] ?? HERO_DEFINITIONS[key];
}

export default function AdminApp() {
  const [auth, setAuth] = useState(() => localStorage.getItem(ADMIN_KEY) === '1');
  const [tab, setTab] = useState<Tab>('fleet');
  const [pw, setPw] = useState('');
  const [pwErr, setPwErr] = useState(false);
  const login = useCallback(() => {
    if (pw === ADMIN_PW) {
      localStorage.setItem(ADMIN_KEY, '1');
      setAuth(true);
    } else {
      setPwErr(true);
      setTimeout(() => setPwErr(false), 1200);
    }
  }, [pw]);

  if (!auth)
    return (
      <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 360, padding: 40, ...card, textAlign: 'center' }}>
          <img
            src="/assets/space/ui/logo.webp"
            alt=""
            style={{ width: 200, marginBottom: 8, filter: 'drop-shadow(0 0 16px rgba(68,136,255,0.6))' }}
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
          <div style={{ fontSize: 10, color: C.muted, marginBottom: 36, letterSpacing: 3 }}>ADMIN PANEL</div>
          <input
            type="password"
            placeholder="Password"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && login()}
            style={{
              ...inp,
              marginBottom: 12,
              padding: '11px 14px',
              fontSize: 14,
              textAlign: 'center',
              borderColor: pwErr ? C.danger : C.border,
            }}
          />
          <button
            onClick={login}
            style={{
              width: '100%',
              padding: '11px',
              background: C.accent,
              border: 'none',
              borderRadius: 6,
              color: '#fff',
              fontWeight: 700,
              fontSize: 14,
              cursor: 'pointer',
            }}
          >
            AUTHENTICATE
          </button>
          {pwErr && <div style={{ color: C.danger, fontSize: 11, marginTop: 10 }}>Invalid credentials</div>}
        </div>
      </div>
    );

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: "'Segoe UI', monospace", fontSize: 13 }}>
      <div
        style={{
          background: 'rgba(2,6,16,0.98)',
          borderBottom: `1px solid ${C.border}`,
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          gap: 20,
          height: 52,
          position: 'sticky',
          top: 0,
          zIndex: 100,
        }}
      >
        <img
          src="/assets/space/ui/logo.webp"
          alt=""
          style={{ height: 30, filter: 'drop-shadow(0 0 8px rgba(68,136,255,0.5))' }}
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
        <div style={{ fontSize: 9, color: C.muted, letterSpacing: 2 }}>GAME EDITOR</div>
        <div style={{ display: 'flex', gap: 6, flex: 1 }}>
          {(['fleet', 'assets', 'balance', 'config'] as Tab[]).map((t) => (
            <button key={t} style={tabBtn(tab === t)} onClick={() => setTab(t)}>
              {t === 'fleet' ? 'FLEET REGISTRY' : t === 'assets' ? 'ASSET BROWSER' : t === 'balance' ? 'BALANCE EDITOR' : 'GAME CONFIG'}
            </button>
          ))}
        </div>
        <button
          onClick={() => {
            localStorage.removeItem(ADMIN_KEY);
            setAuth(false);
          }}
          style={{ ...tabBtn(false), color: C.danger, border: `1px solid rgba(255,68,68,0.3)` }}
        >
          LOGOUT
        </button>
      </div>
      <div style={{ padding: 24, maxWidth: 1440, margin: '0 auto' }}>
        {tab === 'fleet' && <FleetRegistry />}
        {tab === 'assets' && <AssetBrowser />}
        {tab === 'balance' && <BalanceEditor />}
        {tab === 'config' && <GameConfig />}
      </div>
    </div>
  );
}

// ── FLEET REGISTRY ──────────────────────────────────────────────────
function FleetRegistry() {
  const [filter, setFilter] = useState<'all' | 'buildable' | 'hero' | 'neutral'>('all');
  const [tierFilter, setTierFilter] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const buildable = Object.values(BUILDABLE_SHIPS).flat();
  const neutrals = Object.keys(SHIP_DEFINITIONS).filter(
    (k) => k.startsWith('pirate_') || k.startsWith('boss_captain_') || k.startsWith('boss_ship_'),
  );
  const allKeys =
    filter === 'hero'
      ? HERO_SHIPS
      : filter === 'buildable'
        ? buildable
        : filter === 'neutral'
          ? neutrals
          : [...buildable, ...HERO_SHIPS, ...neutrals];
  const filtered =
    tierFilter === 0
      ? allKeys
      : allKeys.filter((k) => {
          const d = getDef(k);
          return d?.stats.tier === tierFilter;
        });

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ fontWeight: 800, fontSize: 18, color: C.accent }}>Fleet Registry</div>
        <div style={{ display: 'flex', gap: 4 }}>
          {(['all', 'buildable', 'hero', 'neutral'] as const).map((f) => (
            <button key={f} style={tabBtn(filter === f)} onClick={() => setFilter(f)}>
              {f.toUpperCase()}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {[0, 1, 2, 3, 4, 5].map((t) => (
            <button key={t} style={tabBtn(tierFilter === t)} onClick={() => setTierFilter(t)}>
              {t === 0 ? 'ALL' : `T${t}`}
            </button>
          ))}
        </div>
        <span style={{ marginLeft: 'auto', fontSize: 11, color: C.muted }}>{filtered.length} ships</span>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
        {filtered.map((key) => {
          const def = getDef(key);
          if (!def) return null;
          const isH = !!HERO_DEFINITIONS[key],
            isN = key.startsWith('pirate_') || key.startsWith('boss_captain_') || key.startsWith('boss_ship_');
          const s = def.stats,
            sel = selected === key,
            pre = SHIP_PREVIEW[key];
          return (
            <div
              key={key}
              onClick={() => setSelected(sel ? null : key)}
              style={{
                width: 200,
                border: `1px solid ${sel ? C.accent : isN ? '#aa6622' : isH ? '#5a3a00' : C.border}`,
                borderRadius: 10,
                background: isN ? 'rgba(30,20,6,0.95)' : isH ? 'rgba(30,18,2,0.95)' : C.panel,
                cursor: 'pointer',
                overflow: 'hidden',
                boxShadow: sel ? `0 0 20px ${C.accent}44` : 'none',
              }}
            >
              <div
                style={{
                  height: 120,
                  background: '#010308',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderBottom: `1px solid ${C.border}`,
                }}
              >
                {pre ? (
                  <img
                    src={pre}
                    alt={def.displayName}
                    style={{ maxHeight: 110, maxWidth: 180, objectFit: 'contain', imageRendering: 'pixelated' }}
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <div style={{ color: C.muted, fontSize: 11 }}>No preview</div>
                )}
              </div>
              <div style={{ padding: '10px 12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontWeight: 700, fontSize: 12, color: isN ? '#cc8844' : isH ? C.gold : '#fff' }}>{def.displayName}</span>
                  <span
                    style={{
                      fontSize: 9,
                      fontWeight: 700,
                      padding: '2px 6px',
                      borderRadius: 3,
                      background: isN ? 'rgba(170,100,30,0.2)' : isH ? 'rgba(255,160,0,0.2)' : 'rgba(68,136,255,0.15)',
                      color: isN ? '#cc8844' : isH ? C.gold : C.accent,
                    }}
                  >
                    {isN ? 'NPC' : isH ? 'HERO' : `T${s.tier}`}
                  </span>
                </div>
                <div style={{ fontSize: 9, color: C.muted, letterSpacing: 1, marginBottom: 4 }}>
                  {def.class.replace(/_/g, ' ')} · {key}
                </div>
                <div style={{ fontSize: 10, color: 'rgba(180,220,255,0.7)', lineHeight: 1.6 }}>
                  HP {s.maxHp} · SHD {s.maxShield} · DMG {s.attackDamage} · SPD {s.speed}
                </div>
                {s.abilities && s.abilities.length > 0 && (
                  <div style={{ marginTop: 4, fontSize: 9, color: '#44eeff' }}>
                    {s.abilities.map((a) => (
                      <span
                        key={a.id}
                        style={{
                          display: 'inline-block',
                          marginRight: 4,
                          background: 'rgba(68,200,255,0.1)',
                          padding: '1px 5px',
                          borderRadius: 3,
                        }}
                      >
                        {a.key}:{a.name}({a.cooldown}s)
                      </span>
                    ))}
                  </div>
                )}
                {sel && (
                  <div style={{ marginTop: 8, fontSize: 10, lineHeight: 1.8, borderTop: `1px solid ${C.border}`, paddingTop: 8 }}>
                    <div>
                      Armor:{s.armor} Regen:{s.shieldRegen}/s Turn:{s.turnRate}
                    </div>
                    <div>
                      {s.attackType} CD:{s.attackCooldown}s Supply:{s.supplyCost}
                    </div>
                    <div>
                      Build:{s.buildTime}s Cost:{s.creditCost}c/{s.energyCost}e/{s.mineralCost}m
                    </div>
                    {'lore' in def && (
                      <div style={{ marginTop: 4, fontStyle: 'italic', color: '#bbaa88', fontSize: 9 }}>{(def as any).lore}</div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── ASSET BROWSER — visual gallery of ALL game assets ───────────────
// Image galleries: each entry defines a visual category with numbered/named files.
// range(n) generates [1..n], rangeFrom(a,b) generates [a..b]
const rng = (n: number) => Array.from({ length: n }, (_, i) => i + 1);
const IMG_GALLERIES: Array<{ label: string; color: string; count: number; path: (i: number) => string; size?: number }> = [
  // ── UI Icons & HUD ────────────────────────────────
  { label: 'Skill Icons Pack 1', color: '#aa66ff', count: 20, path: (i) => `/assets/space/ui/skill-icons-1/PNG/${i}.png` },
  { label: 'Skill Icons Pack 2', color: '#aa66ff', count: 20, path: (i) => `/assets/space/ui/skill-icons-2/PNG/${i}.png` },
  { label: 'Space Object Icons', color: C.accent, count: 20, path: (i) => `/assets/space/ui/space-icons/PNG/${i}.png` },
  { label: 'Item Icons', color: C.gold, count: 20, path: (i) => `/assets/space/ui/item-icons/PNG/${i}.png` },
  { label: 'Mining Icons', color: '#44dd88', count: 50, path: (i) => `/assets/space/ui/mining-icons/PNG/without background/${i}.png` },
  { label: 'Resource Icons', color: '#44ddcc', count: 40, path: (i) => `/assets/space/ui/resource-icons/${i}.png` },
  { label: 'Misc Icons', color: '#8ac', count: 20, path: (i) => `/assets/space/ui/icons/${i}.png` },
  // ── Avatars & Portraits ───────────────────────────
  {
    label: 'Cyber Avatars (no bg)',
    color: '#ff8844',
    count: 18,
    path: (i) => `/assets/space/ui/avatars-cyber/PNG/without background/${i}.png`,
  },
  { label: 'Cyber Avatars (bg)', color: '#ff8844', count: 18, path: (i) => `/assets/space/ui/avatars-cyber/PNG/background/${i}.png` },
  { label: 'Commander Portraits', color: C.green, count: 20, path: (i) => `/assets/space/ui/commanders/${i}.png`, size: 64 },
  { label: 'Commander Portraits BG', color: C.green, count: 20, path: (i) => `/assets/space/ui/commanders-bg/${i}.png`, size: 64 },
  { label: 'Sci-Fi GUI Avatars', color: '#4488ff', count: 6, path: (i) => `/assets/space/ui/scifi-gui/avatars/${i}.png`, size: 64 },
  // ── HUD Elements ──────────────────────────────────
  { label: 'Bomb Sprites', color: '#ff4444', count: 20, path: (i) => `/assets/space/ui/bombs/1 Bombs/${i}.png` },
  { label: 'Bomb Effects', color: '#ff6644', count: 12, path: (i) => `/assets/space/ui/bombs/3 Effects/${i}.png` },
  // ── Ship Sprites ──────────────────────────────────
  {
    label: 'Pirate Ships',
    color: '#cc8844',
    count: 6,
    path: (i) => `/assets/space/sprites/pirate-ships/PNG/Ships/Ship_0${i}.png`,
    size: 80,
  },
  {
    label: 'Pirate Ships (Damaged)',
    color: '#886633',
    count: 6,
    path: (i) => `/assets/space/sprites/pirate-ships/PNG/Ships/Damaged_Ship_0${i}.png`,
    size: 80,
  },
  {
    label: 'Boss Ship Icons',
    color: '#ffaa22',
    count: 3,
    path: (i) => `/assets/space/sprites/boss-ships/PNG/Boss_Icons/Icon_0${i}.png`,
    size: 80,
  },
  {
    label: 'Boss 01 Full',
    color: '#ffaa22',
    count: 1,
    path: () => `/assets/space/sprites/boss-ships/PNG/Boss_01/Boss_Full.png`,
    size: 120,
  },
  {
    label: 'Boss 02 Full',
    color: '#ffaa22',
    count: 1,
    path: () => `/assets/space/sprites/boss-ships/PNG/Boss_02/Boss_Full.png`,
    size: 120,
  },
  {
    label: 'Boss 03 Full',
    color: '#ffaa22',
    count: 1,
    path: () => `/assets/space/sprites/boss-ships/PNG/Boss_03/Boss_Full.png`,
    size: 120,
  },
  // ── Ship Model Previews ───────────────────────────
  {
    label: 'Voxel Ship GIFs',
    color: C.accent,
    count: 13,
    path: (i) => {
      const names = [
        'MicroRecon',
        'RedFighter',
        'GalactixRacer',
        'DualStriker',
        'CamoStellarJet',
        'MeteorSlicer',
        'InfraredFurtive',
        'UltravioletIntruder',
        'Warship',
        'StarMarineTrooper',
        'InterstellarRunner',
        'Transtellar',
        'PyramidShip',
      ];
      const n = names[i - 1];
      return n ? `/assets/space/models/ships/${n}/${n === 'PyramidShip' ? 'AncientPyramidShip' : n}.gif` : '';
    },
    size: 80,
  },
  {
    label: 'Capital Ship PNGs',
    color: C.gold,
    count: 4,
    path: (i) => {
      const names = ['Battleships/Battleship', 'Destroyer/Destroyer', 'Cruiser/Cruiser', 'Bomber/Bomber'];
      return `/assets/space/models/capital/${names[i - 1]}.png`;
    },
    size: 80,
  },
  // ── Explosion Spritesheets ────────────────────────
  {
    label: 'Explosions',
    color: '#ff4444',
    count: 8,
    path: (i) => {
      const names = [
        'explosion-1-a',
        'explosion-1-b',
        'explosion-1-c',
        'explosion-1-d',
        'explosion-1-e',
        'explosion-1-f',
        'explosion-1-g',
        'explosion-b',
      ];
      return `/assets/space/sprites/explosions/${names[i - 1]}.png`;
    },
    size: 80,
  },
  { label: 'Hit Effects', color: '#ffaa44', count: 6, path: (i) => `/assets/space/sprites/hits/hits-${i}.png`, size: 60 },
  {
    label: 'Shooting Effects',
    color: '#44eeff',
    count: 6,
    path: (i) => {
      const names = ['bolt', 'charged', 'crossed', 'pulse', 'spark', 'waveform'];
      return `/assets/space/sprites/shooting/${names[i - 1]}.png`;
    },
    size: 60,
  },
  // ── Backgrounds ───────────────────────────────────
  {
    label: 'Backgrounds',
    color: '#4466aa',
    count: 12,
    path: (i) => {
      const names = [
        'blue-back',
        'blue-stars',
        'blue-with-stars',
        'asteroid-1',
        'asteroid-2',
        'prop-planet-big',
        'prop-planet-small',
        'parallax-space-backgound',
        'parallax-space-big-planet',
        'parallax-space-far-planets',
        'parallax-space-ring-planet',
        'parallax-space-stars',
      ];
      return `/assets/space/backgrounds/${names[i - 1]}.png`;
    },
    size: 100,
  },
];

// 3D model prefab groups (non-visual, list only)
const MODEL_GROUPS = [
  { label: 'Fighter Ship Models', prefabs: SHIP_PREFABS, color: C.accent },
  { label: 'Battle Fleet Models', prefabs: BATTLE_SHIP_PREFABS, color: '#ff8844' },
  { label: 'Capital Ship Models', prefabs: CAPITAL_PREFABS, color: C.gold },
  { label: 'Enemy Ship Models', prefabs: ENEMY_PREFABS, color: C.danger },
  { label: 'Turret Models', prefabs: TURRET_PREFABS, color: '#88ff44' },
  { label: 'Station Models', prefabs: STATION_PREFABS, color: C.green },
  { label: 'Effect Models (GLB)', prefabs: EFFECT_PREFABS, color: '#aa66ff' },
  { label: 'Voxel Fleet Models', prefabs: VOXEL_FLEET_PREFABS, color: '#44ddcc' },
  { label: 'Vehicle Models', prefabs: VEHICLE_PREFABS, color: '#ddaa44' },
  { label: 'Weapon Models', prefabs: WEAPON_PREFABS, color: '#ff8844' },
];

function AssetBrowser() {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const toggle = (l: string) =>
    setExpanded((p) => {
      const n = new Set(p);
      n.has(l) ? n.delete(l) : n.add(l);
      return n;
    });
  const totalImages = IMG_GALLERIES.reduce((s, g) => s + g.count, 0);
  const totalModels = MODEL_GROUPS.reduce((s, g) => s + Object.keys(g.prefabs).length, 0);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <div style={{ fontWeight: 800, fontSize: 18, color: C.accent }}>Asset Browser</div>
        <span style={{ fontSize: 11, color: C.muted }}>
          {totalImages} images · {totalModels} 3D models · 1925 total files
        </span>
      </div>

      {/* ── Image Galleries ────────────────────────── */}
      <div style={{ fontSize: 14, fontWeight: 700, color: '#44ddcc', marginBottom: 12, marginTop: 8 }}>IMAGE GALLERIES</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
        {IMG_GALLERIES.map((g) => {
          const open = expanded.has(g.label);
          return (
            <div key={g.label} style={card}>
              <div
                onClick={() => toggle(g.label)}
                style={{
                  padding: '10px 16px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  background: open ? 'rgba(68,136,255,0.06)' : 'transparent',
                }}
              >
                <span style={{ color: g.color, fontWeight: 700, fontSize: 12 }}>{g.label}</span>
                <span style={{ fontSize: 10, color: C.muted }}>{g.count}</span>
                <span style={{ marginLeft: 'auto', color: C.muted, fontSize: 10 }}>{open ? '▲' : '▼'}</span>
              </div>
              {open && (
                <div style={{ padding: '8px 16px 16px', display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {rng(g.count).map((i) => {
                    const src = g.path(i);
                    if (!src) return null;
                    const sz = g.size ?? 48;
                    return (
                      <div key={i} style={{ width: sz + 8, textAlign: 'center' }}>
                        <img
                          src={src}
                          alt={`${g.label} ${i}`}
                          style={{
                            width: sz,
                            height: sz,
                            objectFit: 'contain',
                            imageRendering: 'auto',
                            border: `1px solid ${C.border}`,
                            borderRadius: 4,
                            background: 'rgba(2,4,12,0.9)',
                          }}
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                        <div style={{ fontSize: 8, color: C.muted, marginTop: 2 }}>{i}</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── 3D Model Prefabs ───────────────────────── */}
      <div style={{ fontSize: 14, fontWeight: 700, color: '#ff8844', marginBottom: 12 }}>3D MODEL PREFABS</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {MODEL_GROUPS.map(({ label, prefabs, color }) => {
          const keys = Object.keys(prefabs);
          if (!keys.length) return null;
          const open = expanded.has(label);
          return (
            <div key={label} style={card}>
              <div
                onClick={() => toggle(label)}
                style={{
                  padding: '10px 16px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  background: open ? 'rgba(68,136,255,0.06)' : 'transparent',
                }}
              >
                <span style={{ color, fontWeight: 700, fontSize: 12 }}>{label}</span>
                <span style={{ fontSize: 10, color: C.muted }}>{keys.length}</span>
                <span style={{ marginLeft: 'auto', color: C.muted, fontSize: 10 }}>{open ? '▲' : '▼'}</span>
              </div>
              {open && (
                <div style={{ padding: '8px 16px 16px', display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {keys.map((k) => {
                    const p = (prefabs as any)[k];
                    return (
                      <div
                        key={k}
                        style={{
                          padding: '6px 10px',
                          border: `1px solid ${C.border}`,
                          borderRadius: 6,
                          background: 'rgba(4,10,22,0.8)',
                          minWidth: 180,
                        }}
                      >
                        <div style={{ fontWeight: 600, color, fontSize: 11, marginBottom: 2 }}>{k}</div>
                        <div style={{ fontSize: 9, color: C.muted, wordBreak: 'break-all' }}>{p.modelPath}</div>
                        <div style={{ fontSize: 8, color: 'rgba(120,160,200,0.5)', marginTop: 2 }}>
                          {p.format.toUpperCase()} · scale {p.scale}
                          {p.hasParts ? ' · destructible' : ''}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── BALANCE EDITOR ──────────────────────────────────────────────────
type EditableStats = Record<string, Partial<ShipStats>>;

function BalanceEditor() {
  const [edits, setEdits] = useState<EditableStats>({});
  const [dirty, setDirty] = useState(false);
  const [msg, setMsg] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const allKeys = getAllShipKeys();
  const COLS: Array<{ key: keyof ShipStats; label: string }> = [
    { key: 'maxHp', label: 'HP' },
    { key: 'maxShield', label: 'SHD' },
    { key: 'armor', label: 'ARM' },
    { key: 'attackDamage', label: 'DMG' },
    { key: 'attackRange', label: 'RNG' },
    { key: 'attackCooldown', label: 'ACD' },
    { key: 'speed', label: 'SPD' },
    { key: 'creditCost', label: 'Cr' },
    { key: 'energyCost', label: 'En' },
    { key: 'mineralCost', label: 'Min' },
    { key: 'buildTime', label: 'Bld' },
    { key: 'supplyCost', label: 'Sup' },
  ];
  const getVal = (k: string, s: keyof ShipStats): number => {
    if (edits[k]?.[s] !== undefined) return edits[k][s] as number;
    return (getDef(k)?.stats[s] ?? 0) as number;
  };
  const setVal = (k: string, s: keyof ShipStats, v: number) => {
    setEdits((p) => ({ ...p, [k]: { ...p[k], [s]: v } }));
    setDirty(true);
  };

  const applyToGame = () => {
    let c = 0;
    for (const [k, ov] of Object.entries(edits)) {
      const d = getDef(k);
      if (!d) continue;
      for (const [s, v] of Object.entries(ov)) {
        (d.stats as any)[s] = v;
        c++;
      }
    }
    setMsg(`Applied ${c} changes to live game data`);
    setDirty(false);
  };
  const reset = () => {
    setEdits({});
    setDirty(false);
    setMsg('Reset');
  };
  const exportJSON = () => {
    const out: Record<string, ShipStats> = {};
    for (const k of allKeys) {
      const d = getDef(k);
      if (!d) continue;
      out[k] = { ...d.stats, ...edits[k] } as ShipStats;
    }
    const blob = new Blob([JSON.stringify(out, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `balance-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    setMsg('Exported');
  };
  const importJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => {
      try {
        const data = JSON.parse(r.result as string) as Record<string, Partial<ShipStats>>;
        const ne: EditableStats = {};
        let c = 0;
        for (const [k, stats] of Object.entries(data)) {
          const d = getDef(k);
          if (!d) continue;
          const df: Partial<ShipStats> = {};
          for (const [s, v] of Object.entries(stats)) {
            if ((d.stats as any)[s] !== v) {
              (df as any)[s] = v;
              c++;
            }
          }
          if (Object.keys(df).length > 0) ne[k] = df;
        }
        setEdits(ne);
        setDirty(c > 0);
        setMsg(`Imported ${c} diffs`);
      } catch {
        setMsg('Parse error');
      }
    };
    r.readAsText(f);
    e.target.value = '';
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ fontWeight: 800, fontSize: 18, color: C.accent }}>Balance Editor</div>
        <span style={{ fontSize: 10, color: C.muted }}>{allKeys.length} ships</span>
        {dirty && (
          <span style={{ fontSize: 10, color: C.gold, border: `1px solid ${C.gold}44`, padding: '2px 8px', borderRadius: 4 }}>UNSAVED</span>
        )}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <input ref={fileRef} type="file" accept=".json" onChange={importJSON} style={{ display: 'none' }} />
          <button
            onClick={() => fileRef.current?.click()}
            style={{
              padding: '6px 14px',
              background: 'transparent',
              border: `1px solid ${C.border}`,
              borderRadius: 4,
              color: C.muted,
              cursor: 'pointer',
              fontSize: 11,
            }}
          >
            IMPORT
          </button>
          <button
            onClick={reset}
            style={{
              padding: '6px 14px',
              background: 'transparent',
              border: `1px solid ${C.border}`,
              borderRadius: 4,
              color: C.muted,
              cursor: 'pointer',
              fontSize: 11,
            }}
          >
            RESET
          </button>
          <button
            onClick={exportJSON}
            style={{
              padding: '6px 14px',
              background: 'transparent',
              border: `1px solid ${C.gold}`,
              borderRadius: 4,
              color: C.gold,
              cursor: 'pointer',
              fontSize: 11,
              fontWeight: 700,
            }}
          >
            EXPORT
          </button>
          <button
            onClick={applyToGame}
            style={{
              padding: '6px 14px',
              background: C.green,
              border: 'none',
              borderRadius: 4,
              color: '#000',
              cursor: 'pointer',
              fontSize: 11,
              fontWeight: 700,
            }}
          >
            APPLY TO GAME
          </button>
        </div>
        {msg && <span style={{ fontSize: 10, color: C.green, width: '100%' }}>{msg}</span>}
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
          <thead>
            <tr style={{ background: 'rgba(4,10,24,0.9)', position: 'sticky', top: 52 }}>
              <th style={{ padding: '8px 10px', textAlign: 'left', color: C.muted, border: `1px solid ${C.border}` }}>Ship</th>
              <th style={{ padding: '8px 4px', color: C.muted, border: `1px solid ${C.border}` }}>T</th>
              {COLS.map((c) => (
                <th key={c.key} style={{ padding: '8px 3px', color: C.muted, border: `1px solid ${C.border}`, fontSize: 10 }}>
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {allKeys.map((key, idx) => {
              const def = getDef(key);
              if (!def) return null;
              const isH = !!HERO_DEFINITIONS[key],
                isN = key.startsWith('pirate_') || key.startsWith('boss_captain_') || key.startsWith('boss_ship_');
              const hasE = !!edits[key] && Object.keys(edits[key]).length > 0;
              return (
                <tr
                  key={key}
                  style={{
                    background: idx % 2 === 0 ? 'rgba(4,10,22,0.6)' : 'transparent',
                    borderLeft: hasE ? `3px solid ${C.gold}` : '3px solid transparent',
                  }}
                >
                  <td
                    style={{
                      padding: '4px 8px',
                      border: `1px solid ${C.border}`,
                      fontWeight: 600,
                      color: isN ? '#cc8844' : isH ? C.gold : '#fff',
                      whiteSpace: 'nowrap',
                      fontSize: 11,
                    }}
                  >
                    {SHIP_PREVIEW[key] && (
                      <img
                        src={SHIP_PREVIEW[key]}
                        alt=""
                        style={{
                          width: 22,
                          height: 16,
                          objectFit: 'contain',
                          marginRight: 4,
                          verticalAlign: 'middle',
                          imageRendering: 'pixelated',
                        }}
                      />
                    )}
                    {def.displayName}
                  </td>
                  <td style={{ padding: '4px', border: `1px solid ${C.border}`, textAlign: 'center', color: C.muted, fontSize: 10 }}>
                    {def.stats.tier}
                  </td>
                  {COLS.map((col) => {
                    const orig = (def.stats[col.key] ?? 0) as number;
                    const cur = getVal(key, col.key);
                    const ch = cur !== orig;
                    return (
                      <td key={col.key} style={{ padding: '2px', border: `1px solid ${C.border}` }}>
                        <input
                          type="number"
                          value={cur}
                          onChange={(e) => setVal(key, col.key, parseFloat(e.target.value) || 0)}
                          style={{
                            ...inp,
                            width: 58,
                            textAlign: 'center',
                            padding: '3px',
                            fontSize: 11,
                            borderColor: ch ? C.gold : C.border,
                            color: ch ? C.gold : C.text,
                          }}
                        />
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── GAME CONFIG ─────────────────────────────────────────────────────
function GameConfig() {
  const m1 = getMapSize('1v1'),
    m2 = getMapSize('2v2');
  const sections: Array<{ title: string; color: string; rows: { label: string; value: string | number; note?: string }[] }> = [
    {
      title: 'GAME RULES',
      color: C.accent,
      rows: [
        { label: 'Capture Progress', value: CAPTURE_TIME, note: 'units to capture' },
        { label: 'Capture Rate/Unit/s', value: CAPTURE_RATE_PER_UNIT },
        { label: 'Domination Hold', value: `${DOMINATION_TIME}s` },
        { label: 'Neutral Defenders', value: NEUTRAL_DEFENDERS, note: '1 boss + pirate escorts' },
        { label: '1v1 Map', value: `${m1.width.toLocaleString()} × ${m1.height.toLocaleString()}` },
        { label: '2v2/FFA Map', value: `${m2.width.toLocaleString()} × ${m2.height.toLocaleString()}` },
      ],
    },
    {
      title: 'STARTING RESOURCES (equal for all)',
      color: C.gold,
      rows: [
        { label: 'Credits', value: 500 },
        { label: 'Energy', value: 200 },
        { label: 'Minerals', value: 300 },
        { label: 'Supply', value: 50 },
        { label: 'Starting Units', value: '1 Flagship + 3 Workers', note: 'AI = Player' },
      ],
    },
    {
      title: 'FLEET COUNTS',
      color: C.green,
      rows: [
        { label: 'Buildable', value: Object.values(BUILDABLE_SHIPS).flat().length },
        { label: 'Heroes', value: HERO_SHIPS.length },
        { label: 'Pirates', value: Object.keys(SHIP_DEFINITIONS).filter((k) => k.startsWith('pirate_')).length },
        { label: 'Boss Captains', value: Object.keys(SHIP_DEFINITIONS).filter((k) => k.startsWith('boss_captain_')).length },
        { label: 'Total Defs', value: Object.keys(SHIP_DEFINITIONS).length + Object.keys(HERO_DEFINITIONS).length },
      ],
    },
    {
      title: 'AI SYSTEM',
      color: '#aa66ff',
      rows: [
        { label: 'Build Poll', value: '2s (all D1-D5)', note: 'same as human' },
        { label: 'Cheats', value: 'NONE' },
        { label: 'Stat Bonuses', value: 'NONE' },
        { label: 'Difficulty', value: '5 levels (decision quality only)' },
      ],
    },
    {
      title: 'COMMANDERS',
      color: C.green,
      rows: [
        { label: 'Specs', value: Object.values(COMMANDER_SPEC_LABEL).join(', ') },
        { label: 'Max Level', value: 5, note: '+5% stats/level' },
        ...COMMANDER_TRAIN_COST.slice(1).map((c, i) => ({
          label: `Lv${i + 1}`,
          value: `${c.credits}c/${c.energy}e/${c.minerals}m`,
          note: `${COMMANDER_TRAIN_TIME[i + 1]}s`,
        })),
      ],
    },
    {
      title: 'PLANET BIOMES',
      color: '#44ddcc',
      rows: (Object.entries(PLANET_TYPE_DATA) as [PlanetType, (typeof PLANET_TYPE_DATA)[PlanetType]][]).map(([, d]) => ({
        label: d.label,
        value: `Cr×${d.resourceMult.credits} En×${d.resourceMult.energy} Min×${d.resourceMult.minerals}`,
        note: `-20% ${d.upgradeDiscount}`,
      })),
    },
    {
      title: 'UPGRADE COSTS',
      color: C.gold,
      rows: UPGRADE_COSTS.map((c, i) => ({ label: `Level ${i + 1}`, value: `${c.credits}c / ${c.minerals}m / ${c.energy}e` })),
    },
  ];
  const full = {
    capture: { CAPTURE_TIME, CAPTURE_RATE_PER_UNIT, DOMINATION_TIME, NEUTRAL_DEFENDERS },
    maps: { '1v1': m1, '2v2': m2 },
    start: { credits: 500, energy: 200, minerals: 300, supply: 50 },
    upgradeCosts: UPGRADE_COSTS,
    upgradeBonuses: UPGRADE_BONUSES,
    biomes: PLANET_TYPE_DATA,
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <div style={{ fontWeight: 800, fontSize: 18, color: C.accent }}>Game Config</div>
        <button
          onClick={() => navigator.clipboard.writeText(JSON.stringify(full, null, 2))}
          style={{
            marginLeft: 'auto',
            padding: '6px 14px',
            background: 'transparent',
            border: `1px solid ${C.border}`,
            borderRadius: 4,
            color: C.muted,
            cursor: 'pointer',
            fontSize: 11,
          }}
        >
          COPY JSON
        </button>
      </div>
      {sections.map((sec) => (
        <div key={sec.title} style={{ ...card, marginBottom: 16 }}>
          <div
            style={{
              padding: '10px 16px',
              borderBottom: `1px solid ${C.border}`,
              fontWeight: 700,
              color: sec.color,
              fontSize: 12,
              letterSpacing: 1,
            }}
          >
            {sec.title}
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <tbody>
              {sec.rows.map((r, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? 'rgba(4,10,22,0.5)' : 'transparent' }}>
                  <td style={{ padding: '7px 16px', color: C.muted, width: '35%' }}>{r.label}</td>
                  <td style={{ padding: '7px 16px', color: C.text, fontWeight: 600 }}>{r.value}</td>
                  {r.note && (
                    <td style={{ padding: '7px 16px', color: 'rgba(140,180,220,0.4)', fontSize: 10, fontStyle: 'italic' }}>{r.note}</td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
      <div style={card}>
        <div style={{ padding: '10px 16px', borderBottom: `1px solid ${C.border}`, fontWeight: 700, color: C.muted, fontSize: 12 }}>
          RAW JSON
        </div>
        <pre style={{ padding: 16, fontSize: 11, overflowX: 'auto', color: 'rgba(180,220,255,0.7)', lineHeight: 1.6 }}>
          {JSON.stringify(full, null, 2)}
        </pre>
      </div>
    </div>
  );
}
