import http from "node:http";
import express from "express";
import cors from "cors";
import colyseus from "colyseus";
const { Server, matchMaker } = colyseus;
import { WebSocketTransport } from "@colyseus/ws-transport";
import { MafiaRoom } from "./rooms/MafiaRoom.js";

const PORT = Number(process.env.PORT) || 2567;
const app = express();

app.use(cors());
app.use(express.json());

// Healthcheck endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "mafia-game-server",
    uptimeSec: Math.floor(process.uptime()),
    timestamp: Date.now()
  });
});

// Room inquiry endpoint
app.get("/api/rooms/:roomCode", async (req, res) => {
  const roomCode = (req.params.roomCode || "").toUpperCase();
  try {
    const rooms = await matchMaker.query({ name: "mafia_room" });
    const match = rooms.find(r => r.metadata?.roomCode === roomCode);
    if (!match) {
      return res.status(404).json({ error: "Room not found" });
    }
    return res.json({
      roomId: match.roomId,
      roomCode: match.metadata.roomCode,
      clients: match.clients,
      maxClients: match.maxClients
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

const httpServer = http.createServer(app);

const gameServer = new Server({
  transport: new WebSocketTransport({
    server: httpServer
  })
});

// Register the Mafia room with roomCode filter for instant matchmaking by room code
gameServer.define("mafia_room", MafiaRoom).filterBy(["roomCode"]);

httpServer.listen(PORT, () => {
  console.log(`[GameServer] MAFIA Colyseus Server running on http://localhost:${PORT}`);
  console.log(`[GameServer] WebSocket listener active on ws://localhost:${PORT}`);
});
