import { useEffect, useState, useCallback } from 'react';
import { verifyAdmin, storeToken, clearToken, hasToken, startOAuth } from './api';
import type { AdminUser } from './api';

// ── Ship data (mirrors space-config SHIP_DEFINITIONS + forge prefabs) ──
interface ShipEntry {
  key: string;
  displayName: string;
  shipClass: string;
  tier: number;
  attackType: string;
  maxHp: number;
  maxShield: number;
  speed: number;
  attackDamage: number;
  creditCost: number;
  energyCost: number;
  mineralCost: number;
  avatarUrl: string;
  lore?: string;
}

const AVATAR_BASE = '/assets/space/ui/ship-avatars';

// All forge-prefab ships — kept in sync with space-config.ts
const FORGE_SHIPS: ShipEntry[] = [
  {
    key: 'fp_fighter_01',
    displayName: 'Viper',
    shipClass: 'fighter',
    tier: 1,
    attackType: 'laser',
    maxHp: 55,
    maxShield: 18,
    speed: 80,
    attackDamage: 11,
    creditCost: 90,
    energyCost: 18,
    mineralCost: 45,
    avatarUrl: `${AVATAR_BASE}/fp_fighter_01.png`,
    lore: 'Fast strike craft from the forge fleet.',
  },
  {
    key: 'fp_fighter_02',
    displayName: 'Hornet',
    shipClass: 'heavy_fighter',
    tier: 2,
    attackType: 'pulse',
    maxHp: 75,
    maxShield: 28,
    speed: 65,
    attackDamage: 18,
    creditCost: 140,
    energyCost: 28,
    mineralCost: 70,
    avatarUrl: `${AVATAR_BASE}/fp_fighter_02.png`,
    lore: 'Twin-engine heavy fighter with reinforced hull.',
  },
  {
    key: 'fp_fighter_03',
    displayName: 'Talon',
    shipClass: 'fighter',
    tier: 2,
    attackType: 'laser',
    maxHp: 65,
    maxShield: 22,
    speed: 75,
    attackDamage: 14,
    creditCost: 115,
    energyCost: 22,
    mineralCost: 55,
    avatarUrl: `${AVATAR_BASE}/fp_fighter_03.png`,
    lore: 'Dual-cannon fighter with exceptional agility.',
  },
  {
    key: 'fp_cruiser_01',
    displayName: 'Warden',
    shipClass: 'cruiser',
    tier: 3,
    attackType: 'missile',
    maxHp: 360,
    maxShield: 130,
    speed: 30,
    attackDamage: 32,
    creditCost: 650,
    energyCost: 140,
    mineralCost: 280,
    avatarUrl: `${AVATAR_BASE}/fp_cruiser_01.png`,
    lore: 'Balanced cruiser with dual turret hardpoints.',
  },
  {
    key: 'fp_cruiser_02',
    displayName: 'Sentinel',
    shipClass: 'cruiser',
    tier: 4,
    attackType: 'missile',
    maxHp: 420,
    maxShield: 160,
    speed: 26,
    attackDamage: 38,
    creditCost: 780,
    energyCost: 170,
    mineralCost: 340,
    avatarUrl: `${AVATAR_BASE}/fp_cruiser_02.png`,
    lore: 'Tri-engine cruiser with broadside batteries.',
  },
  {
    key: 'fp_frigate_01',
    displayName: 'Corsair',
    shipClass: 'frigate',
    tier: 2,
    attackType: 'pulse',
    maxHp: 130,
    maxShield: 55,
    speed: 50,
    attackDamage: 22,
    creditCost: 240,
    energyCost: 55,
    mineralCost: 110,
    avatarUrl: `${AVATAR_BASE}/fp_frigate_01.png`,
    lore: 'Light escort frigate with rapid-fire turret.',
  },
  {
    key: 'fp_frigate_02',
    displayName: 'Buccaneer',
    shipClass: 'frigate',
    tier: 3,
    attackType: 'pulse',
    maxHp: 155,
    maxShield: 65,
    speed: 46,
    attackDamage: 26,
    creditCost: 300,
    energyCost: 65,
    mineralCost: 135,
    avatarUrl: `${AVATAR_BASE}/fp_frigate_02.png`,
    lore: 'Heavy frigate with reinforced prow armor.',
  },
  {
    key: 'fp_destroyer_01',
    displayName: 'Havoc',
    shipClass: 'destroyer',
    tier: 4,
    attackType: 'railgun',
    maxHp: 280,
    maxShield: 115,
    speed: 37,
    attackDamage: 54,
    creditCost: 540,
    energyCost: 115,
    mineralCost: 220,
    avatarUrl: `${AVATAR_BASE}/fp_destroyer_01.png`,
    lore: 'Railgun destroyer built for sustained bombardment.',
  },
  {
    key: 'fp_destroyer_02',
    displayName: 'Reaver',
    shipClass: 'destroyer',
    tier: 4,
    attackType: 'railgun',
    maxHp: 305,
    maxShield: 125,
    speed: 35,
    attackDamage: 60,
    creditCost: 580,
    energyCost: 125,
    mineralCost: 240,
    avatarUrl: `${AVATAR_BASE}/fp_destroyer_02.png`,
    lore: 'Triple-engine destroyer with broadside cannons.',
  },
  {
    key: 'fp_capital_01',
    displayName: 'Leviathan',
    shipClass: 'battleship',
    tier: 5,
    attackType: 'railgun',
    maxHp: 850,
    maxShield: 320,
    speed: 17,
    attackDamage: 65,
    creditCost: 1300,
    energyCost: 270,
    mineralCost: 540,
    avatarUrl: `${AVATAR_BASE}/fp_capital_01.png`,
    lore: 'Massive capital hull bristling with weapon batteries.',
  },
  {
    key: 'fp_heavy_dark',
    displayName: 'Obsidian',
    shipClass: 'cruiser',
    tier: 3,
    attackType: 'missile',
    maxHp: 380,
    maxShield: 140,
    speed: 28,
    attackDamage: 34,
    creditCost: 680,
    energyCost: 150,
    mineralCost: 300,
    avatarUrl: `${AVATAR_BASE}/fp_heavy_dark.png`,
    lore: 'Dark-hulled heavy cruiser with stealth plating.',
  },
  {
    key: 'fp_heavy_light',
    displayName: 'Aurora',
    shipClass: 'light_cruiser',
    tier: 2,
    attackType: 'pulse',
    maxHp: 220,
    maxShield: 90,
    speed: 40,
    attackDamage: 28,
    creditCost: 380,
    energyCost: 85,
    mineralCost: 170,
    avatarUrl: `${AVATAR_BASE}/fp_heavy_light.png`,
    lore: 'Light cruiser with triple-engine configuration.',
  },
];

