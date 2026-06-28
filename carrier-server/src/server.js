/**
 * GRUDOX Carrier — standalone WebSocket room server for Grudge Space RTS PvP.
 */

import express from "express";
import http from "node:http";
import { WebSocketServer, WebSocket } from "ws";
import cors from "cors";
import crypto from "node:crypto";

const PORT = Number(process.env.PORT ?? 5060);
const ALLOWED = (process.env.ALLOWED_ORIGINS ?? "*")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
const TICK_HZ = Number(process.env.CARRIER_TICK_HZ ?? 20);
const TICK_MS = Math.round(1000 / TICK_HZ);
const MAX_PILOTS = Number(process.env.CARRIER_MAX_PILOTS ?? 8);

const app = express();
app.use(
  cors({
    origin: ALLOWED.length === 1 && ALLOWED[0] === "*" ? true : ALLOWED,
    credentials: true,
  }),
);
app.use(express.json({ limit: "32kb" }));

const rooms = new Map();

function totalPilots() {
  let n = 0;
  for (const r of rooms.values()) n += r.pilots.size;
  return n;
}

function sanitizeName(name) {
  return String(name ?? "Commander")
    .replace(/[^\w \-_.]/g, "")
    .slice(0, 32) || "Commander";
}

function sanitizeRoomId(id) {
  return String(id ?? "default")
    .replace(/[^a-zA-Z0-9_\-]/g, "")
    .slice(0, 64) || "default";
}

function roomSnapshot(room) {
  return {
    type: "state",
    roomId: room.id,
    tick: room.tick,
    pilots: Array.from(room.pilots.values()).map((p) => ({
      id: p.id,
      grudgeId: p.grudgeId,
      displayName: p.displayName,
      ready: p.ready,
    })),
    hostId: room.hostId,
    tickHz: TICK_HZ,
    maxPilots: MAX_PILOTS,
  };
}

function broadcast(room, msg, excludeId = null) {
  const data = JSON.stringify(msg);
  for (const [sid, ws] of room.sockets) {
    if (sid === excludeId) continue;
    if (ws.readyState === WebSocket.OPEN) ws.send(data);
  }
}

function disposeRoomIfEmpty(roomId) {
  const room = rooms.get(roomId);
  if (!room || room.pilots.size > 0) return;
  clearInterval(room.tickTimer);
  rooms.delete(roomId);
  console.log(`[carrier] room disposed id=${roomId}`);
}

function getOrCreateRoom(roomId) {
  let room = rooms.get(roomId);
  if (room) return room;
  room = {
    id: roomId,
    pilots: new Map(),
    sockets: new Map(),
    hostId: null,
    tick: 0,
    createdAt: Date.now(),
    tickTimer: setInterval(() => tickRoom(roomId), TICK_MS),
  };
  rooms.set(roomId, room);
  console.log(`[carrier] room created id=${roomId}`);
  return room;
}

function tickRoom(roomId) {
  const room = rooms.get(roomId);
  if (!room) return;
  room.tick += 1;
  broadcast(room, roomSnapshot(room));
}

function nextTeamSlot(room) {
  const used = new Set(Array.from(room.pilots.values()).map((p) => p.teamSlot));
  for (let i = 0; i < MAX_PILOTS; i++) {
    if (!used.has(i)) return i;
  }
  return room.pilots.size;
}

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "carrier", rooms: rooms.size, pilots: totalPilots(), tickHz: TICK_HZ });
});

app.get("/api/carrier/health", (_req, res) => {
  res.json({ ok: true, service: "carrier", rooms: rooms.size, pilots: totalPilots(), tickHz: TICK_HZ });
});

const server = http.createServer(app);
const wss = new WebSocketServer({ noServer: true });

server.on("upgrade", (req, socket, head) => {
  const url = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`);
  if (url.pathname !== "/api/carrier") {
    socket.destroy();
    return;
  }
  wss.handleUpgrade(req, socket, head, (ws) => wss.emit("connection", ws, req));
});

wss.on("connection", (ws) => {
  const socketId = `c_${Date.now().toString(36)}_${crypto.randomBytes(3).toString("hex")}`;
  let roomId = null;

  ws.on("message", (raw) => {
    try {
      const msg = JSON.parse(String(raw));
      const type = msg.type;
      if (!type) return;

      if (type === "join") {
        const id = sanitizeRoomId(msg.roomId);
        const room = getOrCreateRoom(id);
        if (room.pilots.size >= MAX_PILOTS) {
          ws.send(JSON.stringify({ type: "error", message: "room full" }));
          ws.close(4000, "room full");
          return;
        }

        const pilot = {
          id: socketId,
          grudgeId: String(msg.grudgeId ?? `guest_${socketId}`).slice(0, 64),
          displayName: sanitizeName(msg.displayName),
          loadoutId: String(msg.loadoutId ?? "default").slice(0, 32),
          ready: false,
          teamSlot: nextTeamSlot(room),
          lastSeenMs: Date.now(),
        };

        room.pilots.set(socketId, pilot);
        room.sockets.set(socketId, ws);
        roomId = id;
        if (!room.hostId) room.hostId = socketId;

        ws.send(
          JSON.stringify({
            type: "joined",
            selfId: socketId,
            roomId: id,
            tick: room.tick,
            hostId: room.hostId,
            teamSlot: pilot.teamSlot,
            localTeam: pilot.teamSlot + 1,
            pilots: Array.from(room.pilots.values()).map((p) => ({
              id: p.id,
              grudgeId: p.grudgeId,
              displayName: p.displayName,
              ready: p.ready,
            })),
            tickHz: TICK_HZ,
            maxPilots: MAX_PILOTS,
          }),
        );

        broadcast(
          room,
          {
            type: "pilot_join",
            pilot: {
              id: pilot.id,
              grudgeId: pilot.grudgeId,
              displayName: pilot.displayName,
              ready: pilot.ready,
            },
          },
          socketId,
        );

        console.log(`[carrier] join sid=${socketId} room=${id} pilots=${room.pilots.size}`);
        return;
      }

      if (!roomId) return;
      const room = rooms.get(roomId);
      const pilot = room?.pilots.get(socketId);
      if (!room || !pilot) return;

      if (type === "ready") {
        pilot.ready = Boolean(msg.ready);
        pilot.lastSeenMs = Date.now();
        broadcast(room, roomSnapshot(room));
        return;
      }

      if (type === "input") {
        pilot.lastSeenMs = Date.now();
        broadcast(
          room,
          {
            type: "intent",
            fromId: socketId,
            fromTeam: pilot.teamSlot + 1,
            tick: room.tick,
            payload: msg,
          },
          socketId,
        );
        return;
      }

      if (type === "ping") {
        ws.send(JSON.stringify({ type: "pong", serverTime: Date.now(), tick: room.tick }));
      }
    } catch {
      /* ignore */
    }
  });

  ws.on("close", () => {
    if (!roomId) return;
    const room = rooms.get(roomId);
    if (!room) return;
    room.pilots.delete(socketId);
    room.sockets.delete(socketId);
    if (room.hostId === socketId) {
      const next = room.pilots.keys().next().value;
      room.hostId = next ?? null;
    }
    broadcast(room, { type: "pilot_leave", pilotId: socketId });
    broadcast(room, roomSnapshot(room));
    disposeRoomIfEmpty(roomId);
  });
});

server.listen(PORT, () => {
  console.log(`[carrier] listening port=${PORT} tickHz=${TICK_HZ} origins=${ALLOWED.join(",") || "*"}`);
});