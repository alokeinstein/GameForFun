import { Phase, VoteTallyResult } from "./types.js";

/**
 * Valid state transitions table.
 */
const VALID_TRANSITIONS: Record<Phase, Phase[]> = {
  [Phase.WAITING_FOR_PLAYERS]: [Phase.ROLE_ASSIGNMENT],
  [Phase.ROLE_ASSIGNMENT]: [Phase.NIGHT],
  [Phase.NIGHT]: [Phase.MORNING_ANNOUNCEMENT],
  [Phase.MORNING_ANNOUNCEMENT]: [Phase.DAY_DISCUSSION, Phase.VICTORY],
  [Phase.DAY_DISCUSSION]: [
    Phase.ELIMINATION_ANNOUNCEMENT, // Someone reached >= 50% in unified day vote
    Phase.REVOTING,                 // Tied top candidates
    Phase.NIGHT,                    // Leading candidate < 50%
    Phase.DAY_VOTING                // Legacy transition
  ],
  [Phase.DAY_VOTING]: [
    Phase.ELIMINATION_ANNOUNCEMENT, // Someone reached >= 50%
    Phase.REVOTING,                 // Highest votes tied
    Phase.NIGHT                     // Leading candidate < 50% (Direct to night, no false elimination)
  ],
  [Phase.REVOTING]: [
    Phase.ELIMINATION_ANNOUNCEMENT, // Someone reached >= 50% in runoff
    Phase.REVOTING,                 // Runoff still tied and revotes remaining
    Phase.NIGHT                     // Runoff failed or max revotes exceeded (Direct to night)
  ],
  [Phase.ELIMINATION_ANNOUNCEMENT]: [Phase.NIGHT, Phase.VICTORY],
  [Phase.VICTORY]: [Phase.GAME_OVER, Phase.WAITING_FOR_PLAYERS],
  [Phase.GAME_OVER]: [Phase.WAITING_FOR_PLAYERS]
};

/**
 * Validates whether transitioning from `currentPhase` to `nextPhase` is legal.
 */
export function isValidPhaseTransition(currentPhase: Phase, nextPhase: Phase): boolean {
  const allowed = VALID_TRANSITIONS[currentPhase];
  return allowed ? allowed.includes(nextPhase) : false;
}

/**
 * Resolves the next phase following Day Voting based on authoritative tally.
 * Architectural Correction #2:
 *  - If candidate meets threshold -> ELIMINATION_ANNOUNCEMENT
 *  - If tied for top votes and revotes remaining -> REVOTING
 *  - If no candidate reaches 50% and no tie -> NIGHT (Direct transition, no elimination announcement)
 */
export function getNextPhaseAfterDayVote(
  tally: VoteTallyResult,
  currentRevoteCount: number = 0,
  maxRevotes: number = 1
): Phase {
  if (tally.thresholdMet && tally.winnerId) {
    return Phase.ELIMINATION_ANNOUNCEMENT;
  }

  if (tally.isTie && tally.votesReceived > 0 && currentRevoteCount < maxRevotes) {
    return Phase.REVOTING;
  }

  // Nobody reached 50%, proceed directly to night without elimination
  return Phase.NIGHT;
}

/**
 * Resolves the next phase following a Runoff Revote.
 */
export function getNextPhaseAfterRevote(
  tally: VoteTallyResult,
  currentRevoteCount: number,
  maxRevotes: number = 1
): Phase {
  if (tally.thresholdMet && tally.winnerId) {
    return Phase.ELIMINATION_ANNOUNCEMENT;
  }

  if (tally.isTie && tally.votesReceived > 0 && currentRevoteCount < maxRevotes) {
    return Phase.REVOTING;
  }

  // Revote failed to achieve >= 50%; proceed to night
  return Phase.NIGHT;
}

