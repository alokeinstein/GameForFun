import { VictoryResult, WinningTeam } from "./types.js";

/**
 * Authoritatively evaluates victory conditions.
 *
 * Citizen Victory Condition:
 *  - All Mafia members have been eliminated (livingMafiaCount === 0).
 *
 * Mafia Victory Condition:
 *  - Living Mafia count is greater than or equal to living Citizen count.
 *  - (livingMafiaCount >= livingCitizenCount && livingMafiaCount > 0).
 *
 * Ongoing:
 *  - livingMafiaCount > 0 && livingMafiaCount < livingCitizenCount.
 */
export function checkVictory(
  livingMafiaCount: number,
  livingCitizenCount: number
): VictoryResult {
  if (livingMafiaCount < 0 || livingCitizenCount < 0) {
    throw new Error(`Invalid player counts: Mafia=${livingMafiaCount}, Citizens=${livingCitizenCount}`);
  }

  // Citizens win if all Mafia are eliminated
  if (livingMafiaCount === 0) {
    return {
      isGameOver: true,
      winningTeam: WinningTeam.CITIZENS,
      livingMafiaCount,
      livingCitizenCount,
      reason: "All Mafia members have been eliminated."
    };
  }

  // Mafia wins when reaching parity or majority over Citizens
  if (livingMafiaCount >= livingCitizenCount) {
    return {
      isGameOver: true,
      winningTeam: WinningTeam.MAFIA,
      livingMafiaCount,
      livingCitizenCount,
      reason: `Mafia reached parity (${livingMafiaCount} Mafia vs ${livingCitizenCount} Citizens).`
    };
  }

  // Game continues
  return {
    isGameOver: false,
    winningTeam: null,
    livingMafiaCount,
    livingCitizenCount
  };
}
