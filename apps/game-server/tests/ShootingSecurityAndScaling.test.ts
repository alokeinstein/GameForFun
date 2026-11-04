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
  WeaponId
} from "@mafia/shared";

describe.sequential("ShootingRoom Security Validation & Anti-Exploit Suite", () => {
  let httpServer: http.Server;
  let gameServer: colyseus.Server;
  const PORT = 2598;
  const SERVER_URL = `ws://localhost:${PORT}`;

  beforeAll(async () => {
    httpServer = http.createServer();
    gameServer = new Server({
      transport: new WebSocketTransport({
        server: httpServer
      })
    });

    gameServer.define("shooting_room", ShootingRoom);

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

  it("Security: clamps out-of-bounds coordinates and rejects non-finite NaN/Infinity inputs", async () => {
    const colyseusClient = new ColyseusClient(SERVER_URL);
    const room = await colyseusClient.joinOrCreate<ShootingRoomState>(
      "shooting_room",
      { roomCode: "SEC_BOUNDS", displayName: "BoundaryHacker" },
      ShootingRoomState
    );

    await new Promise((r) => setTimeout(r, 100));
    const player = room.state.players.get(room.sessionId)!;
    expect(player).toBeDefined();

    // 1. Extreme out-of-bounds coordinates
    room.send(ClientMessageType.PLAYER_INPUT, {
      x: 99999,
      y: 1000,
      z: -88888,
      rotationY: 3.14,
      animationState: "running"
    });

    await new Promise((r) => setTimeout(r, 150));

    // Bounds clamped to [-85, 85] and [-5, 30]
    expect(player.x).toBe(85);
    expect(player.y).toBe(30);
    expect(player.z).toBe(-85);

    // 2. Non-finite / NaN exploit
    room.send(ClientMessageType.PLAYER_INPUT, {
      x: NaN,
      y: Infinity,
      z: -Infinity,
      rotationY: NaN,
      animationState: "exploit"
    });

    await new Promise((r) => setTimeout(r, 150));

    // Coordinates remain safe, not corrupted by NaN/Infinity
    expect(isFinite(player.x)).toBe(true);
    expect(isFinite(player.y)).toBe(true);
    expect(isFinite(player.z)).toBe(true);
    expect(player.x).toBe(85);
    expect(player.y).toBe(30);
    expect(player.z).toBe(-85);

    await room.leave();
  });

  it("Security: rejects rapid fire flood attacks / cooldown injection", async () => {
    const colyseusClient = new ColyseusClient(SERVER_URL);
    const room = await colyseusClient.joinOrCreate<ShootingRoomState>(
      "shooting_room",
      { roomCode: "SEC_ROF", displayName: "RapidShooter" },
      ShootingRoomState
    );

    await new Promise((r) => setTimeout(r, 100));

    // Select Sniper Rifle (1200ms fire interval, 5 mag capacity)
    room.send(ClientMessageType.SHOOTING_SELECT_LOADOUT, { weaponId: WeaponId.SNIPER_RIFLE });
    await new Promise((r) => setTimeout(r, 150));

    const player = room.state.players.get(room.sessionId)!;
    expect(player.weaponId).toBe(WeaponId.SNIPER_RIFLE);
    expect(player.ammo).toBe(5);

    // Start match
    room.send(ClientMessageType.SHOOTING_START_MATCH, {});
    await new Promise((r) => setTimeout(r, 150));
    expect(room.state.status).toBe("ACTIVE");

    // Flood the server with 25 rapid fire requests with zero delay
    for (let i = 0; i < 25; i++) {
      room.send(ClientMessageType.SHOOTING_FIRE, {
        origin: { x: player.x, y: 1.2, z: player.z },
        direction: { x: 0, y: 0, z: -1 }
      });
    }

    await new Promise((r) => setTimeout(r, 200));

    // Server authority only processed the first shot; rejected the remaining 24
    expect(player.ammo).toBe(4);

    await room.leave();
  });

  it("Security: blocks mid-combat loadout switching while alive to prevent reload bypass", async () => {
    const colyseusClient = new ColyseusClient(SERVER_URL);
    const room = await colyseusClient.joinOrCreate<ShootingRoomState>(
      "shooting_room",
      { roomCode: "SEC_LOADOUT", displayName: "Glitcher" },
      ShootingRoomState
    );

    await new Promise((r) => setTimeout(r, 100));
    const player = room.state.players.get(room.sessionId)!;
    expect(player.weaponId).toBe(WeaponId.ASSAULT_RIFLE);

    // Start match
    room.send(ClientMessageType.SHOOTING_START_MATCH, {});
    await new Promise((r) => setTimeout(r, 150));
    expect(room.state.status).toBe("ACTIVE");

    // Fire 5 rounds
    for (let i = 0; i < 5; i++) {
      await new Promise((r) => setTimeout(r, 120));
      room.send(ClientMessageType.SHOOTING_FIRE, {
        origin: { x: player.x, y: 1.2, z: player.z },
        direction: { x: 0, y: 0, z: -1 }
      });
    }
    await new Promise((r) => setTimeout(r, 150));
    const ammoAfterFiring = player.ammo;
    expect(ammoAfterFiring).toBeLessThan(30);

    // Attempt exploit: switch weapon mid-combat while alive
    room.send(ClientMessageType.SHOOTING_SELECT_LOADOUT, { weaponId: WeaponId.SMG });
    await new Promise((r) => setTimeout(r, 150));

    // Weapon must still be Assault Rifle, ammo not refilled
    expect(player.weaponId).toBe(WeaponId.ASSAULT_RIFLE);
    expect(player.ammo).toBe(ammoAfterFiring);

    await room.leave();
  });

  it("Security: rejects friendly fire attacks and prevents team damage when friendlyFire is disabled", async () => {
    const colyseusClient1 = new ColyseusClient(SERVER_URL);
    const colyseusClient2 = new ColyseusClient(SERVER_URL);

    const host = await colyseusClient1.joinOrCreate<ShootingRoomState>(
      "shooting_room",
      { roomCode: "SEC_FRIENDLY", displayName: "HostRed" },
      ShootingRoomState
    );

    const teammate = await colyseusClient2.joinById<ShootingRoomState>(
      host.id,
      { displayName: "TeammateRed" },
      ShootingRoomState
    );

    await new Promise((r) => setTimeout(r, 150));

    // Assign teammate to team-red
    host.send(ClientMessageType.SHOOTING_ASSIGN_TEAM, {
      targetPlayerId: teammate.sessionId,
      teamId: "team-red"
    });
    await new Promise((r) => setTimeout(r, 150));

    const hostPlayer = host.state.players.get(host.sessionId)!;
    const teamPlayer = host.state.players.get(teammate.sessionId)!;
    expect(hostPlayer.teamId).toBe("team-red");
    expect(teamPlayer.teamId).toBe("team-red");

    // Start match
    host.send(ClientMessageType.SHOOTING_START_MATCH, {});
    await new Promise((r) => setTimeout(r, 200));

    // Position them close to each other
    host.send(ClientMessageType.PLAYER_INPUT, { x: 10, y: 0.4, z: 10 });
    teammate.send(ClientMessageType.PLAYER_INPUT, { x: 12, y: 0.4, z: 10 });
    await new Promise((r) => setTimeout(r, 150));

    const victimShieldBefore = teamPlayer.shield;
    const victimHealthBefore = teamPlayer.health;

    // Host shoots teammate
    host.send(ClientMessageType.SHOOTING_FIRE, {
      targetPlayerId: teammate.sessionId,
      hitRegion: HitRegion.HEAD,
      origin: { x: hostPlayer.x, y: 1.2, z: hostPlayer.z },
      direction: { x: 1, y: 0, z: 0 }
    });

    await new Promise((r) => setTimeout(r, 200));

    // Shield and health untouched due to friendly fire filter
    expect(teamPlayer.shield).toBe(victimShieldBefore);
    expect(teamPlayer.health).toBe(victimHealthBefore);
    expect(hostPlayer.kills).toBe(0);

    await host.leave();
    await teammate.leave();
  });

  it("Security: prevents damage to dead/respawning players and prevents dead players from firing", async () => {
    const colyseusClient1 = new ColyseusClient(SERVER_URL);
    const colyseusClient2 = new ColyseusClient(SERVER_URL);

    const shooter = await colyseusClient1.joinOrCreate<ShootingRoomState>(
      "shooting_room",
      { roomCode: "SEC_DEAD", displayName: "ShooterRed" },
      ShootingRoomState
    );

    const target = await colyseusClient2.joinById<ShootingRoomState>(
      shooter.id,
      { displayName: "TargetBlue" },
      ShootingRoomState
    );

    await new Promise((r) => setTimeout(r, 150));

    shooter.send(ClientMessageType.SHOOTING_JOIN_TEAM, { teamId: "team-red" });
    target.send(ClientMessageType.SHOOTING_JOIN_TEAM, { teamId: "team-blue" });
    await new Promise((r) => setTimeout(r, 150));

    // Start match
    shooter.send(ClientMessageType.SHOOTING_START_MATCH, {});
    await new Promise((r) => setTimeout(r, 200));

    const sPlayer = shooter.state.players.get(shooter.sessionId)!;
    const tPlayer = shooter.state.players.get(target.sessionId)!;

    // Move close
    shooter.send(ClientMessageType.PLAYER_INPUT, { x: 0, y: 0.4, z: 0 });
    target.send(ClientMessageType.PLAYER_INPUT, { x: 2, y: 0.4, z: 0 });
    await new Promise((r) => setTimeout(r, 150));

    // Eliminate target with headshots
    for (let i = 0; i < 4; i++) {
      await new Promise((r) => setTimeout(r, 120));
      shooter.send(ClientMessageType.SHOOTING_FIRE, {
        targetPlayerId: target.sessionId,
        hitRegion: HitRegion.HEAD
      });
      await new Promise((r) => setTimeout(r, 150));
      if (!tPlayer.isAlive) break;
    }

    expect(tPlayer.isAlive).toBe(false);
    expect(sPlayer.kills).toBe(1);
    expect(tPlayer.deaths).toBe(1);

    // 1. Dead player attempts to fire
    const ammoBefore = tPlayer.ammo;
    target.send(ClientMessageType.SHOOTING_FIRE, {
      origin: { x: tPlayer.x, y: 1.2, z: tPlayer.z },
      direction: { x: 0, y: 0, z: 1 }
    });
    await new Promise((r) => setTimeout(r, 150));
    expect(tPlayer.ammo).toBe(ammoBefore); // Shot rejected

    // 2. Shooter fires at already dead target during respawn cooldown
    await new Promise((r) => setTimeout(r, 120));
    shooter.send(ClientMessageType.SHOOTING_FIRE, {
      targetPlayerId: target.sessionId,
      hitRegion: HitRegion.HEAD
    });
    await new Promise((r) => setTimeout(r, 150));

    // Deaths and kills must not increment again
    expect(sPlayer.kills).toBe(1);
    expect(tPlayer.deaths).toBe(1);

    await shooter.leave();
    await target.leave();
  });

  it("Multiplayer: token-based session reconnection preserves player state, team, and weapon loadout", async () => {
    const colyseusClient = new ColyseusClient(SERVER_URL);
    let receivedToken = "";

    const client1 = await colyseusClient.joinOrCreate<ShootingRoomState>(
      "shooting_room",
      { roomCode: "SEC_RECONNECT", displayName: "ReconnectPlayer" },
      ShootingRoomState
    );

    client1.onMessage(ServerMessageType.RECONNECTION_TOKEN, (data: { token: string }) => {
      receivedToken = data.token;
    });

    client1.send(ClientMessageType.SHOOTING_JOIN_TEAM, { teamId: "team-green" });
    client1.send(ClientMessageType.SHOOTING_SELECT_LOADOUT, { weaponId: WeaponId.SMG });
    await new Promise((r) => setTimeout(r, 200));

    const playerBefore = client1.state.players.get(client1.sessionId)!;
    expect(playerBefore.teamId).toBe("team-green");
    expect(playerBefore.weaponId).toBe(WeaponId.SMG);
    expect(receivedToken).toBeTruthy();

    // Reconnect using token
    const client2 = await colyseusClient.joinOrCreate<ShootingRoomState>(
      "shooting_room",
      {
        roomCode: "SEC_RECONNECT",
        displayName: "ReconnectPlayer",
        reconnectToken: receivedToken
      },
      ShootingRoomState
    );

    await new Promise((r) => setTimeout(r, 200));

    const reconnectedPlayer = client2.state.players.get(client2.sessionId)!;
    expect(reconnectedPlayer).toBeDefined();
    expect(reconnectedPlayer.teamId).toBe("team-green");
    expect(reconnectedPlayer.weaponId).toBe(WeaponId.SMG);

    await client2.leave();
  });
});
