import { describe, it, expect } from "vitest";
import {
  Phase,
  isValidPhaseTransition,
  getNextPhaseAfterDayVote,
  getNextPhaseAfterRevote,
  VoteTallyResult
} from "../src/index.js";

describe("State Machine & Transition Rules", () => {
  it("allows legal phase progressions", () => {
    expect(isValidPhaseTransition(Phase.WAITING_FOR_PLAYERS, Phase.ROLE_ASSIGNMENT)).toBe(true);
    expect(isValidPhaseTransition(Phase.ROLE_ASSIGNMENT, Phase.NIGHT)).toBe(true);
    expect(isValidPhaseTransition(Phase.NIGHT, Phase.MORNING_ANNOUNCEMENT)).toBe(true);
    expect(isValidPhaseTransition(Phase.MORNING_ANNOUNCEMENT, Phase.DAY_DISCUSSION)).toBe(true);
    expect(isValidPhaseTransition(Phase.DAY_DISCUSSION, Phase.DAY_VOTING)).toBe(true);
    expect(isValidPhaseTransition(Phase.DAY_VOTING, Phase.ELIMINATION_ANNOUNCEMENT)).toBe(true);
    expect(isValidPhaseTransition(Phase.DAY_VOTING, Phase.REVOTING)).toBe(true);
    expect(isValidPhaseTransition(Phase.DAY_VOTING, Phase.NIGHT)).toBe(true); // Direct to night when < 50%
    expect(isValidPhaseTransition(Phase.REVOTING, Phase.NIGHT)).toBe(true);    // Failed revote to night
  });

  it("blocks illegal phase transitions", () => {
    expect(isValidPhaseTransition(Phase.WAITING_FOR_PLAYERS, Phase.DAY_VOTING)).toBe(false);
    expect(isValidPhaseTransition(Phase.NIGHT, Phase.DAY_VOTING)).toBe(false);
    expect(isValidPhaseTransition(Phase.DAY_DISCUSSION, Phase.ROLE_ASSIGNMENT)).toBe(false);
  });

  it("transitions to ELIMINATION_ANNOUNCEMENT when threshold is met in day voting", () => {
    const tally: VoteTallyResult = {
      winnerId: "player-3",
      isTie: false,
      tiedCandidateIds: [],
      votesReceived: 4,
      thresholdRequired: 4,
      eligibleVoterCount: 8,
      thresholdMet: true,
      candidateVotes: { "player-3": 4 }
    };

    const nextPhase = getNextPhaseAfterDayVote(tally, 0, 1);
    expect(nextPhase).toBe(Phase.ELIMINATION_ANNOUNCEMENT);
  });

  it("transitions to REVOTING when highest votes are tied", () => {
    const tally: VoteTallyResult = {
      winnerId: null,
      isTie: true,
      tiedCandidateIds: ["player-2", "player-5"],
      votesReceived: 3,
      thresholdRequired: 4,
      eligibleVoterCount: 8,
      thresholdMet: false,
      candidateVotes: { "player-2": 3, "player-5": 3 }
    };

    const nextPhase = getNextPhaseAfterDayVote(tally, 0, 1);
    expect(nextPhase).toBe(Phase.REVOTING);
  });

  it("transitions directly to NIGHT without false elimination announcement when leading candidate < 50% (Correction #2)", () => {
    const tally: VoteTallyResult = {
      winnerId: null,
      isTie: false,
      tiedCandidateIds: [],
      votesReceived: 3, // Needs 4
      thresholdRequired: 4,
      eligibleVoterCount: 8,
      thresholdMet: false,
      candidateVotes: { "player-3": 3, "player-1": 2 }
    };

    const nextPhase = getNextPhaseAfterDayVote(tally, 0, 1);
    // MUST go directly to NIGHT, not to ELIMINATION_ANNOUNCEMENT!
    expect(nextPhase).toBe(Phase.NIGHT);
  });

  it("transitions directly to NIGHT when a revote fails to produce an elimination (Correction #2)", () => {
    const runoffTally: VoteTallyResult = {
      winnerId: null,
      isTie: true,
      tiedCandidateIds: ["player-2", "player-5"],
      votesReceived: 3,
      thresholdRequired: 4,
      eligibleVoterCount: 8,
      thresholdMet: false,
      candidateVotes: { "player-2": 3, "player-5": 3 }
    };

    // If revote count reached maxRevotes (1)
    const nextPhase = getNextPhaseAfterRevote(runoffTally, 1, 1);
    expect(nextPhase).toBe(Phase.NIGHT);
  });
});
