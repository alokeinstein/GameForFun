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
  MafiaRoomState
} from "@mafia/shared";
import { Phase, Role, WinningTeam } from "@mafia/game-rules";

describe.sequential("Milestone 2 - Server Authoritative Game Loop & Mechanics", () => {
  let httpServer: http.Server;
  let gameServer: colyseus.Server;
  const PORT = 2583;
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

  it("distributes secret roles with ZERO role leakage to Citizens", async () => {
    const c1 = new ColyseusClient(SERVER_URL);
    const c2 = new ColyseusClient(SERVER_URL);
    const c3 = new ColyseusClient(SERVER_URL);

    const r1 = await c1.joinOrCreate("mafia_room", { roomCode: "SECR1", displayName: "Alice" }, MafiaRoomState);
    const r2 = await c2.joinOrCreate("mafia_room", { roomCode: "SECR1", displayName: "Bob" }, MafiaRoomState);
    const r3 = await c3.joinOrCreate("mafia_room", { roomCode: "SECR1", displayName: "Charlie" }, MafiaRoomState);

    // Host configures Dev Mode (allows 3 players) and short timers for test speed
    r1.send(ClientMessageType.UPDATE_CONFIG, {
      isDevMode: true,
      nightDurationSec: 5,
      discussionDurationSec: 5,
      votingDurationSec: 5
    });

    await new Promise(r => setTimeout(r, 100));

    // Capture private role messages
    const roleMessages: Record<string, any> = {};
    r1.onMessage(ServerMessageType.ROLE_ASSIGNMENT, (msg) => { roleMessages[r1.sessionId] = msg; });
    r2.onMessage(ServerMessageType.ROLE_ASSIGNMENT, (msg) => { roleMessages[r2.sessionId] = msg; });
    r3.onMessage(ServerMessageType.ROLE_ASSIGNMENT, (msg) => { roleMessages[r3.sessionId] = msg; });

    // Host starts game
    r1.send(ClientMessageType.START_GAME);
    await new Promise(r => setTimeout(r, 200));

    expect(r1.state.phase).toBe(Phase.ROLE_ASSIGNMENT);

    // Verify all 3 received private role assignments
    expect(roleMessages[r1.sessionId]).toBeDefined();
    expect(roleMessages[r2.sessionId]).toBeDefined();
    expect(roleMessages[r3.sessionId]).toBeDefined();

    // Verify exactly 1 Mafia and 2 Citizens
    const roles = [
      roleMessages[r1.sessionId].role,
      roleMessages[r2.sessionId].role,
      roleMessages[r3.sessionId].role
    ];
    expect(roles.filter(r => r === Role.MAFIA)).toHaveLength(1);
    expect(roles.filter(r => r === Role.CITIZEN)).toHaveLength(2);

    // SECURITY CHECK: Citizens MUST NOT receive teammates or other players' roles
    for (const [sId, msg] of Object.entries(roleMessages)) {
      if (msg.role === Role.CITIZEN) {
        expect(msg.teammates).toBeUndefined();
      } else if (msg.role === Role.MAFIA) {
        expect(msg.teammates).toBeDefined();
        expect(msg.teammates).toHaveLength(1); // Self in this 3-player match
      }
    }

    // Public room schema check: verify NO player has role field in public schema
    r1.state.players.forEach((p: any) => {
      expect(p.role).toBeUndefined();
    });

    await r1.leave();
    await r2.leave();
    await r3.leave();
  });

  it("executes Night Kill, eliminates Citizen, and triggers Mafia Parity Victory", async () => {
    const c1 = new ColyseusClient(SERVER_URL);
    const c2 = new ColyseusClient(SERVER_URL);
    const c3 = new ColyseusClient(SERVER_URL);

    const r1 = await c1.joinOrCreate("mafia_room", { roomCode: "NIGHT1", displayName: "P1" }, MafiaRoomState);
    const r2 = await c2.joinOrCreate("mafia_room", { roomCode: "NIGHT1", displayName: "P2" }, MafiaRoomState);
    const r3 = await c3.joinOrCreate("mafia_room", { roomCode: "NIGHT1", displayName: "P3" }, MafiaRoomState);

    // Fast 1s timers for rapid automated testing
    r1.send(ClientMessageType.UPDATE_CONFIG, {
      isDevMode: true,
      nightDurationSec: 1,
      morningDurationSec: 1,
      discussionDurationSec: 3,
      votingDurationSec: 1,
      eliminationDurationSec: 1
    });

    await new Promise(r => setTimeout(r, 100));

    const rooms = [r1, r2, r3];
    let mafiaRoom: any = null;
    let citizenRooms: any[] = [];

    rooms.forEach(r => {
      r.onMessage(ServerMessageType.ROLE_ASSIGNMENT, (msg) => {
        if (msg.role === Role.MAFIA) {
          mafiaRoom = r;
        } else if (msg.role === Role.CITIZEN) {
          citizenRooms.push(r);
        }
      });
    });

    r1.send(ClientMessageType.START_GAME);

    // Wait for role assignment intro (1s in dev mode) -> transition to NIGHT
    await new Promise(r => setTimeout(r, 1400));

    expect(r1.state.phase).toBe(Phase.NIGHT);
    expect(mafiaRoom).toBeDefined();
    expect(citizenRooms).toHaveLength(2);

    // Target the first citizen
    const targetCitizenId = citizenRooms[0].sessionId;
    mafiaRoom.send(ClientMessageType.MAFIA_TARGET_VOTE, { targetId: targetCitizenId });

    // Wait for night timer to expire (1s) and morning announcement (1s) to trigger Victory
    await new Promise(r => setTimeout(r, 2600));

    // Target citizen should be eliminated
    const victim = r1.state.players.get(targetCitizenId);
    expect(victim!.isAlive).toBe(false);

    // Remaining living: 1 Mafia, 1 Citizen -> Mafia reached parity -> Game Over!
    expect(r1.state.phase).toBe(Phase.VICTORY);
    expect(r1.state.winningTeam).toBe(WinningTeam.MAFIA);

    await r1.leave();
    await r2.leave();
    await r3.leave();
  }, 20000);

  it("eliminates Mafia when Day Voting threshold (>= 50%) is reached -> Citizens Win", async () => {
    const c1 = new ColyseusClient(SERVER_URL);
    const c2 = new ColyseusClient(SERVER_URL);
    const c3 = new ColyseusClient(SERVER_URL);

    const r1 = await c1.joinOrCreate("mafia_room", { roomCode: "VOTE1", displayName: "A" }, MafiaRoomState);
    const r2 = await c2.joinOrCreate("mafia_room", { roomCode: "VOTE1", displayName: "B" }, MafiaRoomState);
    const r3 = await c3.joinOrCreate("mafia_room", { roomCode: "VOTE1", displayName: "C" }, MafiaRoomState);

    // Host configures fast timers and dev mode
    r1.send(ClientMessageType.UPDATE_CONFIG, {
      isDevMode: true,
      nightDurationSec: 1,
      morningDurationSec: 1,
      discussionDurationSec: 3,
      votingDurationSec: 2,
      eliminationDurationSec: 1
    });

    await new Promise(r => setTimeout(r, 100));

    const rooms = [r1, r2, r3];
    let mafiaSessionId = "";
    let citizenRooms: any[] = [];

    rooms.forEach(r => {
      r.onMessage(ServerMessageType.ROLE_ASSIGNMENT, (msg) => {
        if (msg.role === Role.MAFIA) {
          mafiaSessionId = r.sessionId;
        } else if (msg.role === Role.CITIZEN) {
          citizenRooms.push(r);
        }
      });
    });

    r1.send(ClientMessageType.START_GAME);

    // Advance to day
    await new Promise(r => setTimeout(r, 3400));


    expect(r1.state.phase).toBe(Phase.DAY_DISCUSSION);

    // 2 Citizens cast votes for the Mafia player (2 / 3 = 66.6% >= 50% threshold)
    citizenRooms[0].send(ClientMessageType.CAST_VOTE, { targetId: mafiaSessionId });
    citizenRooms[1].send(ClientMessageType.CAST_VOTE, { targetId: mafiaSessionId });

    // Wait for voting timer (2s) and elimination announcement (1s)
    await new Promise(r => setTimeout(r, 4500));


    // Mafia player should be dead
    const mafiaPlayer = r1.state.players.get(mafiaSessionId);
    expect(mafiaPlayer!.isAlive).toBe(false);

    // All Mafia eliminated -> Citizens Win!
    expect(r1.state.phase).toBe(Phase.VICTORY);
    expect(r1.state.winningTeam).toBe(WinningTeam.CITIZENS);

    await r1.leave();
    await r2.leave();
    await r3.leave();
  }, 20000);
});
