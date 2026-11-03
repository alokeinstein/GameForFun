import { Role } from "./types.js";

export const MIN_PLAYERS_PRODUCTION = 5;
export const MIN_PLAYERS_DEV = 3;
export const MIN_MAFIA_PERCENT = 10;
export const MAX_MAFIA_PERCENT = 30;
export const DEFAULT_MAFIA_PERCENT = 20;

export interface RoleCountResult {
  mafiaCount: number;
  citizenCount: number;
}

/**
 * Validates player count according to environment mode.
 */
export function validatePlayerCount(totalPlayers: number, isDevMode = false): void {
  const minRequired = isDevMode ? MIN_PLAYERS_DEV : MIN_PLAYERS_PRODUCTION;
  if (!Number.isInteger(totalPlayers) || totalPlayers < minRequired) {
    throw new Error(
      `Invalid player count: ${totalPlayers}. Minimum required is ${minRequired} (${isDevMode ? "dev mode" : "production"}).`
    );
  }
}

/**
 * Validates Mafia percentage within permitted bounds (10% to 30%).
 */
export function validateMafiaPercentage(percentage: number): void {
  if (
    typeof percentage !== "number" ||
    isNaN(percentage) ||
    percentage < MIN_MAFIA_PERCENT ||
    percentage > MAX_MAFIA_PERCENT
  ) {
    throw new Error(
      `Invalid Mafia percentage: ${percentage}%. Must be between ${MIN_MAFIA_PERCENT}% and ${MAX_MAFIA_PERCENT}%.`
    );
  }
}

/**
 * Calculates authoritative Mafia and Citizen counts.
 * Formula: floor(totalPlayers * mafiaPercentage / 100)
 * Constraints:
 *  - At least 1 Mafia.
 *  - At least 1 Citizen.
 *  - Mafia count cannot exceed floor(totalPlayers * 0.30) in standard games (with min 1 exception).
 */
export function calculateRoleCounts(
  totalPlayers: number,
  mafiaPercentage: number = DEFAULT_MAFIA_PERCENT,
  isDevMode = false
): RoleCountResult {
  validatePlayerCount(totalPlayers, isDevMode);
  validateMafiaPercentage(mafiaPercentage);

  const rawMafia = Math.floor((totalPlayers * mafiaPercentage) / 100);
  // Apply minimum-one-Mafia exception
  let mafiaCount = Math.max(1, rawMafia);

  // Guarantee at least one Citizen remains
  if (mafiaCount >= totalPlayers) {
    mafiaCount = totalPlayers - 1;
  }

  // Ensure percentage does not exceed 30% unless forced by the minimum-one-Mafia rule on small counts
  const maxAllowedByPercent = Math.max(1, Math.floor((totalPlayers * MAX_MAFIA_PERCENT) / 100));
  if (mafiaCount > maxAllowedByPercent) {
    mafiaCount = maxAllowedByPercent;
  }

  const citizenCount = totalPlayers - mafiaCount;

  return {
    mafiaCount,
    citizenCount
  };
}

/**
 * Cryptographically secure Fisher-Yates array shuffle.
 * Uses global crypto API (supported in Node.js >= 19 and modern browsers).
 */
export function secureShuffle<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    // Generate secure random integer in range [0, i]
    const randomBuffer = new Uint32Array(1);
    globalThis.crypto.getRandomValues(randomBuffer);
    const j = randomBuffer[0] % (i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Distributes roles cryptographically to player IDs.
 * Returns a Map of playerId -> Role.
 * Host and join order have no influence on role assignment.
 */
export function distributeRoles(
  playerIds: string[],
  mafiaPercentage: number = DEFAULT_MAFIA_PERCENT,
  isDevMode = false
): Map<string, Role> {
  const total = playerIds.length;
  const { mafiaCount, citizenCount } = calculateRoleCounts(total, mafiaPercentage, isDevMode);

  // Prepare role pool
  const rolePool: Role[] = [
    ...Array(mafiaCount).fill(Role.MAFIA),
    ...Array(citizenCount).fill(Role.CITIZEN)
  ];

  // Cryptographically shuffle the pool
  const shuffledRoles = secureShuffle(rolePool);

  // Also shuffle player order to eliminate any positional bias
  const shuffledPlayerIds = secureShuffle(playerIds);

  const roleMap = new Map<string, Role>();
  for (let i = 0; i < shuffledPlayerIds.length; i++) {
    roleMap.set(shuffledPlayerIds[i], shuffledRoles[i]);
  }

  return roleMap;
}
