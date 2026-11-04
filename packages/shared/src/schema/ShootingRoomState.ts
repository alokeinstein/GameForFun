import { Schema, type, MapSchema } from "@colyseus/schema";
import { ShootingPlayerState } from "./ShootingPlayerState.js";
import { ShootingTeamState } from "./ShootingTeamState.js";
import { ShootingConfigState } from "./ShootingConfigState.js";

export class ShootingRoomState extends Schema {
  @type("string") gameMode: string = "SHOOTING";
  @type("string") roomCode: string = "";
  @type("string") status: string = "LOBBY"; // "LOBBY" | "ACTIVE" | "MATCH_OVER"
  @type("string") hostId: string = "";
  @type("number") phaseStartedAt: number = 0;
  @type("number") phaseEndsAt: number = 0;
  @type("string") winningTeamId: string = "";

  @type(ShootingConfigState) config: ShootingConfigState = new ShootingConfigState();
  @type({ map: ShootingTeamState }) teams = new MapSchema<ShootingTeamState>();
  @type({ map: ShootingPlayerState }) players = new MapSchema<ShootingPlayerState>();
}

