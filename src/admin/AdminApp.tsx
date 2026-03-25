import { useEffect, useState, useCallback, useRef } from 'react';
import { verifyAdmin, storeToken, clearToken, hasToken, startOAuth } from './api';
import type { AdminUser } from './api';
import {
  fetchHealth,
  fetchDashboardStats,
  searchPlayers,
  updatePlayer,
  fetchMatches,
  fetchAdminLeaderboard,
  fetchRemoteBalance,
  saveRemoteBalance,
  fetchRemoteConfig,
  saveRemoteConfig,
  sendAnnouncement,
  setMaintenanceMode,
  clearServerCache,
  fetchServerLogs,
} from './api';
import type { ServerHealth, DashboardStats, PlayerRecord, MatchRecord, LeaderboardEntry, GameConfigRemote } from './api';

// ── Import from THE SINGLE SOURCE OF TRUTH ─────────────────────────
// All ship data comes from space-config (re-exported via space-types barrel).
// SHIP_PREVIEW maps ship keys → image paths (GIF/PNG).
// No more duplicate arrays — admin reads what the game engine uses.
import { SHIP_DEFINITIONS, HERO_DEFINITIONS, SHIP_ROLES, SHIP_ROLE_LABELS, SHIP_ROLE_COLORS, getShipDef } from '../game/space-types';
import type { ShipRoleType } from '../game/space-types';
import { SHIP_PREVIEW } from '../game/space-ui-shared';
import { FACTION_HERO_DEFINITIONS } from '../game/space-config';

// ── Types ──────────────────────────────────────────────────────────
type AdminTab = 'ships' | 'dashboard' | 'players' | 'matches' | 'balance' | 'config' | 'tools' | 'editor';

// ── Derived ship list from real game data ──────────────────────────
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
  attackRange: number;
  armor: number;
  creditCost: number;
  energyCost: number;
  mineralCost: number;
  buildTime: number;
  supplyCost: number;
  previewUrl: string | null;
  lore?: string;
  role?: ShipRoleType;
  isHero: boolean;
  isFactionHero: boolean;
  abilities: { id: string; name: string; key: string; type: string }[];
}

function buildShipList(): ShipEntry[] {
  const entries: ShipEntry[] = [];
  const seen = new Set<string>();

  const addDef = (key: string, def: ReturnType<typeof getShipDef>, hero: boolean, factionHero: boolean) => {
    if (!def || seen.has(key)) return;
    seen.add(key);
    const s = def.stats;
    entries.push({
      key,
      displayName: def.displayName,
      shipClass: def.class,
      tier: s.tier,
      attackType: s.attackType,
      maxHp: s.maxHp,
      maxShield: s.maxShield,
      speed: s.speed,
      attackDamage: s.attackDamage,
      attackRange: s.attackRange,
      armor: s.armor,
      creditCost: s.creditCost,
      energyCost: s.energyCost,
      mineralCost: s.mineralCost,
      buildTime: s.buildTime,
      supplyCost: s.supplyCost,
      previewUrl: SHIP_PREVIEW[key] ?? null,
      lore: 'lore' in def ? (def as any).lore : undefined,
      role: SHIP_ROLES[key] as ShipRoleType | undefined,
      isHero: hero,
      isFactionHero: factionHero,
      abilities: (s.abilities ?? []).map((a) => ({ id: a.id, name: a.name, key: a.key, type: a.type })),
    });
  };

  for (const key of Object.keys(SHIP_DEFINITIONS)) {
    addDef(key, SHIP_DEFINITIONS[key] as any, false, false);
  }
  for (const key of Object.keys(HERO_DEFINITIONS)) {
    addDef(key, HERO_DEFINITIONS[key] as any, true, false);
  }
  for (const key of Object.keys(FACTION_HERO_DEFINITIONS)) {
    addDef(key, FACTION_HERO_DEFINITIONS[key] as any, true, true);
  }

  return entries;
}

const ALL_SHIPS = buildShipList();

// ── Color helpers ──────────────────────────────────────────────────
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
  assault_frigate: '#44cc88',
  transport: '#88ccdd',
};
const TIER_COLORS = ['', '#44cc88', '#4488ff', '#aa44ff', '#ff8822', '#ffcc00'];

