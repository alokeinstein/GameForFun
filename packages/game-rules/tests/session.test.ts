import { describe, it, expect } from "vitest";
import {
  createReconnectionSession,
  validateReconnection,
  DEFAULT_RECONNECT_GRACE_SEC
} from "../src/session.js";

describe("Disconnection & Reconnection Session Handling", () => {
  it("creates a cryptographically strong session token and records timestamp", () => {
    const startTime = 100000;
    const session = createReconnectionSession("player-123", DEFAULT_RECONNECT_GRACE_SEC, startTime);

    expect(session.playerId).toBe("player-123");
    expect(session.token).toHaveLength(32); // 16 bytes = 32 hex chars
    expect(session.disconnectedAt).toBe(startTime);
    expect(session.gracePeriodSec).toBe(60);
  });

  it("successfully validates valid token within the 60s grace period", () => {
    const startTime = 100000;
    const session = createReconnectionSession("player-123", 60, startTime);

    // Reconnecting 30 seconds later
    const checkTime = startTime + 30 * 1000;
    const result = validateReconnection(session, session.token, checkTime);

    expect(result.isValid).toBe(true);
    expect(result.reason).toBeUndefined();
  });

  it("rejects reconnection when the 60s window has expired", () => {
    const startTime = 100000;
    const session = createReconnectionSession("player-123", 60, startTime);

    // Reconnecting 65 seconds later
    const checkTime = startTime + 65 * 1000;
    const result = validateReconnection(session, session.token, checkTime);

    expect(result.isValid).toBe(false);
    expect(result.reason).toMatch(/Reconnection window expired/);
  });

  it("rejects reconnection when token does not match", () => {
    const startTime = 100000;
    const session = createReconnectionSession("player-123", 60, startTime);

    const result = validateReconnection(session, "wrong-token-abc", startTime + 1000);

    expect(result.isValid).toBe(false);
    expect(result.reason).toBe("Invalid reconnection token.");
  });

  it("rejects reconnection when no session exists", () => {
    const result = validateReconnection(null, "some-token");

    expect(result.isValid).toBe(false);
    expect(result.reason).toMatch(/No active disconnection session/);
  });
});