// Class-to-color mapping
const CLASS_COLORS: Record<string, string> = {
  fighter: '#44aaff',
  heavy_fighter: '#4488ff',
  interceptor: '#66ccff',
  scout: '#88eeff',
  stealth: '#aa44ff',
  corvette: '#66ddaa',
  frigate: '#44ffaa',
  light_cruiser: '#88ff88',
  cruiser: '#ff8844',
  destroyer: '#ff4488',
  battleship: '#ffaa44',
  dreadnought: '#ff6622',
  carrier: '#ffcc44',
  bomber: '#ff6688',
  worker: '#88aacc',
};

const TIER_COLORS = ['', '#4488ff', '#44cc88', '#ffaa22', '#ff6644', '#ff44aa'];

// ── Styles ──
const S = {
  root: {
    minHeight: '100vh',
    background: '#020408',
    color: '#cde',
    fontFamily: "'Segoe UI', monospace",
    padding: 24,
  } as React.CSSProperties,
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    borderBottom: '1px solid #1a3050',
    paddingBottom: 16,
  } as React.CSSProperties,
  title: {
    fontSize: 24,
    fontWeight: 900,
    letterSpacing: 4,
    color: '#4488ff',
  } as React.CSSProperties,
  filterBar: {
    display: 'flex',
    gap: 8,
    marginBottom: 20,
    flexWrap: 'wrap' as const,
  } as React.CSSProperties,
  filterBtn: (active: boolean) =>
    ({
      padding: '4px 12px',
      borderRadius: 4,
      border: `1px solid ${active ? '#4488ff' : '#1a3050'}`,
      background: active ? 'rgba(68,136,255,0.15)' : 'transparent',
      color: active ? '#4df' : '#8ac',
      cursor: 'pointer',
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: 1,
    }) as React.CSSProperties,
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
    gap: 16,
  } as React.CSSProperties,
  card: {
    background: 'rgba(4,10,22,0.95)',
    border: '1px solid #1a3050',
    borderRadius: 8,
    padding: 12,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 8,
    transition: 'border-color 0.2s',
  } as React.CSSProperties,
  avatar: {
    width: 128,
    height: 128,
    borderRadius: 6,
    objectFit: 'cover' as const,
    alignSelf: 'center' as const,
    background: '#0a0e1a',
    border: '1px solid #1a3050',
  } as React.CSSProperties,
  avatarFallback: (color: string) =>
    ({
      width: 128,
      height: 128,
      borderRadius: 6,
      alignSelf: 'center' as const,
      background: `linear-gradient(135deg, ${color}22, #0a0e1a)`,
      border: `1px solid ${color}44`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: 36,
      color: `${color}88`,
      fontWeight: 900,
    }) as React.CSSProperties,
  shipName: {
    fontSize: 14,
    fontWeight: 800,
    letterSpacing: 1,
    color: '#fff',
    textAlign: 'center' as const,
  } as React.CSSProperties,
  tag: (color: string) =>
    ({
      display: 'inline-block',
      padding: '2px 8px',
      borderRadius: 3,
      fontSize: 9,
      fontWeight: 700,
      letterSpacing: 0.5,
      background: `${color}22`,
      color,
      border: `1px solid ${color}33`,
    }) as React.CSSProperties,
  statRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: 10,
    color: '#8ac',
  } as React.CSSProperties,
  statVal: {
    fontWeight: 700,
    color: '#cde',
  } as React.CSSProperties,
  lore: {
    fontSize: 9,
    color: '#6a8ab0',
    fontStyle: 'italic' as const,
    lineHeight: 1.4,
  } as React.CSSProperties,
  loginBox: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '60vh',
    gap: 16,
  } as React.CSSProperties,
  loginBtn: {
    padding: '8px 24px',
    borderRadius: 6,
    border: '1px solid #4488ff44',
    background: 'rgba(68,136,255,0.1)',
    color: '#4df',
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 700,
    letterSpacing: 1,
  } as React.CSSProperties,
};

