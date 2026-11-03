import { describe, it, expect, beforeAll, afterAll } from "vitest";
import colyseus from "colyseus";
const { Server } = colyseus;
import { WebSocketTransport } from "@colyseus/ws-transport";
import http from "node:http";
import { Client as ColyseusClient } from "colyseus.js";
import { MafiaRoom } from "../src/rooms/MafiaRoom.js";
import { ClientMessageType, ServerMessageType, MafiaRoomState } from "@mafia/shared";
import { Phase } from "@mafia/game-rules";

describe.sequential("MafiaRoom Multiplayer Integration", () => {
  let httpServer: http.Server;
  let gameServer: colyseus.Server;
  const PORT = 2582;
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

  it("creates a room, assigns host to first player, and issues a reconnection token", async () => {
    const client1 = new ColyseusClient(SERVER_URL);
    let receivedToken: string | null = null;

    const room = await client1.joinOrCreate("mafia_room", {
      roomCode: "TEST1",
      displayName: "AliceHost"
    }, MafiaRoomState);

    room.onMessage(ServerMessageType.RECONNECTION_TOKEN, (data: any) => {
      receivedToken = data.token;
    });

    // Wait for initial authoritative state to sync
    await new Promise<void>(resolve => {
      if (room.state.roomCode) return resolve();
      room.onStateChange.once(() => resolve());
    });

    expect(room.state.roomCode).toBe("TEST1");
    expect(room.state.phase).toBe(Phase.WAITING_FOR_PLAYERS);
    expect(room.state.hostId).toBe(room.sessionId);

    const alice = room.state.players.get(room.sessionId);
    expect(alice).toBeDefined();
    expect(alice!.displayName).toBe("AliceHost");
    expect(alice!.isHost).toBe(true);
    expect(alice!.isConnected).toBe(true);
    expect(receivedToken).toBeTruthy();

    await room.leave();
  });

  it("handles a second player joining as a non-host", async () => {
    const client1 = new ColyseusClient(SERVER_URL);
    const client2 = new ColyseusClient(SERVER_URL);

    const room1 = await client1.joinOrCreate("mafia_room", {
      roomCode: "TEST2",
      displayName: "AliceHost"
    }, MafiaRoomState);

    const room2 = await client2.joinOrCreate("mafia_room", {
      roomCode: "TEST2",
      displayName: "BobCitizen"
    }, MafiaRoomState);

    // Wait for state sync
    await new Promise(r => setTimeout(r, 200));

    expect(room1.state.players.size).toBe(2);
    expect(room2.state.players.size).toBe(2);

    const bob = room1.state.players.get(room2.sessionId);
    expect(bob).toBeDefined();
    expect(bob!.displayName).toBe("BobCitizen");
    expect(bob!.isHost).toBe(false);

    await room1.leave();
    await room2.leave();
  });

  it("allows host to update config and blocks non-host from doing so", async () => {
    const client1 = new ColyseusClient(SERVER_URL);
    const client2 = new ColyseusClient(SERVER_URL);

    const room1 = await client1.joinOrCreate("mafia_room", { roomCode: "TEST3", displayName: "HostUser" }, MafiaRoomState);
    const room2 = await client2.joinOrCreate("mafia_room", { roomCode: "TEST3", displayName: "GuestUser" }, MafiaRoomState);

    await new Promise<void>(resolve => {
      if (room1.state.config.mafiaPercentage) return resolve();
      room1.onStateChange.once(() => resolve());
    });

    let nonHostError: string | null = null;
    room2.onMessage(ServerMessageType.ERROR_NOTIFICATION, (err: any) => {
      nonHostError = err.message;
    });

    // Non-host attempts config change
    room2.send(ClientMessageType.UPDATE_CONFIG, { mafiaPercentage: 25 });
    await new Promise(r => setTimeout(r, 100));

    expect(nonHostError).toMatch(/Only the room host can update/);
    expect(room1.state.config.mafiaPercentage).toBe(20);

    // Host updates config to 25% and dev mode to true
    room1.send(ClientMessageType.UPDATE_CONFIG, { mafiaPercentage: 25, isDevMode: true });
    await new Promise(r => setTimeout(r, 100));

    expect(room1.state.config.mafiaPercentage).toBe(25);
    expect(room2.state.config.mafiaPercentage).toBe(25);
    expect(room2.state.config.isDevMode).toBe(true);

    await room1.leave();
    await room2.leave();
  });

  it("validates minimum player count on Start Game", async () => {
    const client1 = new ColyseusClient(SERVER_URL);
    const room1 = await client1.joinOrCreate("mafia_room", { roomCode: "TEST4", displayName: "SoloHost" }, MafiaRoomState);

    let startError: string | null = null;
    room1.onMessage(ServerMessageType.ERROR_NOTIFICATION, (err: any) => {
      startError = err.message;
    });

    // Host tries to start game with only 1 player (needs 5 in prod)
    room1.send(ClientMessageType.START_GAME);
    await new Promise(r => setTimeout(r, 100));

    expect(startError).toMatch(/Need at least 5 players/);
    expect(room1.state.phase).toBe(Phase.WAITING_FOR_PLAYERS);

    await room1.leave();
  });

  it("supports player ready toggle", async () => {
    const client = new ColyseusClient(SERVER_URL);
    const room = await client.joinOrCreate("mafia_room", { roomCode: "TEST5", displayName: "Alice" }, MafiaRoomState);

    await new Promise<void>(resolve => {
      if (room.state.players.size > 0) return resolve();
      room.onStateChange.once(() => resolve());
    });

    expect(room.state.players.get(room.sessionId)!.isReady).toBe(false);

    room.send(ClientMessageType.READY_TOGGLE);
    await new Promise(r => setTimeout(r, 100));

    expect(room.state.players.get(room.sessionId)!.isReady).toBe(true);

    await room.leave();
  });
});
