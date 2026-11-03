import { ReconnectionSession } from "./types.js";

export const DEFAULT_RECONNECT_GRACE_SEC = 60;

/**
 * Creates a reconnection session token for a disconnecting player.
 */
export function createReconnectionSession(
  playerId: string,
  gracePeriodSec: number = DEFAULT_RECONNECT_GRACE_SEC,
  now: number = Date.now()
): ReconnectionSession {
  // Generate cryptographically secure token
  const randomBytes = new Uint8Array(16);
  globalThis.crypto.getRandomValues(randomBytes);
  const token = Array.from(randomBytes)
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");

  return {
    playerId,
    token,
    disconnectedAt: now,
    gracePeriodSec
  };
}

/**
 * Validates whether a provided reconnection token is authentic and still within the 60s grace window.
 */
export function validateReconnection(
  session: ReconnectionSession | null | undefined,
  providedToken: string,
  now: number = Date.now()
): { isValid: boolean; reason?: string } {
  if (!session) {
    return { isValid: false, reason: "No active disconnection session found." };
  }

  if (!providedToken || session.token !== providedToken) {
    return { isValid: false, reason: "Invalid reconnection token." };
  }

  const elapsedSec = (now - session.disconnectedAt) / 1000;
  if (elapsedSec > session.gracePeriodSec) {
    return {
      isValid: false,
      reason: `Reconnection window expired (${Math.round(elapsedSec)}s > ${session.gracePeriodSec}s).`
    };
  }

  return { isValid: true };
}
