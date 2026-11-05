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
 * Validates an exact Mafia count constraint.
 * Requirements:
 *  - Integer >= 1
 *  - At least 1 Citizen remaining (mafiaCount < totalPlayers)
 *  - Mafia cannot exceed standard game balance ceiling (up to 40% of room).
 */
export function validateExactMafiaCount(totalPlayers: number, mafiaCount: number, isDevMode = false): void {
  validatePlayerCount(totalPlayers, isDevMode);
  if (!Number.isInteger(mafiaCount) || mafiaCount < 1) {
    throw new Error(`Invalid Mafia count: ${mafiaCount}. Must be an integer >= 1.`);
  }
  if (mafiaCount >= totalPlayers) {
    throw new Error(`Invalid Mafia count: ${mafiaCount}. At least one Citizen must remain.`);
  }
  const maxAllowed = Math.max(1, Math.floor(totalPlayers * 0.45));
  if (mafiaCount > maxAllowed) {
    throw new Error(`Mafia count ${mafiaCount} exceeds maximum game balance limit (${maxAllowed} for ${totalPlayers} players).`);
  }
}

/**
 * Calculates authoritative Mafia and Citizen counts.
 * Supports either exact count (if provided) or percentage-based calculation.
 * Formula: floor(totalPlayers * mafiaPercentage / 100)
 * Constraints:
 *  - At least 1 Mafia.
 *  - At least 1 Citizen.
 *  - Mafia count cannot exceed floor(totalPlayers * 0.30) in standard games (with min 1 exception).
 */
export function calculateRoleCounts(
  totalPlayers: number,
  mafiaPercentage: number = DEFAULT_MAFIA_PERCENT,
  isDevMode = false,
  exactMafiaCount?: number
): RoleCountResult {
  validatePlayerCount(totalPlayers, isDevMode);

  if (typeof exactMafiaCount === "number" && exactMafiaCount > 0) {
    validateExactMafiaCount(totalPlayers, exactMafiaCount, isDevMode);
    return {
      mafiaCount: exactMafiaCount,
      citizenCount: totalPlayers - exactMafiaCount
    };
  }

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
 * Validates manual host-controlled Mafia assignments.
 */
export function validateManualMafiaAssignment(
  playerIds: string[],
  selectedMafiaIds: string[],
  expectedMafiaCount: number
): void {
  if (!Array.isArray(selectedMafiaIds)) {
    throw new Error("Selected Mafia players must be an array of player IDs.");
  }
  if (selectedMafiaIds.length !== expectedMafiaCount) {
    throw new Error(
      `Manual assignment mismatch: selected ${selectedMafiaIds.length} Mafia, expected exactly ${expectedMafiaCount}.`
    );
  }
  const uniqueSelected = new Set(selectedMafiaIds);
  if (uniqueSelected.size !== selectedMafiaIds.length) {
    throw new Error("Duplicate players found in manual Mafia assignment.");
  }
  const playerSet = new Set(playerIds);
  for (const id of selectedMafiaIds) {
    if (!playerSet.has(id)) {
      throw new Error(`Selected Mafia player ID "${id}" is not connected to the room.`);
    }
  }
  if (selectedMafiaIds.length >= playerIds.length) {
    throw new Error("Manual assignment must leave at least one Citizen.");
  }
}

/**
 * Assigns roles manually based on host selection.
 * Remaining players automatically become Citizens.
 */
export function distributeRolesManual(
  playerIds: string[],
  selectedMafiaIds: string[],
  expectedMafiaCount: number
): Map<string, Role> {
  validateManualMafiaAssignment(playerIds, selectedMafiaIds, expectedMafiaCount);
  const mafiaSet = new Set(selectedMafiaIds);
  const roleMap = new Map<string, Role>();
  for (const id of playerIds) {
    if (mafiaSet.has(id)) {
      roleMap.set(id, Role.MAFIA);
    } else {
      roleMap.set(id, Role.CITIZEN);
    }
  }
  return roleMap;
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
  isDevMode = false,
  exactMafiaCount?: number
): Map<string, Role> {
  const total = playerIds.length;
  const { mafiaCount, citizenCount } = calculateRoleCounts(total, mafiaPercentage, isDevMode, exactMafiaCount);

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