function ShipCard({ ship }: { ship: ShipEntry }) {
  const [imgError, setImgError] = useState(false);
  const classColor = CLASS_COLORS[ship.shipClass] ?? '#4488ff';
  const tierColor = TIER_COLORS[ship.tier] ?? '#cde';

  return (
    <div
      style={S.card}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = classColor + '88')}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#1a3050')}
    >
      {!imgError ? (
        <img src={ship.avatarUrl} alt={ship.displayName} style={S.avatar} onError={() => setImgError(true)} />
      ) : (
        <div style={S.avatarFallback(classColor)}>▲</div>
      )}
      <div style={S.shipName}>{ship.displayName}</div>
      <div style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap' }}>
        <span style={S.tag(classColor)}>{ship.shipClass.replace('_', ' ').toUpperCase()}</span>
        <span style={S.tag(tierColor)}>TIER {ship.tier}</span>
        <span style={S.tag('#aaa')}>{ship.attackType.toUpperCase()}</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginTop: 4 }}>
        <div style={S.statRow}>
          <span>HP</span>
          <span style={S.statVal}>{ship.maxHp}</span>
        </div>
        <div style={S.statRow}>
          <span>Shield</span>
          <span style={S.statVal}>{ship.maxShield}</span>
        </div>
        <div style={S.statRow}>
          <span>DMG</span>
          <span style={S.statVal}>{ship.attackDamage}</span>
        </div>
        <div style={S.statRow}>
          <span>Speed</span>
          <span style={S.statVal}>{ship.speed}</span>
        </div>
        <div style={S.statRow}>
          <span>Cost</span>
          <span style={S.statVal}>
            <span style={{ color: '#fc4' }}>{ship.creditCost}c</span>
            {' / '}
            <span style={{ color: '#4df' }}>{ship.energyCost}e</span>
            {' / '}
            <span style={{ color: '#4f8' }}>{ship.mineralCost}m</span>
          </span>
        </div>
      </div>
      {ship.lore && <div style={S.lore}>{ship.lore}</div>}
    </div>
  );
}