// ── Styles ─────────────────────────────────────────────────────────
const S = {
  root: { minHeight: '100vh', background: '#020408', color: '#cde', fontFamily: "'Segoe UI', monospace" } as React.CSSProperties,
  sidebar: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    bottom: 0,
    width: 200,
    background: 'rgba(2,6,14,0.98)',
    borderRight: '1px solid #1a3050',
    display: 'flex',
    flexDirection: 'column' as const,
    zIndex: 10,
    padding: '16px 0',
  } as React.CSSProperties,
  main: { marginLeft: 200, padding: 24 } as React.CSSProperties,
  navBtn: (active: boolean) =>
    ({
      padding: '10px 20px',
      border: 'none',
      background: active ? 'rgba(68,136,255,0.15)' : 'transparent',
      borderLeft: active ? '3px solid #4488ff' : '3px solid transparent',
      color: active ? '#4df' : '#8ac',
      cursor: 'pointer',
      fontSize: 12,
      fontWeight: 700,
      letterSpacing: 1,
      textAlign: 'left' as const,
      transition: 'all 0.15s',
      display: 'block',
      width: '100%',
    }) as React.CSSProperties,
  card: {
    background: 'rgba(4,10,22,0.95)',
    border: '1px solid #1a3050',
    borderRadius: 8,
    padding: 12,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 6,
    transition: 'border-color 0.2s',
  } as React.CSSProperties,
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: 14 } as React.CSSProperties,
  filterBar: { display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' as const, alignItems: 'center' } as React.CSSProperties,
  filterBtn: (active: boolean) =>
    ({
      padding: '4px 10px',
      borderRadius: 4,
      border: `1px solid ${active ? '#4488ff' : '#1a3050'}`,
      background: active ? 'rgba(68,136,255,0.15)' : 'transparent',
      color: active ? '#4df' : '#68a',
      cursor: 'pointer',
      fontSize: 10,
      fontWeight: 700,
      letterSpacing: 0.5,
    }) as React.CSSProperties,
  tag: (color: string) =>
    ({
      display: 'inline-block',
      padding: '2px 6px',
      borderRadius: 3,
      fontSize: 9,
      fontWeight: 700,
      background: `${color}22`,
      color,
      border: `1px solid ${color}33`,
      letterSpacing: 0.5,
    }) as React.CSSProperties,
  statRow: { display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#8ac' } as React.CSSProperties,
  statVal: { fontWeight: 700, color: '#cde' } as React.CSSProperties,
  input: {
    padding: '6px 10px',
    background: 'rgba(6,14,30,0.9)',
    border: '1px solid #1a3050',
    borderRadius: 4,
    color: '#cde',
    fontSize: 12,
    outline: 'none',
  } as React.CSSProperties,
  btn: (color = '#4488ff') =>
    ({
      padding: '6px 16px',
      borderRadius: 5,
      border: `1px solid ${color}66`,
      background: `${color}18`,
      color,
      cursor: 'pointer',
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: 0.5,
    }) as React.CSSProperties,
  loginBox: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '80vh',
    gap: 16,
  } as React.CSSProperties,
  sectionTitle: { fontSize: 16, fontWeight: 800, color: '#4488ff', letterSpacing: 2, marginBottom: 12 } as React.CSSProperties,
  metricCard: {
    padding: '16px 20px',
    borderRadius: 8,
    background: 'rgba(6,14,30,0.8)',
    border: '1px solid #1a3050',
    textAlign: 'center' as const,
    minWidth: 130,
  } as React.CSSProperties,
};

// ── Ship Card ──────────────────────────────────────────────────────
function ShipCard({ ship }: { ship: ShipEntry }) {
  const [imgErr, setImgErr] = useState(false);
  const cls = CLASS_COLORS[ship.shipClass] ?? '#4488ff';
  const tc = TIER_COLORS[ship.tier] ?? '#cde';
  const rc = ship.role ? SHIP_ROLE_COLORS[ship.role] : null;

  return (
    <div
      style={S.card}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = cls + '88')}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#1a3050')}
    >
      <div
        style={{
          height: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(2,4,12,0.9)',
          borderRadius: 6,
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {ship.previewUrl && !imgErr ? (
          <img
            src={ship.previewUrl}
            alt={ship.displayName}
            style={{
              maxHeight: 90,
              maxWidth: '100%',
              objectFit: 'contain',
              imageRendering: ship.previewUrl.endsWith('.gif') ? 'auto' : 'pixelated',
            }}
            onError={() => setImgErr(true)}
          />
        ) : (
          <div style={{ fontSize: 32, opacity: 0.15 }}>{ship.tier >= 5 ? '🛸' : ship.tier >= 3 ? '⚔️' : '🚀'}</div>
        )}
        <div style={{ position: 'absolute', top: 4, right: 4, ...S.tag(ship.isHero ? '#ffcc00' : tc) }}>
          {ship.isHero ? (ship.isFactionHero ? 'FACTION' : 'HERO') : `T${ship.tier}`}
        </div>
        {rc && <div style={{ position: 'absolute', top: 4, left: 4, ...S.tag(rc) }}>{SHIP_ROLE_LABELS[ship.role!]}</div>}
      </div>
      <div style={{ fontSize: 13, fontWeight: 800, color: ship.isHero ? '#fc4' : '#fff', textAlign: 'center' }}>{ship.displayName}</div>
      <div style={{ display: 'flex', gap: 4, justifyContent: 'center', flexWrap: 'wrap' }}>
        <span style={S.tag(cls)}>{ship.shipClass.replace(/_/g, ' ').toUpperCase()}</span>
        <span style={S.tag('#aaa')}>{ship.attackType.toUpperCase()}</span>
      </div>
      <div style={{ fontSize: 8, color: '#445', textAlign: 'center' }}>{ship.key}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <div style={S.statRow}>
          <span>HP</span>
          <span style={S.statVal}>{ship.maxHp}</span>
        </div>
        <div style={S.statRow}>
          <span>Shield</span>
          <span style={S.statVal}>{ship.maxShield}</span>
        </div>
        <div style={S.statRow}>
          <span>Armor</span>
          <span style={S.statVal}>{ship.armor}</span>
        </div>
        <div style={S.statRow}>
          <span>DMG</span>
          <span style={S.statVal}>{ship.attackDamage}</span>
        </div>
        <div style={S.statRow}>
          <span>Range</span>
          <span style={S.statVal}>{ship.attackRange}</span>
        </div>
        <div style={S.statRow}>
          <span>Speed</span>
          <span style={S.statVal}>{ship.speed}</span>
        </div>
        <div style={S.statRow}>
          <span>Build</span>
          <span style={S.statVal}>
            {ship.buildTime}s · {ship.supplyCost} sup
          </span>
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
      {ship.abilities.length > 0 && (
        <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap', marginTop: 2 }}>
          {ship.abilities.map((a) => (
            <span key={a.id + a.key} style={{ ...S.tag('#44ddff'), fontSize: 8 }}>
              [{a.key}] {a.name}
            </span>
          ))}
        </div>
      )}
      {ship.lore && <div style={{ fontSize: 8, color: '#6a8ab0', fontStyle: 'italic', lineHeight: 1.3, marginTop: 2 }}>{ship.lore}</div>}
    </div>
  );
}

