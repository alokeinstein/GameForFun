import { GameConfig } from "@mafia/game-rules";

export const DEFAULT_GAME_CONFIG: GameConfig = {
  mafiaPercentage: 20,
  nightDurationSec: 30,
  discussionDurationSec: 120,
  votingDurationSec: 30,
  revoteDurationSec: 20,
  morningDurationSec: 10,
  eliminationDurationSec: 8,
  maxRevotes: 1,
  revealRoleOnDeath: true,
  allowSelfVoting: false,
  allowVoteChanging: false,
  isDevMode: false
};

export const ROOM_CODE_LENGTH = 5;
export const ROOM_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // No 0, O, 1, I for readability

export const TICK_RATE_HZ = 20;
export const TICK_INTERVAL_MS = 1000 / TICK_RATE_HZ; // 50ms
