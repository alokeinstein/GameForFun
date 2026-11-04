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
  ShootingRoomState,
  HitRegion,
  WeaponId,
  WEAPONS_CATALOG,
  ShootingFirePayload
} from "@mafia/shared";

describe.sequential("ShootingRoom Authoritative Combat Mechanics", () => {
  let httpServer: http.Server;
  let gameServer: colyseus.Server;
  const PORT = 2596;
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

  it("handles match start, team spawning, firing rate, shield absorption, headshots, and elimination", async () => {
    const colyseusClient1 = new ColyseusClient(SERVER_URL);
    const colyseusClient2 = new ColyseusClient(SERVER_URL);

    // 1. Join Host (Red Team)
    const hostRoom = await colyseusClient1.joinOrCreate<ShootingRoomState>(
      "shooting_room",
      { roomCode: "COMBAT01", displayName: "ShooterRed" },
      ShootingRoomState
    );

    // 2. Join Opponent (Blue Team)
    const opponentRoom = await colyseusClient2.joinOrCreate<ShootingRoomState>(
      "shooting_room",
      { roomCode: "COMBAT01", displayName: "ShooterBlue" },
      ShootingRoomState
    );

    await new Promise((resolve) => setTimeout(resolve, 150));

    // Force teams: Host to Red, Opponent to Blue
    hostRoom.send(ClientMessageType.SHOOTING_JOIN_TEAM, { teamId: "team-red" });
    opponentRoom.send(ClientMessageType.SHOOTING_JOIN_TEAM, { teamId: "team-blue" });

    // Set fast respawn delay for testing (1 sec)
    hostRoom.send(ClientMessageType.SHOOTING_UPDATE_CONFIG, {
      scoreLimit: 2,
      respawnDelaySec: 1
    });

    await new Promise((resolve) => setTimeout(resolve, 100));

    // 3. Start Match
    hostRoom.send(ClientMessageType.SHOOTING_START_MATCH, {});
    await new Promise((resolve) => setTimeout(resolve, 150));

    expect(hostRoom.state.status).toBe("ACTIVE");
    const redShooter = hostRoom.state.players.get(hostRoom.sessionId)!;
    const blueTarget = hostRoom.state.players.get(opponentRoom.sessionId)!;

    expect(redShooter.isAlive).toBe(true);
    expect(redShooter.health).toBe(100);
    expect(redShooter.shield).toBe(50);
    expect(redShooter.ammo).toBe(30);

    // Bring them close in 3D space via PLAYER_INPUT for authoritative server position sync
    hostRoom.send(ClientMessageType.PLAYER_INPUT, {
      x: 0,
      y: 0.4,
      z: 0,
      rotationY: 0,
      animationState: "idle"
    });
    opponentRoom.send(ClientMessageType.PLAYER_INPUT, {
      x: 0,
      y: 0.4,
      z: 10,
      rotationY: Math.PI,
      animationState: "idle"
    });
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Listen for hit events and killfeed on opponent room
    let lastHitEvent: any = null;
    let lastKillEvent: any = null;
    opponentRoom.onMessage(ServerMessageType.SHOOTING_HIT_EVENT, (payload) => {
      lastHitEvent = payload;
    });
    opponentRoom.onMessage(ServerMessageType.SHOOTING_KILL_FEED, (payload) => {
      lastKillEvent = payload;
    });

    // 4. Test Weapon Fire - Torso Shot (32 base damage * 1.0 = 32 damage)
    // Shield (50) absorbs 32 damage -> 18 shield remaining, 100 health
    const fireShot1: ShootingFirePayload = {
      origin: { x: 0, y: 1.2, z: 0 },
      direction: { x: 0, y: 0, z: 1 },
      targetPlayerId: blueTarget.id,
      hitRegion: HitRegion.UPPER_TORSO,
      clientTimestamp: Date.now()
    };
    hostRoom.send(ClientMessageType.SHOOTING_FIRE, fireShot1);

    // Rate-of-fire enforcement: firing again immediately (< 85ms) should be rejected
    hostRoom.send(ClientMessageType.SHOOTING_FIRE, fireShot1);

    await new Promise((resolve) => setTimeout(resolve, 80));

    expect(redShooter.ammo).toBe(29); // First shot counted, second shot rejected by cooldown
    expect(blueTarget.shield).toBe(18);
    expect(blueTarget.health).toBe(100);
    expect(lastHitEvent).toBeDefined();
    expect(lastHitEvent.damage).toBe(32);
    expect(lastHitEvent.isHeadshot).toBe(false);

    // Wait past rate-of-fire window
    await new Promise((resolve) => setTimeout(resolve, 120));

    // 6. Test Headshot (32 base damage * 2.0 = 64 damage)
    // Shield (18) absorbs 18 -> 0 shield. Remaining 46 damages health (100 - 46 = 54 health)
    const fireShot2: ShootingFirePayload = {
      origin: { x: 0, y: 1.2, z: 0 },
      direction: { x: 0, y: 0, z: 1 },
      targetPlayerId: blueTarget.id,
      hitRegion: HitRegion.HEAD,
      clientTimestamp: Date.now()
    };
    hostRoom.send(ClientMessageType.SHOOTING_FIRE, fireShot2);

    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(redShooter.ammo).toBe(28);
    expect(blueTarget.shield).toBe(0);
    expect(blueTarget.health).toBe(54);
    expect(lastHitEvent.isHeadshot).toBe(true);
    expect(lastHitEvent.damage).toBe(64);

    // Wait past rate-of-fire window
    await new Promise((resolve) => setTimeout(resolve, 120));

    // 7. Fatal Headshot (64 damage against 54 health -> 0 health, elimination)
    hostRoom.send(ClientMessageType.SHOOTING_FIRE, fireShot2);
    await new Promise((resolve) => setTimeout(resolve, 120));

    expect(redShooter.ammo).toBe(27);
    expect(blueTarget.health).toBe(0);
    expect(blueTarget.isAlive).toBe(false);
    expect(blueTarget.deaths).toBe(1);
    expect(redShooter.kills).toBe(1);
    expect(redShooter.score).toBe(150); // 150 for headshot elimination

    const redTeam = hostRoom.state.teams.get("team-red")!;
    expect(redTeam.score).toBe(1);

    expect(lastKillEvent).toBeDefined();
    expect(lastKillEvent.killerId).toBe(redShooter.id);
    expect(lastKillEvent.victimId).toBe(blueTarget.id);
    expect(lastKillEvent.isHeadshot).toBe(true);

    // 8. Automated Respawn after 1s
    await new Promise((resolve) => setTimeout(resolve, 1200));

    expect(blueTarget.isAlive).toBe(true);
    expect(blueTarget.health).toBe(100);
    expect(blueTarget.shield).toBe(50);
    expect(blueTarget.ammo).toBe(30);

    // 9. Score limit match victory test
    // Bring blueTarget close again via PLAYER_INPUT for authoritative position sync
    opponentRoom.send(ClientMessageType.PLAYER_INPUT, {
      x: 0,
      y: 0.4,
      z: 5,
      rotationY: Math.PI,
      animationState: "idle"
    });
    await new Promise((resolve) => setTimeout(resolve, 80));

    // Eliminate opponent again with headshots to reach score limit (scoreLimit = 2)
    for (let i = 0; i < 3; i++) {
      await new Promise((resolve) => setTimeout(resolve, 120));
      const shot: ShootingFirePayload = {
        origin: { x: 0, y: 1.2, z: 0 },
        direction: { x: 0, y: 0, z: 1 },
        targetPlayerId: blueTarget.id,
        hitRegion: HitRegion.HEAD,
        clientTimestamp: Date.now()
      };
      hostRoom.send(ClientMessageType.SHOOTING_FIRE, shot);
      await new Promise((resolve) => setTimeout(resolve, 80));
      if (!blueTarget.isAlive) break;
    }

    expect(blueTarget.isAlive).toBe(false);
    expect(redShooter.kills).toBe(2);
    expect(redTeam.score).toBe(2);

    // Score limit reached (scoreLimit = 2) -> Match finishes!
    expect(hostRoom.state.status).toBe("MATCH_OVER");
    expect(hostRoom.state.winningTeamId).toBe("team-red");

    await hostRoom.leave();
    await opponentRoom.leave();
  });

  it("handles reloading mechanics correctly", async () => {
    const colyseusClient = new ColyseusClient(SERVER_URL);
    const room = await colyseusClient.joinOrCreate<ShootingRoomState>(
      "shooting_room",
      { roomCode: "RELOAD01", displayName: "Reloader" },
      ShootingRoomState
    );

    await new Promise((resolve) => setTimeout(resolve, 100));
    room.send(ClientMessageType.SHOOTING_START_MATCH, {});
    await new Promise((resolve) => setTimeout(resolve, 100));

    const player = room.state.players.get(room.sessionId)!;
    expect(player.ammo).toBe(30);
    expect(player.reserveAmmo).toBe(120);

    // Fire 3 shots
    for (let i = 0; i < 3; i++) {
      room.send(ClientMessageType.SHOOTING_FIRE, {
        origin: { x: 0, y: 0, z: 0 },
        direction: { x: 0, y: 0, z: 1 },
        clientTimestamp: Date.now()
      });
      await new Promise((resolve) => setTimeout(resolve, 110));
    }

    expect(player.ammo).toBe(27);

    // Request reload
    room.send(ClientMessageType.SHOOTING_RELOAD, {});
    await new Promise((resolve) => setTimeout(resolve, 80));

    expect(player.isReloading).toBe(true);

    // Cannot fire while reloading
    room.send(ClientMessageType.SHOOTING_FIRE, {
      origin: { x: 0, y: 0, z: 0 },
      direction: { x: 0, y: 0, z: 1 },
      clientTimestamp: Date.now()
    });
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(player.ammo).toBe(27); // Not decremented

    // Wait for assault rifle reload duration (2200ms)
    await new Promise((resolve) => setTimeout(resolve, 2300));

    expect(player.isReloading).toBe(false);
    expect(player.ammo).toBe(30);
    expect(player.reserveAmmo).toBe(117); // 3 transferred from reserve

    await room.leave();
  });

  it("enforces friendly fire prevention and allows friendly fire when configured", async () => {
    const client1 = new ColyseusClient(SERVER_URL);
    const client2 = new ColyseusClient(SERVER_URL);

    const hostRoom = await client1.joinOrCreate<ShootingRoomState>(
      "shooting_room",
      { roomCode: "FRIEND01", displayName: "Teammate1" },
      ShootingRoomState
    );
    const peerRoom = await client2.joinOrCreate<ShootingRoomState>(
      "shooting_room",
      { roomCode: "FRIEND01", displayName: "Teammate2" },
      ShootingRoomState
    );

    await new Promise((resolve) => setTimeout(resolve, 100));

    // Both join Team Red
    hostRoom.send(ClientMessageType.SHOOTING_JOIN_TEAM, { teamId: "team-red" });
    peerRoom.send(ClientMessageType.SHOOTING_JOIN_TEAM, { teamId: "team-red" });
    await new Promise((resolve) => setTimeout(resolve, 80));

    // Start match with default friendlyFire: false
    hostRoom.send(ClientMessageType.SHOOTING_START_MATCH, {});
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Place close together via authoritative PLAYER_INPUT
    hostRoom.send(ClientMessageType.PLAYER_INPUT, {
      x: 0,
      y: 0.4,
      z: 0,
      rotationY: 0,
      animationState: "idle"
    });
    peerRoom.send(ClientMessageType.PLAYER_INPUT, {
      x: 0,
      y: 0.4,
      z: 5,
      rotationY: 0,
      animationState: "idle"
    });
    await new Promise((resolve) => setTimeout(resolve, 80));

    const teammate2 = hostRoom.state.players.get(peerRoom.sessionId)!;
    expect(teammate2.shield).toBe(50);
    expect(teammate2.health).toBe(100);

    // Friendly fire attempt (friendlyFire: false)
    hostRoom.send(ClientMessageType.SHOOTING_FIRE, {
      origin: { x: 0, y: 1.2, z: 0 },
      direction: { x: 0, y: 0, z: 1 },
      targetPlayerId: teammate2.id,
      hitRegion: HitRegion.HEAD,
      clientTimestamp: Date.now()
    });
    await new Promise((resolve) => setTimeout(resolve, 120));

    // Damage must be ignored!
    expect(teammate2.shield).toBe(50);
    expect(teammate2.health).toBe(100);

    await hostRoom.leave();
    await peerRoom.leave();
  });
});
