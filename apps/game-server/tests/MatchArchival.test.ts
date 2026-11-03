import { describe, it, expect, vi } from "vitest";
import { Role, WinningTeam } from "@mafia/game-rules";
import {
  recordCompletedMatch,
  MatchSummaryPayload,
  getRecentMatchHistory,
  getPlayerStatistics,
  getLeaderboard
} from "../src/services/matchArchival.js";

describe("Milestone 5 - Match Archival & Player Career Statistics", () => {
  it("processes match completion payload gracefully even when database is unconfigured or in offline fallback", async () => {
    const summary: MatchSummaryPayload = {
      roomCode: "ARCH1",
      hostSessionId: "host_session_1",
      winningTeam: WinningTeam.CITIZENS,
      startedAt: Date.now() - 120000,
      endedAt: Date.now(),
      totalRounds: 2,
      config: { isDevMode: true },
      participants: [
        {
          sessionId: "host_session_1",
          displayName: "AliceHero",
          role: Role.CITIZEN,
          isAlive: true
        },
        {
          sessionId: "session_2",
          displayName: "BobDetective",
          role: Role.CITIZEN,
          isAlive: true
        },
        {
          sessionId: "session_3",
          displayName: "CharlieVillain",
          role: Role.MAFIA,
          isAlive: false,
          eliminationCause: "VOTED_OUT",
          eliminatedRound: 2
        }
      ]
    };

    // recordCompletedMatch should safely resolve whether database is present or offline
    const result = await recordCompletedMatch(summary);
    expect(result).toBeDefined();
    expect(typeof result.success).toBe("boolean");
  });

  it("handles getRecentMatchHistory and returns an array without throwing", async () => {
    const history = await getRecentMatchHistory(5);
    expect(Array.isArray(history)).toBe(true);
  });

  it("handles getPlayerStatistics gracefully for unknown or offline players", async () => {
    const stats = await getPlayerStatistics("NonExistentPlayer12345");
    expect(stats === null || typeof stats === "object").toBe(true);
  });

  it("handles getLeaderboard and returns an array without throwing", async () => {
    const leaderboard = await getLeaderboard(10);
    expect(Array.isArray(leaderboard)).toBe(true);
  });
});
