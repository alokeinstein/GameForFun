import { describe, it, expect, beforeAll, afterAll } from "vitest";
import colyseus from "colyseus";
const { Server } = colyseus;
import { WebSocketTransport } from "@colyseus/ws-transport";
import http from "node:http";
import { Client as ColyseusClient } from "colyseus.js";
import { MafiaRoom } from "../src/rooms/MafiaRoom.js";
import {
  ClientMessageType,
  ServerMessageType,
  MafiaRoomState,
  ChatMessagePayload
} from "@mafia/shared";
import { Phase, Role, WinningTeam } from "@mafia/game-rules";

describe.sequential("Mafia Audit Requirements Test Suite", () => {
  let httpServer: http.Server;
  let gameServer: colyseus.Server;
  const PORT = 2588;
  const SERVER_URL = `ws://localhost:${PORT}`;

  beforeAll(async () => {
    httpServer = http.createServer();
    gameServer = new Server({
      transport: new WebSocketTransport({ server: httpServer })
    });
    gameServer.define("mafia_room", MafiaRoom).filterBy(["roomCode"]);

    await new Promise<void>((resolve) => {
      httpServer.listen(PORT, () => resolve());
    });
  });

  afterAll(async () => {
    await gameServer.gracefullyShutdown(false);
    await new Promise<void>((resolve) => {
      httpServer.close(() => resolve());
    });
  });

  // SCENARIO 1: 10-player game with exact 3 Mafia & 7 Citizens
  it("Scenario 1: supports a 10-player game with exactly 3 Mafia and 7 Citizens", async () => {
    const clients: any[] = [];
    const rooms: any[] = [];
    const roleMessages: Record<string, any> = {};

    for (let i = 0; i < 10; i++) {
      const c = new ColyseusClient(SERVER_URL);
      clients.push(c);
      const r = await c.joinOrCreate("mafia_room", { roomCode: "TENP1", displayName: `Player_${i + 1}` }, MafiaRoomState);
      rooms.push(r);
      r.onMessage(ServerMessageType.ROLE_ASSIGNMENT, (msg) => {
        roleMessages[r.sessionId] = msg;
      });
    }

    // Host (first player) configures exact Mafia count = 3
    rooms[0].send(ClientMessageType.UPDATE_CONFIG, {
      mafiaCount: 3,
      nightDurationSec: 2,
      discussionDurationSec: 2
    });

    await new Promise((r) => setTimeout(r, 100));

    // Host starts game
    rooms[0].send(ClientMessageType.START_GAME);
    await new Promise((r) => setTimeout(r, 300));

    expect(rooms[0].state.phase).toBe(Phase.ROLE_ASSIGNMENT);

    // Verify all 10 players received private role assignments
    expect(Object.keys(roleMessages)).toHaveLength(10);

    const mafiaRoles = Object.values(roleMessages).filter((m: any) => m.role === Role.MAFIA);
    const citizenRoles = Object.values(roleMessages).filter((m: any) => m.role === Role.CITIZEN);

    expect(mafiaRoles).toHaveLength(3);
    expect(citizenRoles).toHaveLength(7);

    // Verify all 3 Mafia teammates can see each other
    for (const m of mafiaRoles) {
      expect(m.teammates).toHaveLength(3);
    }
    // Verify Citizens received NO teammate data
    for (const c of citizenRoles) {
      expect(c.teammates).toBeUndefined();
    }

    for (const r of rooms) await r.leave();
  }, 25000);

  // SCENARIO 2: Host-controlled manual Mafia assignment
  it("Scenario 2: host manually assigns 3 specific Mafia players, remaining become Citizens", async () => {
    const clients: any[] = [];
    const rooms: any[] = [];
    const roleMessages: Record<string, any> = {};

    for (let i = 0; i < 10; i++) {
      const c = new ColyseusClient(SERVER_URL);
      clients.push(c);
      const r = await c.joinOrCreate("mafia_room", { roomCode: "MANU1", displayName: `Manual_${i + 1}` }, MafiaRoomState);
      rooms.push(r);
      r.onMessage(ServerMessageType.ROLE_ASSIGNMENT, (msg) => {
        roleMessages[r.sessionId] = msg;
      });
    }

    const host = rooms[0];
    const nonHost = rooms[1];
    const targetMafiaIds = [rooms[2].sessionId, rooms[5].sessionId, rooms[8].sessionId];

    // Non-host attempts to set manual Mafia -> must be rejected
    let nonHostError = "";
    nonHost.onMessage(ServerMessageType.ERROR_NOTIFICATION, (err: any) => {
      nonHostError = err.message;
    });
    nonHost.send(ClientMessageType.SET_MANUAL_MAFIA, { mafiaPlayerIds: targetMafiaIds });
    await new Promise((r) => setTimeout(r, 100));
    expect(nonHostError).toMatch(/Only the room host/);

    // Host attempts invalid manual assignment (count mismatch) -> rejected
    let hostError = "";
    host.onMessage(ServerMessageType.ERROR_NOTIFICATION, (err: any) => {
      hostError = err.message;
    });
    host.send(ClientMessageType.UPDATE_CONFIG, { assignmentMethod: "MANUAL", mafiaCount: 3 });
    await new Promise((r) => setTimeout(r, 100));

    host.send(ClientMessageType.SET_MANUAL_MAFIA, { mafiaPlayerIds: [rooms[2].sessionId] }); // only 1, expects 3
    await new Promise((r) => setTimeout(r, 100));
    expect(hostError).toMatch(/Manual assignment mismatch/);

    // Host sends valid 3 Mafia selection
    host.send(ClientMessageType.SET_MANUAL_MAFIA, { mafiaPlayerIds: targetMafiaIds });
    await new Promise((r) => setTimeout(r, 100));

    // Host starts match
    host.send(ClientMessageType.START_GAME);
    await new Promise((r) => setTimeout(r, 300));

    expect(roleMessages[targetMafiaIds[0]].role).toBe(Role.MAFIA);
    expect(roleMessages[targetMafiaIds[1]].role).toBe(Role.MAFIA);
    expect(roleMessages[targetMafiaIds[2]].role).toBe(Role.MAFIA);

    // Remaining 7 players must be CITIZEN
    const citizenSessionIds = rooms
      .map((r) => r.sessionId)
      .filter((id) => !targetMafiaIds.includes(id));
    for (const cId of citizenSessionIds) {
      expect(roleMessages[cId].role).toBe(Role.CITIZEN);
    }

    for (const r of rooms) await r.leave();
  }, 25000);

  // SCENARIO 3: Private Mafia text chat channel authorization
  it("Scenario 3: enforces private Mafia text chat isolation and security", async () => {
    const clients: any[] = [];
    const rooms: any[] = [];
    const roleMessages: Record<string, any> = {};

    for (let i = 0; i < 5; i++) {
      const c = new ColyseusClient(SERVER_URL);
      clients.push(c);
      const r = await c.joinOrCreate("mafia_room", { roomCode: "CHAT1", displayName: `ChatPlayer_${i + 1}` }, MafiaRoomState);
      rooms.push(r);
      r.onMessage(ServerMessageType.ROLE_ASSIGNMENT, (msg) => {
        roleMessages[r.sessionId] = msg;
      });
    }

    // Set 2 Mafia manually: rooms[0] and rooms[1]
    const mafiaIds = [rooms[0].sessionId, rooms[1].sessionId];
    rooms[0].send(ClientMessageType.UPDATE_CONFIG, {
      assignmentMethod: "MANUAL",
      mafiaCount: 2,
      nightDurationSec: 5,
      discussionDurationSec: 5
    });
    await new Promise((r) => setTimeout(r, 100));

    rooms[0].send(ClientMessageType.SET_MANUAL_MAFIA, { mafiaPlayerIds: mafiaIds });
    await new Promise((r) => setTimeout(r, 100));

    rooms[0].send(ClientMessageType.START_GAME);
    await new Promise((r) => setTimeout(r, 300));

    const citizenRoom = rooms[2]; // Guaranteed Citizen
    const mafia1 = rooms[0];      // Living Mafia 1
    const mafia2 = rooms[1];      // Living Mafia 2

    // Set up chat message listeners
    const mafia2ReceivedChats: ChatMessagePayload[] = [];
    const citizenReceivedChats: ChatMessagePayload[] = [];

    mafia2.onMessage(ServerMessageType.CHAT_MESSAGE, (msg: ChatMessagePayload) => {
      mafia2ReceivedChats.push(msg);
    });
    citizenRoom.onMessage(ServerMessageType.CHAT_MESSAGE, (msg: ChatMessagePayload) => {
      citizenReceivedChats.push(msg);
    });

    // 1. Citizen attempts to send message on "MAFIA" channel -> server must reject
    let citizenChatError = "";
    citizenRoom.onMessage(ServerMessageType.ERROR_NOTIFICATION, (err: any) => {
      citizenChatError = err.message;
    });
    citizenRoom.send(ClientMessageType.SEND_CHAT, {
      message: "I am secretly reading your chat!",
      channel: "MAFIA"
    });
    await new Promise((r) => setTimeout(r, 100));
    expect(citizenChatError).toMatch(/Access Denied/);
    expect(mafia2ReceivedChats).toHaveLength(0);

    // 2. Mafia 1 sends secret message on "MAFIA" channel -> Mafia 2 receives it, Citizen DOES NOT!
    mafia1.send(ClientMessageType.SEND_CHAT, {
      message: "Target citizen 3 tonight.",
      channel: "MAFIA"
    });
    await new Promise((r) => setTimeout(r, 150));

    expect(mafia2ReceivedChats).toHaveLength(1);
    expect(mafia2ReceivedChats[0].channel).toBe("MAFIA");
    expect(mafia2ReceivedChats[0].message).toBe("Target citizen 3 tonight.");

    // SECURITY CHECK: Citizen must have received ZERO messages from the Mafia channel
    expect(citizenReceivedChats).toHaveLength(0);

    // 3. Public chat works for all players
    citizenRoom.send(ClientMessageType.SEND_CHAT, {
      message: "Hello everyone in town!",
      channel: "PUBLIC"
    });
    await new Promise((r) => setTimeout(r, 150));

    expect(citizenReceivedChats).toHaveLength(1);
    expect(citizenReceivedChats[0].channel).toBe("PUBLIC");
    expect(citizenReceivedChats[0].message).toBe("Hello everyone in town!");
    expect(mafia2ReceivedChats.some((m) => m.channel === "PUBLIC")).toBe(true);

    for (const r of rooms) await r.leave();
  }, 25000);

  // SCENARIO 4: Nighttime Voice Signaling Isolation
  it("Scenario 4: isolates voice communication during night phase", async () => {
    const clients: any[] = [];
    const rooms: any[] = [];

    for (let i = 0; i < 5; i++) {
      const c = new ColyseusClient(SERVER_URL);
      clients.push(c);
      const r = await c.joinOrCreate("mafia_room", { roomCode: "VOICN1", displayName: `VPlayer_${i + 1}` }, MafiaRoomState);
      rooms.push(r);
    }

    // Set 2 Mafia: rooms[0] and rooms[1]
    const mafiaIds = [rooms[0].sessionId, rooms[1].sessionId];
    rooms[0].send(ClientMessageType.UPDATE_CONFIG, {
      assignmentMethod: "MANUAL",
      mafiaCount: 2,
      nightDurationSec: 5,
      isDevMode: true
    });
    await new Promise((r) => setTimeout(r, 100));

    rooms[0].send(ClientMessageType.SET_MANUAL_MAFIA, { mafiaPlayerIds: mafiaIds });
    await new Promise((r) => setTimeout(r, 100));

    rooms[0].send(ClientMessageType.START_GAME);

    // Wait until Night phase (1s dev intro)
    await new Promise((r) => setTimeout(r, 1400));
    expect(rooms[0].state.phase).toBe(Phase.NIGHT);

    const mafia1 = rooms[0];
    const mafia2 = rooms[1];
    const citizen = rooms[2];

    let mafia2ReceivedVoiceSignal = false;
    let citizenReceivedVoiceSignal = false;

    mafia2.onMessage(ServerMessageType.VOICE_SIGNAL, () => {
      mafia2ReceivedVoiceSignal = true;
    });
    citizen.onMessage(ServerMessageType.VOICE_SIGNAL, () => {
      citizenReceivedVoiceSignal = true;
    });

    // 1. Mafia 1 signals Mafia 2 during NIGHT -> SUCCESS
    mafia1.send(ClientMessageType.VOICE_SIGNAL, {
      targetSessionId: mafia2.sessionId,
      signal: { type: "offer", sdp: "mafia-private-sdp" }
    });
    await new Promise((r) => setTimeout(r, 150));
    expect(mafia2ReceivedVoiceSignal).toBe(true);

    // 2. Mafia 1 attempts to signal Citizen during NIGHT -> DROPPED BY SERVER
    mafia1.send(ClientMessageType.VOICE_SIGNAL, {
      targetSessionId: citizen.sessionId,
      signal: { type: "offer", sdp: "mafia-leak-sdp" }
    });
    await new Promise((r) => setTimeout(r, 150));
    expect(citizenReceivedVoiceSignal).toBe(false);

    // 3. Citizen attempts to signal Mafia 1 during NIGHT -> DROPPED BY SERVER
    mafia2ReceivedVoiceSignal = false;
    citizen.send(ClientMessageType.VOICE_SIGNAL, {
      targetSessionId: mafia1.sessionId,
      signal: { type: "offer", sdp: "citizen-sdp" }
    });
    await new Promise((r) => setTimeout(r, 150));
    expect(mafia2ReceivedVoiceSignal).toBe(false);

    for (const r of rooms) await r.leave();
  }, 25000);

  // SCENARIO 5: Unified Day Discussion and Voting Timer
  it("Scenario 5: simultaneous discussion and voting under one shared day timer, allowing vote changes", async () => {
    const clients: any[] = [];
    const rooms: any[] = [];
    let roleMessages: Record<string, any> = {};

    for (let i = 0; i < 3; i++) {
      const c = new ColyseusClient(SERVER_URL);
      clients.push(c);
      const r = await c.joinOrCreate("mafia_room", { roomCode: "UNIF1", displayName: `U_${i + 1}` }, MafiaRoomState);
      rooms.push(r);
      r.onMessage(ServerMessageType.ROLE_ASSIGNMENT, (msg) => {
        roleMessages[r.sessionId] = msg;
      });
    }

    // Dev mode with fast timers: 1s Night, 1s Morning, 2s Day
    rooms[0].send(ClientMessageType.UPDATE_CONFIG, {
      isDevMode: true,
      dayDurationSec: 2,
      nightDurationSec: 1,
      morningDurationSec: 1,
      eliminationDurationSec: 1,
      allowVoteChanging: true
    });
    await new Promise((r) => setTimeout(r, 100));

    rooms[0].send(ClientMessageType.START_GAME);

    // Advance to Unified Day Phase: 1s intro + 1s night + 1s morning = ~3.4s
    await new Promise((r) => setTimeout(r, 3500));
    expect(rooms[0].state.phase).toBe(Phase.DAY_DISCUSSION);

    const mafiaSessionId = Object.entries(roleMessages).find(([_, m]: any) => m.role === Role.MAFIA)![0];
    const citizenRooms = rooms.filter((r) => r.sessionId !== mafiaSessionId);

    // Vote cast immediately during DAY_DISCUSSION
    citizenRooms[0].send(ClientMessageType.CAST_VOTE, { targetId: citizenRooms[1].sessionId });
    await new Promise((r) => setTimeout(r, 100));

    // Player changes vote to the Mafia player before timer expires
    citizenRooms[0].send(ClientMessageType.CAST_VOTE, { targetId: mafiaSessionId });
    citizenRooms[1].send(ClientMessageType.CAST_VOTE, { targetId: mafiaSessionId });

    // Wait for day resolution (2s) and elimination announcement (1s)
    await new Promise((r) => setTimeout(r, 3200));

    const deadMafia = rooms[0].state.players.get(mafiaSessionId);
    expect(deadMafia!.isAlive).toBe(false);
    expect(rooms[0].state.phase).toBe(Phase.VICTORY);
    expect(rooms[0].state.winningTeam).toBe(WinningTeam.CITIZENS);

    for (const r of rooms) await r.leave();
  }, 25000);
});
