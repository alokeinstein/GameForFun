import { describe, it, expect } from "vitest";
import { checkVictory } from "../src/victory.js";
import { WinningTeam } from "../src/types.js";

describe("Victory Condition Rules", () => {
  it("declares Citizen victory when all Mafia members are eliminated", () => {
    const result = checkVictory(0, 5);
    expect(result.isGameOver).toBe(true);
    expect(result.winningTeam).toBe(WinningTeam.CITIZENS);
  });

  it("declares Mafia victory when Mafia reach numerical parity with Citizens", () => {
    // 2 Mafia vs 2 Citizens -> Mafia reached parity
    const result = checkVictory(2, 2);
    expect(result.isGameOver).toBe(true);
    expect(result.winningTeam).toBe(WinningTeam.MAFIA);
  });

  it("declares Mafia victory when Mafia exceed Citizens", () => {
    // 3 Mafia vs 2 Citizens
    const result = checkVictory(3, 2);
    expect(result.isGameOver).toBe(true);
    expect(result.winningTeam).toBe(WinningTeam.MAFIA);
  });

  it("continues the match when Mafia are alive and outnumbered by Citizens", () => {
    // 1 Mafia vs 4 Citizens
    const result = checkVictory(1, 4);
    expect(result.isGameOver).toBe(false);
    expect(result.winningTeam).toBeNull();
  });

  it("evaluates small player counts (3-player dev mode)", () => {
    // 1 Mafia vs 2 Citizens: Match continues
    expect(checkVictory(1, 2).isGameOver).toBe(false);

    // Night kill: 1 Mafia vs 1 Citizen: Mafia parity -> Mafia wins
    const mafiaWin = checkVictory(1, 1);
    expect(mafiaWin.isGameOver).toBe(true);
    expect(mafiaWin.winningTeam).toBe(WinningTeam.MAFIA);

    // Day vote: 0 Mafia vs 2 Citizens: Citizens win
    const citizenWin = checkVictory(0, 2);
    expect(citizenWin.isGameOver).toBe(true);
    expect(citizenWin.winningTeam).toBe(WinningTeam.CITIZENS);
  });

  it("rejects negative player counts", () => {
    expect(() => checkVictory(-1, 2)).toThrow(/Invalid player counts/);
    expect(() => checkVictory(1, -2)).toThrow(/Invalid player counts/);
  });
});
