import { Schema, type } from "@colyseus/schema";
import { DEFAULT_GAME_CONFIG } from "../constants.js";

export class GameConfigState extends Schema {
  @type("number") mafiaPercentage: number = DEFAULT_GAME_CONFIG.mafiaPercentage;
  @type("number") mafiaCount: number = DEFAULT_GAME_CONFIG.mafiaCount || 0;
  @type("string") assignmentMethod: string = DEFAULT_GAME_CONFIG.assignmentMethod || "RANDOM";
  @type("number") dayDurationSec: number = DEFAULT_GAME_CONFIG.dayDurationSec || 120;
  @type("number") nightDurationSec: number = DEFAULT_GAME_CONFIG.nightDurationSec;
  @type("number") discussionDurationSec: number = DEFAULT_GAME_CONFIG.discussionDurationSec;
  @type("number") votingDurationSec: number = DEFAULT_GAME_CONFIG.votingDurationSec;
  @type("number") revoteDurationSec: number = DEFAULT_GAME_CONFIG.revoteDurationSec;
  @type("number") morningDurationSec: number = DEFAULT_GAME_CONFIG.morningDurationSec;
  @type("number") eliminationDurationSec: number = DEFAULT_GAME_CONFIG.eliminationDurationSec;
  @type("number") maxRevotes: number = DEFAULT_GAME_CONFIG.maxRevotes;
  @type("boolean") revealRoleOnDeath: boolean = DEFAULT_GAME_CONFIG.revealRoleOnDeath;
  @type("boolean") allowSelfVoting: boolean = DEFAULT_GAME_CONFIG.allowSelfVoting;
  @type("boolean") allowVoteChanging: boolean = DEFAULT_GAME_CONFIG.allowVoteChanging;
  @type("boolean") isDevMode: boolean = DEFAULT_GAME_CONFIG.isDevMode;
}

