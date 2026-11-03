/**
 * Core Role definitions
 */
export enum Role {
  MAFIA = "MAFIA",
  CITIZEN = "CITIZEN"
}

/**
 * Server-authoritative Game State Machine Phases
 */
export enum Phase {
  WAITING_FOR_PLAYERS = "WAITING_FOR_PLAYERS",
  ROLE_ASSIGNMENT = "ROLE_ASSIGNMENT",
  NIGHT = "NIGHT",
  MORNING_ANNOUNCEMENT = "MORNING_ANNOUNCEMENT",
  DAY_DISCUSSION = "DAY_DISCUSSION",
  DAY_VOTING = "DAY_VOTING",
  REVOTING = "REVOTING",
  ELIMINATION_ANNOUNCEMENT = "ELIMINATION_ANNOUNCEMENT",
  VICTORY = "VICTORY",
  GAME_OVER = "GAME_OVER"
}

export enum WinningTeam {
  MAFIA = "MAFIA",
  CITIZENS = "CITIZENS"
}

export enum EliminationCause {
  NIGHT_KILL = "NIGHT_KILL",
  VOTED_OUT = "VOTED_OUT",
  DISCONNECTED = "DISCONNECTED"
}

export interface GameConfig {
  mafiaPercentage: number;       // Default 20 (range 10 to 30)
  nightDurationSec: number;      // Default 30
  discussionDurationSec: number; // Default 120
  votingDurationSec: number;     // Default 30
  revoteDurationSec: number;     // Default 20
  morningDurationSec: number;    // Default 10
  eliminationDurationSec: number;// Default 8
  maxRevotes: number;            // Default 1
  revealRoleOnDeath: boolean;    // Default true
  allowSelfVoting: boolean;      // Default false
  allowVoteChanging: boolean;    // Default false
  isDevMode: boolean;            // Default false (allows 3 min players)
}

export interface PlayerSummary {
  id: string;
  displayName: string;
  isAlive: boolean;
  role?: Role;
}

export interface VoteTallyResult {
  winnerId: string | null;
  isTie: boolean;
  tiedCandidateIds: string[];
  votesReceived: number;
  thresholdRequired: number;
  eligibleVoterCount: number;
  thresholdMet: boolean;
  candidateVotes: Record<string, number>;
}

export interface NightKillResult {
  victimId: string | null;
  isTie: boolean;
  tiedCandidateIds: string[];
  highestVotes: number;
  candidateVotes: Record<string, number>;
  totalVotesCast: number;
}

export interface VictoryResult {
  isGameOver: boolean;
  winningTeam: WinningTeam | null;
  livingMafiaCount: number;
  livingCitizenCount: number;
  reason?: string;
}

export interface ReconnectionSession {
  playerId: string;
  token: string;
  disconnectedAt: number;
  gracePeriodSec: number;
}

