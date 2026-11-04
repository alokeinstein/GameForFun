import { describe, it, expect, beforeAll, afterAll } from "vitest";
import colyseus from "colyseus";
const { Server } = colyseus;
import { WebSocketTransport } from "@colyseus/ws-transport";
import http from "node:http";
import { Client as ColyseusClient } from "colyseus.js";
import { ShootingRoom } from "../src/rooms/ShootingRoom.js";
import {
  GameMode,
  ClientMessageType,
  ServerMessageType,
  ShootingRoomState
} from "@mafia/shared";

describe.sequential("ShootingRoom Multi-Game & Team Architecture", () => {
  let httpServer: http.Server;
  let gameServer: colyseus.Server;
  const PORT = 2595;
  const SERVER_URL = `ws://localhost:${PORT}`;

  beforeAll(async () => {
    httpServer = http.createServer();
    gameServer = new Server({
      transport: new WebSocketTransport({
        server: httpServer
      })
    });
    gameServer.define("shooting_room", ShootingRoom).filterBy(["roomCode"]);

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

  it("creates a shooting room with gameMode SHOOTING, default teams, and assigns host", async () => {
    const client1 = new ColyseusClient(SERVER_URL);
    let receivedToken: string | null = null;

    const room = await client1.joinOrCreate<ShootingRoomState>("shooting_room", {
      roomCode: "SHT01",
      displayName: "CommanderAlpha"
    }, ShootingRoomState);

    room.onMessage(ServerMessageType.RECONNECTION_TOKEN, (data: any) => {
      receivedToken = data.token;
    });

    await new Promise<void>((resolve) => {
      if (room.state.roomCode) return resolve();
      room.onStateChange.once(() => resolve());
    });

    expect(room.state.roomCode).toBe("SHT01");
    expect(room.state.gameMode).toBe(GameMode.SHOOTING);
    expect(room.state.status).toBe("LOBBY");
    expect(room.state.hostId).toBe(room.sessionId);

    // Verify 3 default teams exist
    expect(room.state.teams.has("team-red")).toBe(true);
    expect(room.state.teams.has("team-blue")).toBe(true);
    expect(room.state.teams.has("team-green")).toBe(true);

    const hostPlayer = room.state.players.get(room.sessionId);
    expect(hostPlayer).toBeDefined();
    expect(hostPlayer?.displayName).toBe("CommanderAlpha");
    expect(hostPlayer?.isHost).toBe(true);

    // Reconnection token issued
    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(receivedToken).toBeTruthy();

    await room.leave();
  });

  it("assigns players into teams and allows team switching and host reassignment", async () => {
    const client1 = new ColyseusClient(SERVER_URL);
    const client2 = new ColyseusClient(SERVER_URL);

    const room1 = await client1.joinOrCreate<ShootingRoomState>("shooting_room", {
      roomCode: "SHT02",
      displayName: "HostOne"
    }, ShootingRoomState);

    const room2 = await client2.joinOrCreate<ShootingRoomState>("shooting_room", {
      roomCode: "SHT02",
      displayName: "PlayerTwo"
    }, ShootingRoomState);

    await new Promise((resolve) => setTimeout(resolve, 150));

    expect(room1.state.players.size).toBe(2);
    const p1 = room1.state.players.get(room1.sessionId)!;
    const p2 = room1.state.players.get(room2.sessionId)!;

    // Both players assigned to valid teams
    expect(["team-red", "team-blue", "team-green"]).toContain(p1.teamId);
    expect(["team-red", "team-blue", "team-green"]).toContain(p2.teamId);

    // Player 2 requests to switch to team-green
    room2.send(ClientMessageType.SHOOTING_JOIN_TEAM, { teamId: "team-green" });
    await new Promise((resolve) => setTimeout(resolve, 150));
    expect(room1.state.players.get(room2.sessionId)?.teamId).toBe("team-green");

    // Host manually reassigns Player 2 to team-blue
    room1.send(ClientMessageType.SHOOTING_ASSIGN_TEAM, {
      targetPlayerId: room2.sessionId,
      teamId: "team-blue"
    });
    await new Promise((resolve) => setTimeout(resolve, 150));
    expect(room1.state.players.get(room2.sessionId)?.teamId).toBe("team-blue");

    await room1.leave();
    await room2.leave();
  });

  it("handles match configuration updates and starts match on host command", async () => {
    const client1 = new ColyseusClient(SERVER_URL);

    const room = await client1.joinOrCreate<ShootingRoomState>("shooting_room", {
      roomCode: "SHT03",
      displayName: "MatchHost"
    }, ShootingRoomState);

    await new Promise((resolve) => setTimeout(resolve, 100));

    // Host updates match configuration
    room.send(ClientMessageType.SHOOTING_UPDATE_CONFIG, {
      matchDurationSec: 600,
      scoreLimit: 50,
      selectedMap: "WAREHOUSE_COMBAT"
    });

    await new Promise((resolve) => setTimeout(resolve, 150));
    expect(room.state.config.matchDurationSec).toBe(600);
    expect(room.state.config.scoreLimit).toBe(50);
    expect(room.state.config.selectedMap).toBe("WAREHOUSE_COMBAT");

    // Host starts match
    room.send(ClientMessageType.SHOOTING_START_MATCH);
    await new Promise((resolve) => setTimeout(resolve, 150));

    expect(room.state.status).toBe("ACTIVE");
    expect(room.state.phaseStartedAt).toBeGreaterThan(0);
    expect(room.state.phaseEndsAt).toBeGreaterThan(room.state.phaseStartedAt);

    await room.leave();
  });

  it("supports host auto-balancing, player loadout selection, and team renaming", async () => {
    const client1 = new ColyseusClient(SERVER_URL);
    const client2 = new ColyseusClient(SERVER_URL);
    const client3 = new ColyseusClient(SERVER_URL);
    const client4 = new ColyseusClient(SERVER_URL);

    const room1 = await client1.joinOrCreate<ShootingRoomState>("shooting_room", {
      roomCode: "SHT04",
      displayName: "Captain"
    }, ShootingRoomState);

    const room2 = await client2.joinOrCreate<ShootingRoomState>("shooting_room", {
      roomCode: "SHT04",
      displayName: "Sniper"
    }, ShootingRoomState);

    const room3 = await client3.joinOrCreate<ShootingRoomState>("shooting_room", {
      roomCode: "SHT04",
      displayName: "Gunner"
    }, ShootingRoomState);

    const room4 = await client4.joinOrCreate<ShootingRoomState>("shooting_room", {
      roomCode: "SHT04",
      displayName: "Scout"
    }, ShootingRoomState);

    await new Promise((resolve) => setTimeout(resolve, 200));
    expect(room1.state.players.size).toBe(4);

    // 1. Weapon Loadout Selection
    room2.send(ClientMessageType.SHOOTING_SELECT_LOADOUT, { weaponId: "sniper_rifle" });
    await new Promise((resolve) => setTimeout(resolve, 150));
    const sniperPlayer = room1.state.players.get(room2.sessionId);
    expect(sniperPlayer?.weaponId).toBe("sniper_rifle");
    expect(sniperPlayer?.ammo).toBe(5);
    expect(sniperPlayer?.maxAmmo).toBe(5);

    // 2. Team Renaming by Host
    room1.send(ClientMessageType.SHOOTING_RENAME_TEAM, {
      teamId: "team-red",
      name: "Crimson Wolves"
    });
    await new Promise((resolve) => setTimeout(resolve, 150));
    expect(room1.state.teams.get("team-red")?.name).toBe("Crimson Wolves");

    // 3. Force all players into Crimson Wolves (team-red) then test Auto-Balance
    room1.send(ClientMessageType.SHOOTING_ASSIGN_TEAM, { targetPlayerId: room1.sessionId, teamId: "team-red" });
    room1.send(ClientMessageType.SHOOTING_ASSIGN_TEAM, { targetPlayerId: room2.sessionId, teamId: "team-red" });
    room1.send(ClientMessageType.SHOOTING_ASSIGN_TEAM, { targetPlayerId: room3.sessionId, teamId: "team-red" });
    room1.send(ClientMessageType.SHOOTING_ASSIGN_TEAM, { targetPlayerId: room4.sessionId, teamId: "team-red" });
    await new Promise((resolve) => setTimeout(resolve, 200));

    // Host triggers auto-balance
    room1.send(ClientMessageType.SHOOTING_AUTO_BALANCE);
    await new Promise((resolve) => setTimeout(resolve, 200));

    // Verify all 3 teams have active players distributed
    const redCount = room1.state.teams.get("team-red")?.playerCount;
    const blueCount = room1.state.teams.get("team-blue")?.playerCount;
    const greenCount = room1.state.teams.get("team-green")?.playerCount;

    expect((redCount || 0) + (blueCount || 0) + (greenCount || 0)).toBe(4);
    expect(redCount).toBeGreaterThanOrEqual(1);
    expect(blueCount).toBeGreaterThanOrEqual(1);
    expect(greenCount).toBeGreaterThanOrEqual(1);

    await room1.leave();
    await room2.leave();
    await room3.leave();
    await room4.leave();
  });
});

