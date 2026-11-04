import { Schema, type, MapSchema } from "@colyseus/schema";
import { Phase } from "@mafia/game-rules";
import { PlayerState } from "./PlayerState.js";
import { GameConfigState } from "./GameConfigState.js";

export class MafiaRoomState extends Schema {
  @type("string") gameMode: string = "MAFIA";
  @type("string") roomCode: string = "";
  @type("string") phase: string = Phase.WAITING_FOR_PLAYERS;
  @type("number") phaseStartedAt: number = 0;
  @type("number") phaseEndsAt: number = 0;
  @type("number") roundNumber: number = 1;
  @type("string") hostId: string = "";
  @type(GameConfigState) config: GameConfigState = new GameConfigState();
  @type({ map: PlayerState }) players = new MapSchema<PlayerState>();
  @type("string") winningTeam: string = "";
}