export default function AdminApp() {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [filterClass, setFilterClass] = useState<string | null>(null);
  const [filterTier, setFilterTier] = useState<number | null>(null);

  // Check for OAuth callback token
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (token) {
      storeToken(token);
      window.history.replaceState({}, '', '/admin.html');
    }
  }, []);

  // Verify auth
  useEffect(() => {
    if (!hasToken()) {
      setAuthChecked(true);
      return;
    }
    verifyAdmin().then((u) => {
      setUser(u);
      setAuthChecked(true);
    });
  }, []);

  const logout = useCallback(() => {
    clearToken();
    setUser(null);
  }, []);

  // Filter ships
  const ships = FORGE_SHIPS.filter((s) => {
    if (filterClass && s.shipClass !== filterClass) return false;
    if (filterTier && s.tier !== filterTier) return false;
    return true;
  });

  const uniqueClasses = [...new Set(FORGE_SHIPS.map((s) => s.shipClass))];
  const uniqueTiers = [...new Set(FORGE_SHIPS.map((s) => s.tier))].sort();

  if (!authChecked) {
    return (
      <div style={S.root}>
        <div style={S.loginBox}>
          <div style={{ color: '#4488ff', fontSize: 14 }}>Loading...</div>
        </div>
      </div>
    );
  }

  // Skip auth gate for local dev — show ships regardless
  const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

  return (
    <div style={S.root}>
      <div style={S.header}>
        <div style={S.title}>GRUDA ARMADA — SHIP REGISTRY</div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          {user && <span style={{ fontSize: 11, color: '#8ac' }}>{user.displayName ?? user.username}</span>}
          {user ? (
            <button onClick={logout} style={{ ...S.loginBtn, fontSize: 10, padding: '4px 12px' }}>
              LOGOUT
            </button>
          ) : !isLocal ? (
            <button onClick={() => startOAuth('discord')} style={S.loginBtn}>
              LOGIN WITH DISCORD
            </button>
          ) : null}
        </div>
      </div>

      {/* Filters */}
      <div style={S.filterBar}>
        <span style={{ fontSize: 10, color: '#4488ff88', letterSpacing: 1, alignSelf: 'center', marginRight: 8 }}>CLASS</span>
        <div onClick={() => setFilterClass(null)} style={S.filterBtn(!filterClass)}>
          ALL
        </div>
        {uniqueClasses.map((cls) => (
          <div key={cls} onClick={() => setFilterClass(filterClass === cls ? null : cls)} style={S.filterBtn(filterClass === cls)}>
            {cls.replace('_', ' ').toUpperCase()}
          </div>
        ))}
        <span style={{ width: 1, background: '#1a3050', margin: '0 8px' }} />
        <span style={{ fontSize: 10, color: '#4488ff88', letterSpacing: 1, alignSelf: 'center', marginRight: 8 }}>TIER</span>
        <div onClick={() => setFilterTier(null)} style={S.filterBtn(!filterTier)}>
          ALL
        </div>
        {uniqueTiers.map((t) => (
          <div key={t} onClick={() => setFilterTier(filterTier === t ? null : t)} style={S.filterBtn(filterTier === t)}>
            T{t}
          </div>
        ))}
      </div>

      {/* Ship count */}
      <div style={{ fontSize: 10, color: '#4488ff88', marginBottom: 12, letterSpacing: 1 }}>{ships.length} SHIPS</div>

      {/* Ship grid */}
      <div style={S.grid}>
        {ships.map((ship) => (
          <ShipCard key={ship.key} ship={ship} />
        ))}
      </div>
    </div>
  );
}