// ── Ships Tab ──────────────────────────────────────────────────────
function ShipsTab() {
  const [filterClass, setFilterClass] = useState<string | null>(null);
  const [filterTier, setFilterTier] = useState<number | null>(null);
  const [filterHero, setFilterHero] = useState<boolean | null>(null);
  const [search, setSearch] = useState('');

  const uniqueClasses = [...new Set(ALL_SHIPS.map((s) => s.shipClass))].sort();
  const uniqueTiers = [...new Set(ALL_SHIPS.map((s) => s.tier))].sort();

  const ships = ALL_SHIPS.filter((s) => {
    if (filterClass && s.shipClass !== filterClass) return false;
    if (filterTier && s.tier !== filterTier) return false;
    if (filterHero === true && !s.isHero) return false;
    if (filterHero === false && s.isHero) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!s.displayName.toLowerCase().includes(q) && !s.key.toLowerCase().includes(q) && !s.shipClass.includes(q)) return false;
    }
    return true;
  });

  return (
    <div>
      <div style={S.sectionTitle}>SHIP REGISTRY — {ALL_SHIPS.length} SHIPS (SINGLE SOURCE)</div>
      <div style={{ fontSize: 10, color: '#445', marginBottom: 12 }}>
        Data from <code style={{ color: '#68a' }}>space-config.ts</code> · Images from <code style={{ color: '#68a' }}>SHIP_PREVIEW</code>
      </div>
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search ships..."
        style={{ ...S.input, width: 260, marginBottom: 12 }}
      />
      <div style={S.filterBar}>
        <span style={{ fontSize: 9, color: '#4488ff88', letterSpacing: 1, marginRight: 6 }}>TYPE</span>
        <div onClick={() => setFilterHero(null)} style={S.filterBtn(filterHero === null)}>
          ALL
        </div>
        <div onClick={() => setFilterHero(false)} style={S.filterBtn(filterHero === false)}>
          STANDARD
        </div>
        <div onClick={() => setFilterHero(true)} style={S.filterBtn(filterHero === true)}>
          HEROES
        </div>
      </div>
      <div style={S.filterBar}>
        <span style={{ fontSize: 9, color: '#4488ff88', letterSpacing: 1, marginRight: 6 }}>CLASS</span>
        <div onClick={() => setFilterClass(null)} style={S.filterBtn(!filterClass)}>
          ALL
        </div>
        {uniqueClasses.map((c) => (
          <div key={c} onClick={() => setFilterClass(filterClass === c ? null : c)} style={S.filterBtn(filterClass === c)}>
            {c.replace(/_/g, ' ').toUpperCase()}
          </div>
        ))}
      </div>
      <div style={S.filterBar}>
        <span style={{ fontSize: 9, color: '#4488ff88', letterSpacing: 1, marginRight: 6 }}>TIER</span>
        <div onClick={() => setFilterTier(null)} style={S.filterBtn(!filterTier)}>
          ALL
        </div>
        {uniqueTiers.map((t) => (
          <div key={t} onClick={() => setFilterTier(filterTier === t ? null : t)} style={S.filterBtn(filterTier === t)}>
            T{t}
          </div>
        ))}
      </div>
      <div style={{ fontSize: 10, color: '#4488ff88', marginBottom: 10 }}>{ships.length} SHIPS</div>
      <div style={S.grid}>
        {ships.map((ship) => (
          <ShipCard key={ship.key} ship={ship} />
        ))}
      </div>
    </div>
  );
}

// ── Dashboard Tab ──────────────────────────────────────────────────
function DashboardTab() {
  const [health, setHealth] = useState<ServerHealth | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [leaders, setLeaders] = useState<LeaderboardEntry[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchHealth(), fetchDashboardStats(), fetchAdminLeaderboard()]).then(([h, s, l]) => {
      setHealth(h);
      setStats(s);
      setLeaders(l);
      setLoading(false);
    });
  }, []);

  if (loading) return <div style={{ color: '#4488ff', padding: 40 }}>Loading dashboard...</div>;

  const Metric = ({ label, value, color = '#cde' }: { label: string; value: string | number; color?: string }) => (
    <div style={S.metricCard}>
      <div style={{ fontSize: 9, color: '#68a', letterSpacing: 1 }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 800, color, marginTop: 4 }}>{value}</div>
    </div>
  );

  return (
    <div>
      <div style={S.sectionTitle}>DASHBOARD</div>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}>
        <Metric label="STATUS" value={health?.status?.toUpperCase() ?? 'OFFLINE'} color={health?.status === 'ok' ? '#44ee88' : '#ff4444'} />
        <Metric label="DB" value={health?.dbConnected ? 'CONNECTED' : 'DOWN'} color={health?.dbConnected ? '#44ee88' : '#ff4444'} />
        <Metric label="VERSION" value={health?.version ?? '—'} />
        <Metric label="UPTIME" value={health ? `${Math.floor(health.uptime / 3600)}h` : '—'} />
        <Metric label="ONLINE" value={health?.playerCount ?? '—'} color="#4df" />
        <Metric label="MATCHES" value={health?.activeMatches ?? '—'} color="#fc4" />
      </div>
      {stats && (
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}>
          <Metric label="TOTAL PLAYERS" value={stats.totalPlayers} color="#4df" />
          <Metric label="TOTAL MATCHES" value={stats.totalMatches} color="#fc4" />
          <Metric label="ACTIVE 24H" value={stats.activeLast24h} color="#44ee88" />
          <Metric label="MATCHES 24H" value={stats.matchesLast24h} color="#ff8822" />
          <Metric label="AVG DURATION" value={`${Math.floor(stats.avgMatchDuration / 60)}m`} />
          <Metric label="TOP FACTION" value={stats.topFaction} color="#fc4" />
        </div>
      )}
      {leaders && leaders.length > 0 && (
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#8ac', letterSpacing: 1, marginBottom: 8 }}>TOP COMMANDERS</div>
          {leaders.slice(0, 10).map((l, i) => (
            <div
              key={l.grudge_id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '6px 12px',
                background: 'rgba(6,14,30,0.7)',
                borderRadius: 5,
                border: '1px solid #1a305044',
                marginBottom: 3,
              }}
            >
              <span style={{ fontSize: 12, fontWeight: 800, color: i < 3 ? '#fc4' : '#68a', width: 24 }}>#{i + 1}</span>
              {l.avatarUrl && <img src={l.avatarUrl} alt="" style={{ width: 20, height: 20, borderRadius: 3 }} />}
              <span style={{ fontSize: 11, fontWeight: 600, color: '#cde', flex: 1 }}>{l.username}</span>
              <span style={{ fontSize: 10, color: '#44ee88', fontWeight: 700 }}>{l.wins}W</span>
              <span style={{ fontSize: 9, color: '#68a' }}>{Math.floor(l.avg_duration_s / 60)}m avg</span>
            </div>
          ))}
        </div>
      )}
      {!health && !stats && <div style={{ color: '#ff6644', fontSize: 12 }}>Backend unreachable — check VITE_GRUDGE_API</div>}
    </div>
  );
}

