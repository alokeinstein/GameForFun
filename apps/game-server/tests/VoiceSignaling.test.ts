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
  VoiceSignalRelayPayload,
  VoiceStatePayload
} from "@mafia/shared";
import { Phase } from "@mafia/game-rules";

describe.sequential("Milestone 4 - WebRTC Voice Signaling & Audio Isolation", () => {
  let httpServer: http.Server;
  let gameServer: colyseus.Server;
  const PORT = 2584;
  const SERVER_URL = `ws://localhost:${PORT}`;

  beforeAll(async () => {
    httpServer = http.createServer();
    gameServer = new Server({
      transport: new WebSocketTransport({
        server: httpServer
      })
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

  it("relays WebRTC voice signaling messages between peers", async () => {
    const client1 = new ColyseusClient(SERVER_URL);
    const client2 = new ColyseusClient(SERVER_URL);

    const room1 = await client1.joinOrCreate("mafia_room", {
      roomCode: "VOIC1",
      displayName: "Alice"
    }, MafiaRoomState);

    const room2 = await client2.joinOrCreate("mafia_room", {
      roomCode: "VOIC1",
      displayName: "Bob"
    }, MafiaRoomState);

    // Set up signal receiver on room2
    const signalPromise = new Promise<VoiceSignalRelayPayload>((resolve) => {
      room2.onMessage(ServerMessageType.VOICE_SIGNAL, (data: VoiceSignalRelayPayload) => {
        resolve(data);
      });
    });

    // Room1 sends WebRTC offer to Room2
    room1.send(ClientMessageType.VOICE_SIGNAL, {
      targetSessionId: room2.sessionId,
      signal: { type: "offer", sdp: "v=0\r\ntest-sdp-data" }
    });

    const received = await signalPromise;
    expect(received.fromSessionId).toBe(room1.sessionId);
    expect(received.signal.type).toBe("offer");
    expect(received.signal.sdp).toBe("v=0\r\ntest-sdp-data");

    await room1.leave();
    await room2.leave();
  });

  it("broadcasts voice speaking and mute state changes to all room participants", async () => {
    const client1 = new ColyseusClient(SERVER_URL);
    const client2 = new ColyseusClient(SERVER_URL);

    const room1 = await client1.joinOrCreate("mafia_room", {
      roomCode: "VOIC2",
      displayName: "Charlie"
    }, MafiaRoomState);

    const room2 = await client2.joinOrCreate("mafia_room", {
      roomCode: "VOIC2",
      displayName: "Diana"
    }, MafiaRoomState);

    const statePromise = new Promise<VoiceStatePayload>((resolve) => {
      room2.onMessage(ServerMessageType.VOICE_STATE, (data: VoiceStatePayload) => {
        resolve(data);
      });
    });

    // Room1 reports speaking state
    room1.send(ClientMessageType.VOICE_STATE, {
      isMuted: false,
      isSpeaking: true
    });

    const state = await statePromise;
    expect(state.sessionId).toBe(room1.sessionId);
    expect(state.isMuted).toBe(false);
    expect(state.isSpeaking).toBe(true);

    await room1.leave();
    await room2.leave();
  });

  it("authoritatively isolates dead players: drops voice signals sent from eliminated players to living players during active rounds", async () => {
    const client1 = new ColyseusClient(SERVER_URL);
    const client2 = new ColyseusClient(SERVER_URL);
    const client3 = new ColyseusClient(SERVER_URL);

    const room1 = await client1.joinOrCreate("mafia_room", {
      roomCode: "VOIC3",
      displayName: "HostAlice"
    }, MafiaRoomState);

    const room2 = await client2.joinOrCreate("mafia_room", {
      roomCode: "VOIC3",
      displayName: "LivingBob"
    }, MafiaRoomState);

    const room3 = await client3.joinOrCreate("mafia_room", {
      roomCode: "VOIC3",
      displayName: "DeadDan"
    }, MafiaRoomState);

    // Enable Dev Mode
    room1.send(ClientMessageType.UPDATE_CONFIG, { isDevMode: true });

    // Mark ready
    room1.send(ClientMessageType.READY_TOGGLE);
    room2.send(ClientMessageType.READY_TOGGLE);
    room3.send(ClientMessageType.READY_TOGGLE);

    // Start match
    room1.send(ClientMessageType.START_GAME);

    // Wait for match to start
    await new Promise<void>((resolve) => {
      const check = () => {
        if (room1.state.phase !== Phase.WAITING_FOR_PLAYERS) resolve();
      };
      room1.onStateChange(check);
    });

    // Simulate DeadDan elimination on the server by setting isAlive = false
    // We can access room instance via gameServer matchMaker or simulate via server state
    // Let's directly simulate Dan being dead:
    const internalRoom = colyseus.matchMaker.getRoomById(room1.id) as any;
    expect(internalRoom).toBeDefined();

    const deadDan = internalRoom.state.players.get(room3.sessionId);
    expect(deadDan).toBeDefined();
    deadDan.isAlive = false;

    let livingBobReceivedSignal = false;
    room2.onMessage(ServerMessageType.VOICE_SIGNAL, () => {
      livingBobReceivedSignal = true;
    });

    // DeadDan attempts to send voice signal to LivingBob during active match phase
    room3.send(ClientMessageType.VOICE_SIGNAL, {
      targetSessionId: room2.sessionId,
      signal: { type: "offer", sdp: "ghostly-secret" }
    });

    // Wait 500ms to verify no signal was forwarded
    await new Promise((resolve) => setTimeout(resolve, 500));
    expect(livingBobReceivedSignal).toBe(false);

    await room1.leave();
    await room2.leave();
    await room3.leave();
  });
});
