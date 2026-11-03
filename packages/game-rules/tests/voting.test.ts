import { describe, it, expect } from "vitest";
import {
  calculateVotingThreshold,
  countPublicVotes,
  resolveRunoffCandidates
} from "../src/voting.js";

describe("Public Voting & 50% Threshold Rules", () => {
  it("calculates exact voting threshold for even and odd player counts", () => {
    expect(calculateVotingThreshold(10)).toBe(5);
    expect(calculateVotingThreshold(8)).toBe(4);
    expect(calculateVotingThreshold(7)).toBe(4); // 7 * 0.5 = 3.5 -> 4
    expect(calculateVotingThreshold(6)).toBe(3);
    expect(calculateVotingThreshold(5)).toBe(3); // 5 * 0.5 = 2.5 -> 3
    expect(calculateVotingThreshold(3)).toBe(2); // 3 * 0.5 = 1.5 -> 2
  });

  it("eliminates candidate with exactly 50% of eligible living players (8 players, 4 votes)", () => {
    const eligibleVoters = ["p1", "p2", "p3", "p4", "p5", "p6", "p7", "p8"];
    const candidates = [...eligibleVoters];

    const ballots: Record<string, string> = {
      p1: "p3",
      p2: "p3",
      p4: "p3",
      p5: "p3",
      p6: "p1",
      p7: "p2",
      p8: "p4"
      // p3 voted for p1 or abstained
    };

    const tally = countPublicVotes({
      ballots,
      eligibleVoterIds: eligibleVoters,
      eligibleCandidateIds: candidates
    });

    expect(tally.thresholdRequired).toBe(4);
    expect(tally.votesReceived).toBe(4);
    expect(tally.thresholdMet).toBe(true);
    expect(tally.winnerId).toBe("p3");
    expect(tally.isTie).toBe(false);
  });

  it("does not eliminate candidate with below 50% (8 players, 3 votes)", () => {
    const eligibleVoters = ["p1", "p2", "p3", "p4", "p5", "p6", "p7", "p8"];
    const candidates = [...eligibleVoters];

    const ballots: Record<string, string> = {
      p1: "p3",
      p2: "p3",
      p4: "p3",
      p5: "p1",
      p6: "p2",
      p7: "p4",
      p8: "p5"
    };

    const tally = countPublicVotes({
      ballots,
      eligibleVoterIds: eligibleVoters,
      eligibleCandidateIds: candidates
    });

    expect(tally.thresholdRequired).toBe(4);
    expect(tally.votesReceived).toBe(3);
    expect(tally.thresholdMet).toBe(false);
    expect(tally.winnerId).toBeNull();
  });

  it("does not lower threshold when players abstain or miss votes", () => {
    // 8 eligible voters, but 4 players abstain completely
    const eligibleVoters = ["p1", "p2", "p3", "p4", "p5", "p6", "p7", "p8"];
    const candidates = [...eligibleVoters];

    // Only 4 players vote, 3 of them vote for p3 (75% of submitted votes, but only 3/8 = 37.5% of eligible)
    const ballots: Record<string, string> = {
      p1: "p3",
      p2: "p3",
      p3: "p3",
      p4: "p1"
      // p5, p6, p7, p8 abstained
    };

    const tally = countPublicVotes({
      ballots,
      eligibleVoterIds: eligibleVoters,
      eligibleCandidateIds: candidates
    });

    expect(tally.eligibleVoterCount).toBe(8);
    expect(tally.thresholdRequired).toBe(4); // Denominator is 8, so threshold is 4
    expect(tally.votesReceived).toBe(3);
    expect(tally.thresholdMet).toBe(false);
    expect(tally.winnerId).toBeNull();
  });

  it("detects tied votes and identifies runoff candidates", () => {
    const eligibleVoters = ["p1", "p2", "p3", "p4", "p5", "p6"];
    const candidates = [...eligibleVoters];

    const ballots: Record<string, string> = {
      p1: "p2",
      p3: "p2",
      p4: "p5",
      p6: "p5"
    };

    const tally = countPublicVotes({
      ballots,
      eligibleVoterIds: eligibleVoters,
      eligibleCandidateIds: candidates
    });

    expect(tally.isTie).toBe(true);
    expect(tally.votesReceived).toBe(2);
    expect(tally.tiedCandidateIds).toEqual(expect.arrayContaining(["p2", "p5"]));
    expect(tally.thresholdMet).toBe(false);
    expect(tally.winnerId).toBeNull();

    const runoffCandidates = resolveRunoffCandidates(tally);
    expect(runoffCandidates).toHaveLength(2);
    expect(runoffCandidates).toContain("p2");
    expect(runoffCandidates).toContain("p5");
  });

  it("restricts runoff votes to tied candidates only", () => {
    const eligibleVoters = ["p1", "p2", "p3", "p4", "p5", "p6"];
    const runoffCandidates = ["p2", "p5"];

    // p1 votes for p3 (who is not in runoff -> vote discarded)
    // p3, p4, p6 vote for p2
    const ballots: Record<string, string> = {
      p1: "p3", // Invalid target in runoff
      p3: "p2",
      p4: "p2",
      p6: "p2"
    };

    const tally = countPublicVotes({
      ballots,
      eligibleVoterIds: eligibleVoters,
      eligibleCandidateIds: runoffCandidates
    });

    expect(tally.thresholdRequired).toBe(3);
    expect(tally.votesReceived).toBe(3);
    expect(tally.thresholdMet).toBe(true);
    expect(tally.winnerId).toBe("p2");
    expect(tally.candidateVotes["p3"]).toBeUndefined();
  });
});