// ── Players Tab ────────────────────────────────────────────────────
function PlayersTab() {
  const [query, setQuery] = useState('');
  const [players, setPlayers] = useState<PlayerRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<PlayerRecord>>({});

  const doSearch = useCallback(async (q: string, p: number) => {
    const res = await searchPlayers(q, p);
    if (res) {
      setPlayers(res.players);
      setTotal(res.total);
    }
  }, []);

  useEffect(() => {
    doSearch('', 1);
  }, [doSearch]);

  const handleSave = async (grudgeId: string) => {
    const ok = await updatePlayer(grudgeId, editForm);
    if (ok) {
      setEditing(null);
      doSearch(query, page);
    }
  };

  return (
    <div>
      <div style={S.sectionTitle}>PLAYER MANAGEMENT</div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search..."
          style={{ ...S.input, flex: 1, maxWidth: 300 }}
          onKeyDown={(e) => e.key === 'Enter' && doSearch(query, 1)}
        />
        <button
          onClick={() => {
            setPage(1);
            doSearch(query, 1);
          }}
          style={S.btn()}
        >
          SEARCH
        </button>
      </div>
      <div style={{ fontSize: 10, color: '#68a', marginBottom: 8 }}>
        {total} players · Page {page}
      </div>
      {players.map((p) => (
        <div
          key={p.grudgeId}
          style={{
            padding: '8px 14px',
            background: 'rgba(6,14,30,0.7)',
            borderRadius: 6,
            border: `1px solid ${p.isBanned ? '#ff444444' : '#1a305044'}`,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            flexWrap: 'wrap',
            marginBottom: 3,
          }}
        >
          {p.avatarUrl && <img src={p.avatarUrl} alt="" style={{ width: 28, height: 28, borderRadius: 4 }} />}
          <div style={{ flex: '1 1 160px' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: p.isBanned ? '#ff4444' : '#cde' }}>
              {p.displayName} {p.isBanned && <span style={S.tag('#ff4444')}>BANNED</span>}
            </div>
            <div style={{ fontSize: 9, color: '#556' }}>{p.grudgeId}</div>
          </div>
          <span style={{ fontSize: 10, color: '#fc4' }}>{p.gold}g</span>
          <span style={{ fontSize: 10, color: '#4df' }}>{p.gbuxBalance}gbux</span>
          <span style={{ fontSize: 9, color: '#68a' }}>
            {p.matchCount}M/{p.winCount}W
          </span>
          {editing === p.grudgeId ? (
            <div style={{ display: 'flex', gap: 4 }}>
              <input
                type="number"
                placeholder="gold"
                value={editForm.gold ?? p.gold}
                onChange={(e) => setEditForm({ ...editForm, gold: +e.target.value })}
                style={{ ...S.input, width: 60 }}
              />
              <input
                type="number"
                placeholder="gbux"
                value={editForm.gbuxBalance ?? p.gbuxBalance}
                onChange={(e) => setEditForm({ ...editForm, gbuxBalance: +e.target.value })}
                style={{ ...S.input, width: 60 }}
              />
              <button onClick={() => handleSave(p.grudgeId)} style={S.btn('#44ee88')}>
                SAVE
              </button>
              <button onClick={() => setEditing(null)} style={S.btn('#ff4444')}>
                X
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                setEditing(p.grudgeId);
                setEditForm({});
              }}
              style={S.btn()}
            >
              EDIT
            </button>
          )}
        </div>
      ))}
      {total > 20 && (
        <div style={{ display: 'flex', gap: 8, marginTop: 12, justifyContent: 'center' }}>
          <button
            disabled={page <= 1}
            onClick={() => {
              setPage(page - 1);
              doSearch(query, page - 1);
            }}
            style={S.btn()}
          >
            PREV
          </button>
          <button
            onClick={() => {
              setPage(page + 1);
              doSearch(query, page + 1);
            }}
            style={S.btn()}
          >
            NEXT
          </button>
        </div>
      )}
    </div>
  );
}

