# Grudge Space — Server Architecture
One Node process hosts both the **campaign / hero-ship / leaderboard REST API** (Hono) and the **PvP world server** (WebSocket / `ws`). Single Railway service, single Postgres connection, single JWT secret. The server is in `server/`.
## Why Hono (not Express)
Hono and Express express the same patterns; Hono just has them built-in:
| Express idiom | Hono equivalent |
|---|---|
| `app.use(middleware)` | `app.use('*', middleware)` |
| `app.get('/x', handler)` | `app.get('/x', handler)` |
| `next()` | `await next()` |
| Custom `(req, res, next)` middleware | `createMiddleware(async (c, next) => {...})` |
| `app.use(errorHandler)` | `app.onError((err, c) => …)` |
| `req.params` / `req.query` | `c.req.param('id')` / `c.req.query('q')` |
| `res.json(…)` | `c.json(…)` |
| `req.body` (with body-parser) | `await c.req.json()` |
The whole stack runs on Node 22 via `@hono/node-server`, which returns the underlying `http.Server` so we can attach a WebSocket upgrade handler to the same port.
## Layout
```
server/
  Dockerfile               ← builds production image (node:22-alpine)
  railway.json             ← Railway deploy config (DOCKERFILE builder, /health probe)
  package.json             ← deps: hono, @hono/node-server, jose, pg, ws, zod
  src/
    index.ts               ← app composition + serve() + world.attach()
    db.ts                  ← pg.Pool singleton
    migrate.ts             ← idempotent schema migration script
    middleware/
      auth.ts              ← requireAuth() — Express-style JWT guard
    routes/
      auth.ts              ← OAuth + /auth/me
      hero-ship.ts         ← player hero-ship save/load
      campaign.ts          ← campaign save/load (per-grudgeId)
      match.ts             ← match recording + leaderboard
      ai.ts                ← AI narration proxy
      admin.ts             ← admin dashboard (admin JWT required)
      rts-config.ts        ← remote balance / settings
      world.ts             ← PvP world matchmaker (REST endpoints)
    world/
      types.ts             ← WorldShip, WorldPlayer, ShardConfig, ShardSnapshot
      protocol.ts          ← typed WS Client/Server message envelopes
      shard.ts             ← per-system tick loop, ship registry, broadcast
      server.ts            ← shard registry + WS upgrade handler (jose JWT)
```
## Express-style middleware patterns adopted
1. **Layered middleware.** `logger() → cors() → requireAuth() → handler → onError()`. Each is a named function; the order matters and is declared once in `index.ts`.
2. **JWT guard.** `requireAuth({ adminOnly: true })` returns a Hono middleware that pulls `Bearer …` from the `Authorization` header, verifies via `jose.jwtVerify`, optionally checks `payload.isAdmin`, and stuffs the decoded payload onto `c.var.user` for the route to read.
3. **Centralised error handler.** `app.onError((err, c) => …)` catches anything unhandled in the route tree and serializes a 500 with structured logs. No try/catch noise inside route handlers.
4. **Route-level body validation.** Routes can use `zod` schemas: `const body = ShipSaveSchema.parse(await c.req.json())`. Errors propagate to `onError`.
5. **404 fallback.** `app.notFound((c) => c.json({ error: 'Not found' }, 404))` after all routes.
6. **Graceful shutdown.** `SIGTERM` / `SIGINT` drains the world server (stop ticks + close WSS), ends the pg pool, then closes the http.Server. Hard kill after 10 s.
## PvP world server
### Connect flow
1. Client `POST /world/connect` with body `{ shardId?, system? }` and `Authorization: Bearer <jwt>`.
2. Server picks a shard (explicit ID, system hint, or least-populated) and returns `{ url, shardId, expiresAt }`.
3. Client opens `WebSocket(url)` — `wss://api.grudge-studio.com/world?token=<jwt>&shard=<id>`.
4. Server's `upgrade` handler verifies the JWT, picks the shard, fires `connection`.
5. `WorldShard.join()` sends a `welcome` message and adds the socket to the broadcast set.
### Wire protocol (`world/protocol.ts`)
```ts
type ClientMessage =
  | { kind: 'hello'; protocol: number; clientVersion: string }
  | { kind: 'ping'; ts: number }
  | { kind: 'spawn_ship'; shipType: string; pos?: Vec3 }
  | { kind: 'set_nav_route'; shipId: number; waypoints: Vec3[]; modes: ('sublight'|'quantum')[] }
  | { kind: 'fire_weapon'; shipId: number; targetId: number }
  | { kind: 'chat'; text: string }
  | { kind: 'leave' };
type ServerMessage =
  | { kind: 'welcome'; protocol; shardId; tickHz; team }
  | { kind: 'pong'; ts; serverTs }
  | { kind: 'snapshot'; data: ShardSnapshot }
  | { kind: 'event'; type: 'ship_spawn'|'ship_dead'|'route_set'|'jump_engage'|'jump_arrive'; payload }
  | { kind: 'chat'; from; text; ts }
  | { kind: 'error'; code; message };
```
`PROTOCOL_VERSION = 1`. Bump on any field reshape.
### Shard tick model
- `setInterval(step, 1000/tickHz)` — default 20 Hz.
- Each tick:
  1. Apply linear velocity to ships.
  2. Advance any active `navWaypoints` (mirrors the frontend's `advanceShipNav`, so client + server agree on arrivals).
  3. Build `ShardSnapshot` (full state — there's no incremental diff yet; that's a future optimisation).
  4. Broadcast to every connected socket on this shard.
- Out-of-band events (`ship_spawn`, `ship_dead`, `route_set`, `jump_arrive`) ride alongside snapshots so latency-sensitive UX (death sound, jump VFX) doesn't wait for the next tick.
### Authority + anti-cheat baseline
- All damage / death / movement is computed on the server. Client messages are *requests*, not state mutations.
- `set_nav_route` validates ownership (`ship.ownerId === grudgeId`).
- `fire_weapon` validates source ownership and same-team rejection.
- Position drift checks not yet implemented (PvP-validated routing is roadmap Phase 10).
## Local dev
```
cp server/.env.example server/.env
cd server
npm install
npm run dev    # tsx watch — hot-reloads on change
```
WS endpoint at `ws://localhost:3001/world?token=<jwt>` once you have a token from `POST /auth/login`.
## Railway deployment
The server is configured for a single Railway service:
1. Connect the GitHub repo to a new Railway project.
2. Set the **service root directory** to `server/`.
3. Railway auto-detects `railway.json` → uses the Dockerfile at `server/Dockerfile`.
4. Add environment variables (see `server/.env.example`):
   - `DATABASE_URL` — Railway-provided Postgres URL
   - `JWT_SECRET` — `openssl rand -base64 64`
   - `CORS_ORIGINS` — your Vercel domain + custom domains
   - `OAUTH_*` — Discord / Google / GitHub credentials
   - `R2_*` — Cloudflare R2 (only used by upload script, server doesn't read R2 directly)
   - `OPENAI_API_KEY` — for AI narration
   - `WORLD_TICK_HZ=20` — PvP tick rate
   - `WORLD_DISABLE=false` — leave on for the world server
5. Health check is `/health`; Railway pings it during rolling deploys.
6. The `start` command runs `migrate.js` first, then `index.js`. Add new tables to `migrate.ts` — the script is idempotent (`CREATE TABLE IF NOT EXISTS`).
### Public domains
- `api.grudge-studio.com` (or whatever subdomain you assign in Railway → Settings → Networking) routes to this service. Both REST (`https://`) and WebSocket (`wss://`) traffic share the same host + port (Railway terminates TLS at the proxy and forwards both transparently).
### Scaling
- For now, `numReplicas: 1`. The world server keeps state in-process; running multiple replicas would mean the same shard ID lives on different instances and snapshots would diverge.
- When PvP load grows, the right shape is:
  - One Railway service per region, replica count = 1.
  - `routes/world.ts#connect` becomes a regional matchmaker that returns the right region's WS URL.
  - Cross-region jumps go through a small message bus (Redis pub/sub on Railway is fine).
## Tests / smoke check
After `npm run build` + `npm start`:
```
curl http://localhost:3001/health
# → {"status":"ok","ts":…}
curl http://localhost:3001/world/health
# → {"tickHz":20,"shards":[{"id":"armada-core-01","tick":…,"players":0,"ships":0},…]}
curl http://localhost:3001/world/shards
# → {"shards":[{"id":"armada-core-01","name":"Armada Core","system":"armada_core","population":0,"max":32}, …]}
```
A tiny WS smoke test (after grabbing a JWT from `/auth/login`):
```js
const ws = new WebSocket(`ws://localhost:3001/world?token=${token}`);
ws.onopen = () => ws.send(JSON.stringify({kind:'spawn_ship', shipType:'micro_recon'}));
ws.onmessage = (e) => console.log(JSON.parse(e.data));
```
## Roadmap (server-side)
1. **Snapshot diffing** — broadcast only changed ships per tick.
2. **Cross-shard matchmaking** — Redis pub/sub for jump-point gates.
3. **Server-authoritative nav** — wire `nav-server-rs` (Rust) as a sidecar service on Railway and proxy `/nav/plan` to it from the existing Hono `routes/nav.ts` (already scaffolded earlier).
4. **Persistence** — write per-player ship state to Postgres on disconnect; rehydrate on reconnect.
5. **PvP route validation** — hash-sign each `set_nav_route` and reject client positions outside the server's predicted window.
