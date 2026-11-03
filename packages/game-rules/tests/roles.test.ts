import { describe, it, expect } from "vitest";
import {
  calculateRoleCounts,
  distributeRoles,
  MIN_PLAYERS_PRODUCTION,
  MIN_PLAYERS_DEV
} from "../src/roles.js";
import { Role } from "../src/types.js";

describe("Role Distribution & Count Rules", () => {
  it("calculates 10 players at 20% Mafia correctly (2 Mafia, 8 Citizens)", () => {
    const counts = calculateRoleCounts(10, 20);
    expect(counts.mafiaCount).toBe(2);
    expect(counts.citizenCount).toBe(8);
  });

  it("calculates 10 players at 30% Mafia correctly (3 Mafia, 7 Citizens)", () => {
    const counts = calculateRoleCounts(10, 30);
    expect(counts.mafiaCount).toBe(3);
    expect(counts.citizenCount).toBe(7);
  });

  it("calculates 5 players minimum production game at 20% (1 Mafia, 4 Citizens)", () => {
    const counts = calculateRoleCounts(5, 20, false);
    expect(counts.mafiaCount).toBe(1);
    expect(counts.citizenCount).toBe(4);
  });

  it("handles 3-player development game with min-1-mafia exception (1 Mafia, 2 Citizens)", () => {
    // 3 * 20 / 100 = 0.6, floor = 0, but min-one-mafia exception sets it to 1
    const counts = calculateRoleCounts(3, 20, true);
    expect(counts.mafiaCount).toBe(1);
    expect(counts.citizenCount).toBe(2);
  });

  it("rejects player counts below 5 in production mode", () => {
    expect(() => calculateRoleCounts(4, 20, false)).toThrow(/Minimum required is 5/);
    expect(() => calculateRoleCounts(3, 20, false)).toThrow(/Minimum required is 5/);
  });

  it("rejects player counts below 3 in dev mode", () => {
    expect(() => calculateRoleCounts(2, 20, true)).toThrow(/Minimum required is 3/);
  });

  it("enforces Mafia percentage boundaries (rejects < 10% and > 30%)", () => {
    expect(() => calculateRoleCounts(10, 5)).toThrow(/Must be between 10% and 30%/);
    expect(() => calculateRoleCounts(10, 35)).toThrow(/Must be between 10% and 30%/);
    expect(() => calculateRoleCounts(10, 0)).toThrow(/Must be between 10% and 30%/);
    expect(() => calculateRoleCounts(10, -10)).toThrow(/Must be between 10% and 30%/);
  });

  it("accepts valid boundary percentages 10% and 30%", () => {
    expect(() => calculateRoleCounts(10, 10)).not.toThrow();
    expect(() => calculateRoleCounts(10, 30)).not.toThrow();
  });

  it("distributes roles randomly and matches exact calculated quotas", () => {
    const playerIds = ["p1", "p2", "p3", "p4", "p5", "p6", "p7", "p8", "p9", "p10"];
    const roleMap = distributeRoles(playerIds, 20);

    expect(roleMap.size).toBe(10);

    let mafia = 0;
    let citizens = 0;
    for (const [_, role] of roleMap) {
      if (role === Role.MAFIA) mafia++;
      if (role === Role.CITIZEN) citizens++;
    }

    expect(mafia).toBe(2);
    expect(citizens).toBe(8);
  });

  it("ensures host has no predetermined role and assignment varies over multiple runs", () => {
    const playerIds = ["host", "p2", "p3", "p4", "p5", "p6", "p7", "p8", "p9", "p10"];
    const hostRoles = new Set<Role>();

    // Run 50 shuffles; the host should receive both MAFIA and CITIZEN probabilistically
    for (let i = 0; i < 50; i++) {
      const roleMap = distributeRoles(playerIds, 20);
      hostRoles.add(roleMap.get("host")!);
    }

    expect(hostRoles.has(Role.MAFIA)).toBe(true);
    expect(hostRoles.has(Role.CITIZEN)).toBe(true);
  });
});