// ── Matches Tab ────────────────────────────────────────────────────
function MatchesTab() {
  const [matches, setMatches] = useState<MatchRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchMatches(1).then((r) => {
      if (r) {
        setMatches(r.matches);
        setTotal(r.total);
      }
    });
  }, []);

  const loadPage = (p: number) => {
    setPage(p);
    fetchMatches(p).then((r) => {
      if (r) {
        setMatches(r.matches);
        setTotal(r.total);
      }
    });
  };

  return (
    <div>
      <div style={S.sectionTitle}>MATCH HISTORY</div>
      <div style={{ fontSize: 10, color: '#68a', marginBottom: 12 }}>
        {total} total · Page {page}
      </div>
      {matches.map((m) => (
        <div
          key={m.id}
          style={{
            padding: '8px 14px',
            background: 'rgba(6,14,30,0.7)',
            borderRadius: 6,
            border: '1px solid #1a305044',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            marginBottom: 3,
          }}
        >
          <span style={S.tag('#4488ff')}>{m.mode}</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#44ee88', flex: 1 }}>{m.winnerName}</span>
          {m.loserName && <span style={{ fontSize: 10, color: '#ff6644' }}>vs {m.loserName}</span>}
          <span style={{ fontSize: 9, color: '#68a' }}>
            {Math.floor(m.durationS / 60)}m{m.durationS % 60}s
          </span>
          <span style={{ fontSize: 8, color: '#445' }}>{new Date(m.playedAt).toLocaleDateString()}</span>
        </div>
      ))}
      {total > 25 && (
        <div style={{ display: 'flex', gap: 8, marginTop: 12, justifyContent: 'center' }}>
          <button disabled={page <= 1} onClick={() => loadPage(page - 1)} style={S.btn()}>
            PREV
          </button>
          <button onClick={() => loadPage(page + 1)} style={S.btn()}>
            NEXT
          </button>
        </div>
      )}
    </div>
  );
}

// ── Balance Editor Tab ─────────────────────────────────────────────
function BalanceTab() {
  const [balance, setBalance] = useState<Record<string, Record<string, number>> | null>(null);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState('');

  useEffect(() => {
    fetchRemoteBalance().then(setBalance);
  }, []);

  const updateVal = (ship: string, stat: string, val: number) => {
    if (!balance) return;
    setBalance({ ...balance, [ship]: { ...balance[ship], [stat]: val } });
    setDirty(true);
  };

  const save = async () => {
    if (!balance) return;
    setSaving(true);
    const ok = await saveRemoteBalance(balance);
    setStatus(ok ? 'Saved!' : 'Failed');
    setDirty(!ok);
    setSaving(false);
    setTimeout(() => setStatus(''), 3000);
  };

  return (
    <div>
      <div style={S.sectionTitle}>BALANCE OVERRIDES</div>
      <div style={{ fontSize: 10, color: '#68a', marginBottom: 12 }}>Remote stat overrides applied on top of local definitions.</div>
      {balance ? (
        <>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'center' }}>
            <button onClick={save} disabled={!dirty || saving} style={S.btn(dirty ? '#44ee88' : '#68a')}>
              {saving ? 'SAVING...' : 'SAVE'}
            </button>
            {status && <span style={{ fontSize: 10, color: status === 'Saved!' ? '#44ee88' : '#ff4444' }}>{status}</span>}
          </div>
          {Object.entries(balance).map(([ship, stats]) => (
            <div
              key={ship}
              style={{
                marginBottom: 10,
                padding: '10px 14px',
                background: 'rgba(6,14,30,0.7)',
                borderRadius: 6,
                border: '1px solid #1a305044',
              }}
            >
              <div style={{ fontSize: 12, fontWeight: 700, color: '#cde', marginBottom: 6 }}>{ship}</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {Object.entries(stats).map(([stat, val]) => (
                  <div key={stat} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ fontSize: 9, color: '#68a', width: 70 }}>{stat}</span>
                    <input
                      type="number"
                      value={val}
                      onChange={(e) => updateVal(ship, stat, +e.target.value)}
                      style={{ ...S.input, width: 70 }}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </>
      ) : (
        <div style={{ color: '#68a', fontSize: 11 }}>No remote balance overrides (or backend unreachable).</div>
      )}
    </div>
  );
}

// ── Config Tab ─────────────────────────────────────────────────────
function ConfigTab() {
  const [config, setConfig] = useState<GameConfigRemote | null>(null);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState('');

  useEffect(() => {
    fetchRemoteConfig().then(setConfig);
  }, []);

  const updateField = (key: string, val: unknown) => {
    if (!config) return;
    setConfig({ ...config, [key]: val });
    setDirty(true);
  };

  const save = async () => {
    if (!config) return;
    setSaving(true);
    const ok = await saveRemoteConfig(config);
    setStatus(ok ? 'Saved!' : 'Failed');
    setDirty(!ok);
    setSaving(false);
    setTimeout(() => setStatus(''), 3000);
  };

  return (
    <div>
      <div style={S.sectionTitle}>GAME CONFIG</div>
      {config ? (
        <>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'center' }}>
            <button onClick={save} disabled={!dirty || saving} style={S.btn(dirty ? '#44ee88' : '#68a')}>
              {saving ? 'SAVING...' : 'SAVE'}
            </button>
            {status && <span style={{ fontSize: 10, color: status === 'Saved!' ? '#44ee88' : '#ff4444' }}>{status}</span>}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 10 }}>
            {(['captureTime', 'captureRatePerUnit', 'dominationTime', 'neutralDefenders'] as const).map((k) => (
              <div
                key={k}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 12px',
                  background: 'rgba(6,14,30,0.7)',
                  borderRadius: 6,
                }}
              >
                <span style={{ fontSize: 10, color: '#8ac', flex: 1 }}>{k}</span>
                <input
                  type="number"
                  value={(config[k] as number) ?? ''}
                  onChange={(e) => updateField(k, +e.target.value)}
                  style={{ ...S.input, width: 80 }}
                />
              </div>
            ))}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 12px',
                background: 'rgba(6,14,30,0.7)',
                borderRadius: 6,
              }}
            >
              <span style={{ fontSize: 10, color: '#8ac', flex: 1 }}>maintenanceMode</span>
              <button
                onClick={() => updateField('maintenanceMode', !config.maintenanceMode)}
                style={S.btn(config.maintenanceMode ? '#ff4444' : '#44ee88')}
              >
                {config.maintenanceMode ? 'ON' : 'OFF'}
              </button>
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 12px',
                background: 'rgba(6,14,30,0.7)',
                borderRadius: 6,
                gridColumn: '1 / -1',
              }}
            >
              <span style={{ fontSize: 10, color: '#8ac', width: 60 }}>MOTD</span>
              <input
                value={config.motd ?? ''}
                onChange={(e) => updateField('motd', e.target.value)}
                style={{ ...S.input, flex: 1 }}
                placeholder="Message of the Day"
              />
            </div>
          </div>
        </>
      ) : (
        <div style={{ color: '#68a', fontSize: 11 }}>No remote config (or backend unreachable).</div>
      )}
    </div>
  );
}

