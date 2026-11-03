import { describe, it, expect } from "vitest";
import { countNightMafiaVotes } from "../src/night.js";

describe("Mafia Night Voting & Target Selection Rules", () => {
  const livingMafia = ["m1", "m2", "m3"];
  const eligibleCitizens = ["c1", "c2", "c3", "c4"];

  it("selects clear plurality candidate for night kill", () => {
    const ballots: Record<string, string> = {
      m1: "c2",
      m2: "c2",
      m3: "c1"
    };

    const result = countNightMafiaVotes({
      ballots,
      livingMafiaIds: livingMafia,
      eligibleTargetIds: eligibleCitizens
    });

    expect(result.victimId).toBe("c2");
    expect(result.highestVotes).toBe(2);
    expect(result.isTie).toBe(false);
  });

  it("results in nobody dying when highest votes are tied (no random tie-breaker)", () => {
    // 2 Mafia members, 1 votes for c1, 1 votes for c2
    const ballots: Record<string, string> = {
      m1: "c1",
      m2: "c2"
    };

    const result = countNightMafiaVotes({
      ballots,
      livingMafiaIds: ["m1", "m2"],
      eligibleTargetIds: eligibleCitizens
    });

    expect(result.victimId).toBeNull();
    expect(result.isTie).toBe(true);
    expect(result.tiedCandidateIds).toEqual(expect.arrayContaining(["c1", "c2"]));
  });

  it("results in nobody dying when zero votes are submitted", () => {
    const ballots: Record<string, string> = {};

    const result = countNightMafiaVotes({
      ballots,
      livingMafiaIds: livingMafia,
      eligibleTargetIds: eligibleCitizens
    });

    expect(result.victimId).toBeNull();
    expect(result.totalVotesCast).toBe(0);
    expect(result.isTie).toBe(false);
  });

  it("ignores ballots from non-mafia or dead players", () => {
    const ballots: Record<string, string> = {
      m1: "c1",
      imposter_citizen: "c2", // Citizen trying to forge a night kill
      dead_mafia_m4: "c2"      // Eliminated mafia member
    };

    const result = countNightMafiaVotes({
      ballots,
      livingMafiaIds: ["m1"],
      eligibleTargetIds: eligibleCitizens
    });

    expect(result.victimId).toBe("c1");
    expect(result.highestVotes).toBe(1);
    expect(result.candidateVotes["c2"]).toBe(0);
  });

  it("ignores targets that are not eligible living citizens", () => {
    const ballots: Record<string, string> = {
      m1: "m2", // Mafia trying to kill fellow mafia member
      m2: "m2"
    };

    const result = countNightMafiaVotes({
      ballots,
      livingMafiaIds: ["m1", "m2"],
      eligibleTargetIds: eligibleCitizens
    });

    expect(result.victimId).toBeNull();
    expect(result.totalVotesCast).toBe(0);
  });
});