// ── Server Tools Tab ───────────────────────────────────────────────
function ToolsTab() {
  const [msg, setMsg] = useState('');
  const [logs, setLogs] = useState<{ timestamp: string; level: string; message: string }[]>([]);
  const [status, setStatus] = useState('');
  const flash = (s: string) => {
    setStatus(s);
    setTimeout(() => setStatus(''), 3000);
  };

  return (
    <div>
      <div style={S.sectionTitle}>SERVER TOOLS</div>
      {status && (
        <div
          style={{
            marginBottom: 12,
            padding: '6px 14px',
            borderRadius: 5,
            background: 'rgba(68,238,136,0.1)',
            border: '1px solid #44ee8844',
            color: '#44ee88',
            fontSize: 11,
          }}
        >
          {status}
        </div>
      )}
      <div style={{ marginBottom: 20, padding: 16, background: 'rgba(6,14,30,0.7)', borderRadius: 8, border: '1px solid #1a305044' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#8ac', letterSpacing: 1, marginBottom: 8 }}>BROADCAST</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="Message..." style={{ ...S.input, flex: 1 }} />
          <button
            onClick={async () => {
              const ok = await sendAnnouncement(msg);
              flash(ok ? 'Sent!' : 'Failed');
              if (ok) setMsg('');
            }}
            style={S.btn('#ffaa22')}
          >
            SEND
          </button>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <button onClick={async () => flash((await setMaintenanceMode(true)) ? 'Maintenance ON' : 'Failed')} style={S.btn('#ff6644')}>
          MAINTENANCE ON
        </button>
        <button onClick={async () => flash((await setMaintenanceMode(false)) ? 'Maintenance OFF' : 'Failed')} style={S.btn('#44ee88')}>
          MAINTENANCE OFF
        </button>
        <button onClick={async () => flash((await clearServerCache()) ? 'Cache cleared' : 'Failed')} style={S.btn('#ffaa22')}>
          CLEAR CACHE
        </button>
        <button
          onClick={async () => {
            const r = await fetchServerLogs(50);
            if (r) setLogs(r.logs);
            else flash('Failed');
          }}
          style={S.btn()}
        >
          FETCH LOGS
        </button>
      </div>
      {logs.length > 0 && (
        <div
          style={{
            maxHeight: 400,
            overflowY: 'auto',
            background: 'rgba(2,4,8,0.9)',
            borderRadius: 6,
            padding: 10,
            border: '1px solid #1a305044',
            fontFamily: 'monospace',
          }}
        >
          {logs.map((l, i) => (
            <div
              key={i}
              style={{ fontSize: 10, color: l.level === 'error' ? '#ff4444' : l.level === 'warn' ? '#ffaa22' : '#8ac', marginBottom: 2 }}
            >
              <span style={{ color: '#445' }}>{new Date(l.timestamp).toLocaleTimeString()}</span> [{l.level.toUpperCase()}] {l.message}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── 2D Editor Tab ──────────────────────────────────────────────────
interface EditorElement {
  id: string;
  type: 'panel' | 'button' | 'text' | 'image' | 'bar' | 'slot';
  x: number;
  y: number;
  w: number;
  h: number;
  label: string;
  color: string;
  fontSize: number;
}

function EditorTab() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [elements, setElements] = useState<EditorElement[]>([
    { id: 'hud_panel', type: 'panel', x: 10, y: 10, w: 220, h: 80, label: 'HUD Panel', color: '#0a1628', fontSize: 12 },
    { id: 'res_bar', type: 'bar', x: 240, y: 10, w: 300, h: 28, label: 'Resource Bar', color: '#4488ff', fontSize: 10 },
    { id: 'menu_btn', type: 'button', x: 10, y: 100, w: 120, h: 36, label: 'MENU', color: '#4488ff', fontSize: 12 },
    { id: 'minimap', type: 'panel', x: 10, y: 400, w: 180, h: 180, label: 'Minimap', color: '#060e1e', fontSize: 10 },
    { id: 'unit_frame', type: 'panel', x: 200, y: 400, w: 260, h: 100, label: 'Unit Frame', color: '#0a1628', fontSize: 10 },
    { id: 'ability_slot', type: 'slot', x: 200, y: 510, w: 40, h: 40, label: 'Q', color: '#44ddff', fontSize: 14 },
  ]);
  const [selected, setSelected] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [dragOff, setDragOff] = useState({ x: 0, y: 0 });
  const [addType, setAddType] = useState<EditorElement['type']>('panel');

  const selEl = elements.find((e) => e.id === selected);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const W = (canvas.width = 800),
      H = (canvas.height = 600);
    ctx.fillStyle = '#010308';
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = '#1a305033';
    for (let x = 0; x < W; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, H);
      ctx.stroke();
    }
    for (let y = 0; y < H; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }

    for (const el of elements) {
      const isSel = el.id === selected;
      ctx.save();
      const border = isSel ? '#ffcc00' : '#1a3050';
      ctx.lineWidth = isSel ? 2 : 1;

      if (el.type === 'panel' || el.type === 'image') {
        ctx.fillStyle = el.color + (el.type === 'image' ? '' : 'dd');
        ctx.strokeStyle = border;
        ctx.beginPath();
        ctx.roundRect(el.x, el.y, el.w, el.h, 6);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = el.type === 'image' ? '#445' : '#8ac';
        ctx.font = `${el.fontSize}px monospace`;
        ctx.textAlign = el.type === 'image' ? 'center' : 'start';
        ctx.textBaseline = el.type === 'image' ? 'middle' : 'alphabetic';
        ctx.fillText(
          el.label,
          el.type === 'image' ? el.x + el.w / 2 : el.x + 8,
          el.type === 'image' ? el.y + el.h / 2 : el.y + el.fontSize + 6,
        );
      } else if (el.type === 'button' || el.type === 'slot') {
        ctx.fillStyle = el.type === 'button' ? el.color + '33' : '#060e1e';
        ctx.strokeStyle = isSel ? '#ffcc00' : el.color + (el.type === 'slot' ? '66' : '88');
        ctx.beginPath();
        ctx.roundRect(el.x, el.y, el.w, el.h, el.type === 'slot' ? 4 : 5);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = el.color;
        ctx.font = `bold ${el.fontSize}px monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(el.label, el.x + el.w / 2, el.y + el.h / 2);
      } else if (el.type === 'bar') {
        ctx.fillStyle = '#0a0e1a';
        ctx.beginPath();
        ctx.roundRect(el.x, el.y, el.w, el.h, 4);
        ctx.fill();
        ctx.fillStyle = el.color + '66';
        ctx.beginPath();
        ctx.roundRect(el.x + 2, el.y + 2, (el.w - 4) * 0.7, el.h - 4, 3);
        ctx.fill();
        ctx.strokeStyle = border;
        ctx.beginPath();
        ctx.roundRect(el.x, el.y, el.w, el.h, 4);
        ctx.stroke();
        ctx.fillStyle = '#cde';
        ctx.font = `${el.fontSize}px monospace`;
        ctx.textAlign = 'start';
        ctx.textBaseline = 'alphabetic';
        ctx.fillText(el.label, el.x + 6, el.y + el.fontSize + 4);
      } else if (el.type === 'text') {
        ctx.fillStyle = el.color;
        ctx.font = `${el.fontSize}px monospace`;
        ctx.textAlign = 'start';
        ctx.textBaseline = 'alphabetic';
        ctx.fillText(el.label, el.x, el.y + el.fontSize);
        if (isSel) {
          ctx.strokeStyle = '#ffcc00';
          ctx.lineWidth = 1;
          ctx.strokeRect(el.x - 2, el.y - 2, el.w + 4, el.h + 4);
        }
      }
      ctx.restore();
    }
  }, [elements, selected]);

  const onMouseDown = (e: React.MouseEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const mx = e.clientX - rect.left,
      my = e.clientY - rect.top;
    for (let i = elements.length - 1; i >= 0; i--) {
      const el = elements[i];
      if (mx >= el.x && mx <= el.x + el.w && my >= el.y && my <= el.y + el.h) {
        setSelected(el.id);
        setDragging(true);
        setDragOff({ x: mx - el.x, y: my - el.y });
        return;
      }
    }
    setSelected(null);
  };
  const onMouseMove = (e: React.MouseEvent) => {
    if (!dragging || !selected) return;
    const rect = canvasRef.current!.getBoundingClientRect();
    const mx = e.clientX - rect.left,
      my = e.clientY - rect.top;
    setElements((prev) =>
      prev.map((el) =>
        el.id === selected ? { ...el, x: Math.round((mx - dragOff.x) / 5) * 5, y: Math.round((my - dragOff.y) / 5) * 5 } : el,
      ),
    );
  };
  const onMouseUp = () => setDragging(false);

  const addElement = () => {
    const id = `el_${Date.now()}`;
    const d: Record<string, Partial<EditorElement>> = {
      panel: { w: 200, h: 80, color: '#0a1628', fontSize: 11 },
      button: { w: 100, h: 32, color: '#4488ff', fontSize: 11 },
      text: { w: 100, h: 16, color: '#cde', fontSize: 12 },
      image: { w: 80, h: 80, color: '#1a3050', fontSize: 10 },
      bar: { w: 200, h: 24, color: '#44ee88', fontSize: 10 },
      slot: { w: 40, h: 40, color: '#44ddff', fontSize: 14 },
    };
    const dd = d[addType] ?? {};
    setElements([
      ...elements,
      {
        id,
        type: addType,
        x: 100,
        y: 200,
        w: dd.w ?? 100,
        h: dd.h ?? 40,
        label: addType.toUpperCase(),
        color: dd.color ?? '#4488ff',
        fontSize: dd.fontSize ?? 11,
      },
    ]);
    setSelected(id);
  };

  const updateSelected = (patch: Partial<EditorElement>) => {
    if (!selected) return;
    setElements((p) => p.map((e) => (e.id === selected ? { ...e, ...patch } : e)));
  };

  return (
    <div>
      <div style={S.sectionTitle}>2D UI / MENU EDITOR</div>
      <div style={{ fontSize: 10, color: '#68a', marginBottom: 12 }}>Click to select · Drag to move · 5px grid snap</div>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ border: '1px solid #1a3050', borderRadius: 6, overflow: 'hidden' }}>
          <canvas
            ref={canvasRef}
            width={800}
            height={600}
            style={{ display: 'block', cursor: dragging ? 'grabbing' : 'default' }}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseUp}
          />
        </div>
        <div style={{ minWidth: 240, maxWidth: 300 }}>
          <div style={{ marginBottom: 16, padding: 12, background: 'rgba(6,14,30,0.7)', borderRadius: 6, border: '1px solid #1a305044' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#8ac', letterSpacing: 1, marginBottom: 8 }}>ADD ELEMENT</div>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 8 }}>
              {(['panel', 'button', 'text', 'image', 'bar', 'slot'] as const).map((t) => (
                <div key={t} onClick={() => setAddType(t)} style={S.filterBtn(addType === t)}>
                  {t.toUpperCase()}
                </div>
              ))}
            </div>
            <button onClick={addElement} style={S.btn('#44ee88')}>
              + ADD
            </button>
          </div>
          {selEl ? (
            <div style={{ padding: 12, background: 'rgba(6,14,30,0.7)', borderRadius: 6, border: '1px solid #ffcc0033' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#fc4', letterSpacing: 1, marginBottom: 8 }}>PROPS — {selEl.id}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 9, color: '#68a', width: 40 }}>Label</span>
                  <input value={selEl.label} onChange={(e) => updateSelected({ label: e.target.value })} style={{ ...S.input, flex: 1 }} />
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {(['x', 'y', 'w', 'h'] as const).map((k) => (
                    <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
                      <span style={{ fontSize: 9, color: '#68a' }}>{k.toUpperCase()}</span>
                      <input
                        type="number"
                        value={selEl[k]}
                        onChange={(e) => updateSelected({ [k]: +e.target.value })}
                        style={{ ...S.input, flex: 1, minWidth: 0 }}
                      />
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 9, color: '#68a', width: 40 }}>Color</span>
                  <input
                    type="color"
                    value={selEl.color}
                    onChange={(e) => updateSelected({ color: e.target.value })}
                    style={{ width: 28, height: 22, border: 'none', background: 'transparent', cursor: 'pointer' }}
                  />
                  <input value={selEl.color} onChange={(e) => updateSelected({ color: e.target.value })} style={{ ...S.input, flex: 1 }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 9, color: '#68a', width: 40 }}>Font</span>
                  <input
                    type="number"
                    value={selEl.fontSize}
                    onChange={(e) => updateSelected({ fontSize: +e.target.value })}
                    style={{ ...S.input, width: 50 }}
                  />
                </div>
                <button
                  onClick={() => {
                    setElements(elements.filter((e) => e.id !== selected));
                    setSelected(null);
                  }}
                  style={S.btn('#ff4444')}
                >
                  DELETE
                </button>
              </div>
            </div>
          ) : (
            <div style={{ padding: 12, background: 'rgba(6,14,30,0.5)', borderRadius: 6, color: '#445', fontSize: 10 }}>
              Select an element
            </div>
          )}
          <button
            onClick={() => navigator.clipboard.writeText(JSON.stringify(elements, null, 2))}
            style={{ ...S.btn('#ffaa22'), marginTop: 12 }}
          >
            EXPORT JSON
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Admin App ─────────────────────────────────────────────────
export default function AdminApp() {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [tab, setTab] = useState<AdminTab>('ships');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (token) {
      storeToken(token);
      window.history.replaceState({}, '', '/admin.html');
    }
  }, []);

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
  const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

  if (!authChecked)
    return (
      <div style={S.root}>
        <div style={S.loginBox}>
          <div style={{ color: '#4488ff' }}>Loading...</div>
        </div>
      </div>
    );

  if (!isLocal && !user) {
    return (
      <div style={S.root}>
        <div style={S.loginBox}>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#4488ff', letterSpacing: 4 }}>GRUDA ARMADA</div>
          <div style={{ fontSize: 10, color: '#68a', letterSpacing: 2 }}>ADMIN PANEL</div>
          <div style={{ marginTop: 20, display: 'flex', gap: 10 }}>
            <button onClick={() => startOAuth('discord')} style={S.btn('#5865F2')}>
              DISCORD
            </button>
            <button onClick={() => startOAuth('google')} style={S.btn()}>
              GOOGLE
            </button>
            <button onClick={() => startOAuth('github')} style={S.btn()}>
              GITHUB
            </button>
          </div>
        </div>
      </div>
    );
  }

  const TABS: { key: AdminTab; label: string; icon: string }[] = [
    { key: 'ships', label: 'SHIPS', icon: '🚀' },
    { key: 'dashboard', label: 'DASHBOARD', icon: '📊' },
    { key: 'players', label: 'PLAYERS', icon: '👤' },
    { key: 'matches', label: 'MATCHES', icon: '⚔️' },
    { key: 'balance', label: 'BALANCE', icon: '⚖️' },
    { key: 'config', label: 'CONFIG', icon: '⚙️' },
    { key: 'tools', label: 'TOOLS', icon: '🔧' },
    { key: 'editor', label: '2D EDITOR', icon: '🎨' },
  ];

  return (
    <div style={S.root}>
      <div style={S.sidebar}>
        <div style={{ padding: '0 16px 16px', borderBottom: '1px solid #1a3050', marginBottom: 8 }}>
          <div style={{ fontSize: 14, fontWeight: 900, color: '#4488ff', letterSpacing: 2 }}>GRUDA</div>
          <div style={{ fontSize: 9, color: '#445', letterSpacing: 1 }}>ADMIN PANEL</div>
        </div>
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)} style={S.navBtn(tab === t.key)}>
            {t.icon} {t.label}
          </button>
        ))}
        <div style={{ flex: 1 }} />
        {user && (
          <div style={{ padding: '12px 16px', borderTop: '1px solid #1a3050' }}>
            <div style={{ fontSize: 10, color: '#4df', fontWeight: 600 }}>{user.displayName}</div>
            <button onClick={logout} style={{ ...S.btn('#ff4444'), marginTop: 6, width: '100%', textAlign: 'center' }}>
              LOGOUT
            </button>
          </div>
        )}
        <div style={{ padding: '8px 16px' }}>
          <a href="/" style={{ fontSize: 9, color: '#445', textDecoration: 'none' }}>
            ← Back to Game
          </a>
        </div>
      </div>
      <div style={S.main}>
        {tab === 'ships' && <ShipsTab />}
        {tab === 'dashboard' && <DashboardTab />}
        {tab === 'players' && <PlayersTab />}
        {tab === 'matches' && <MatchesTab />}
        {tab === 'balance' && <BalanceTab />}
        {tab === 'config' && <ConfigTab />}
        {tab === 'tools' && <ToolsTab />}
        {tab === 'editor' && <EditorTab />}
      </div>
    </div>
  );
}
