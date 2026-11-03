import { prisma } from "@mafia/database";
import { Role, WinningTeam } from "@mafia/game-rules";

export interface MatchParticipantSummary {
  sessionId: string;
  displayName: string;
  role: Role;
  isAlive: boolean;
  eliminationCause?: "NIGHT_KILL" | "VOTED_OUT" | "DISCONNECTED" | null;
  eliminatedRound?: number | null;
}

export interface MatchEventSummary {
  roundNumber: number;
  eventType: string;
  publicDetails: string;
}

export interface MatchSummaryPayload {
  roomCode: string;
  hostSessionId: string;
  winningTeam: WinningTeam;
  startedAt: number;
  endedAt: number;
  totalRounds: number;
  config: Record<string, any>;
  participants: MatchParticipantSummary[];
  events?: MatchEventSummary[];
}

/**
 * Persist match outcomes and career player statistics to PostgreSQL via Prisma
 */
export async function recordCompletedMatch(
  summary: MatchSummaryPayload
): Promise<{ success: boolean; sessionId?: string; error?: string }> {
  if (!process.env.DATABASE_URL) {
    return { success: false, error: "DATABASE_URL not configured" };
  }

  try {
    const winnerEnum =
      summary.winningTeam === WinningTeam.MAFIA
        ? ("MAFIA_VICTORY" as const)
        : summary.winningTeam === WinningTeam.CITIZENS
        ? ("CITIZEN_VICTORY" as const)
        : ("ABANDONED" as const);

    const userMap = new Map<string, string>();

    // 1. Upsert users and career player statistics for each participant
    for (const p of summary.participants) {
      const cleanName = p.displayName.trim();
      if (!cleanName) continue;

      try {
        const user = await prisma.user.upsert({
          where: { username: cleanName },
          update: {},
          create: { username: cleanName }
        });

        userMap.set(cleanName, user.id);

        const isWinner =
          (p.role === Role.MAFIA && summary.winningTeam === WinningTeam.MAFIA) ||
          (p.role === Role.CITIZEN && summary.winningTeam === WinningTeam.CITIZENS);

        await prisma.playerStats.upsert({
          where: { userId: user.id },
          update: {
            gamesPlayed: { increment: 1 },
            gamesWon: { increment: isWinner ? 1 : 0 },
            mafiaWins: { increment: isWinner && p.role === Role.MAFIA ? 1 : 0 },
            citizenWins: { increment: isWinner && p.role === Role.CITIZEN ? 1 : 0 },
            timesEliminated: { increment: p.isAlive ? 0 : 1 },
            timesSurvived: { increment: p.isAlive ? 1 : 0 }
          },
          create: {
            userId: user.id,
            gamesPlayed: 1,
            gamesWon: isWinner ? 1 : 0,
            mafiaWins: isWinner && p.role === Role.MAFIA ? 1 : 0,
            citizenWins: isWinner && p.role === Role.CITIZEN ? 1 : 0,
            timesEliminated: p.isAlive ? 0 : 1,
            timesSurvived: p.isAlive ? 1 : 0
          }
        });
      } catch (err: any) {
        console.warn(`[MatchArchival] Could not upsert stats for ${cleanName}:`, err?.message || err);
      }
    }

    // 2. Identify Host User ID
    const hostParticipant = summary.participants.find((p) => p.sessionId === summary.hostSessionId);
    const hostUserId = hostParticipant ? userMap.get(hostParticipant.displayName.trim()) || null : null;

    // 3. Insert GameSession with Player participation records
    const session = await prisma.gameSession.create({
      data: {
        roomCode: `${summary.roomCode}_${Date.now()}`, // append timestamp for unique room code archival
        hostUserId,
        status: "COMPLETED",
        winner: winnerEnum,
        configJson: JSON.stringify(summary.config),
        playerCount: summary.participants.length,
        startedAt: new Date(summary.startedAt),
        endedAt: new Date(summary.endedAt),
        players: {
          create: summary.participants.map((p) => ({
            displayName: p.displayName.trim(),
            role: p.role === Role.MAFIA ? "MAFIA" : "CITIZEN",
            survived: p.isAlive,
            eliminationCause: p.eliminationCause ?? null,
            eliminatedRound: p.eliminatedRound ?? null,
            userId: userMap.get(p.displayName.trim()) || null
          }))
        },
        events: summary.events
          ? {
              create: summary.events.map((e) => ({
                roundNumber: e.roundNumber,
                eventType: e.eventType,
                publicDetails: e.publicDetails
              }))
            }
          : undefined
      }
    });

    console.log(`[MatchArchival] Successfully archived match session ${session.id} for room ${summary.roomCode}`);
    return { success: true, sessionId: session.id };
  } catch (err: any) {
    console.warn(`[MatchArchival] Failed to archive match (database may be offline or unconfigured):`, err?.message || err);
    return { success: false, error: err?.message || String(err) };
  }
}

/**
 * Fetch recent match history
 */
export async function getRecentMatchHistory(limit = 10) {
  if (!process.env.DATABASE_URL) return [];
  try {
    return await prisma.gameSession.findMany({
      where: { status: "COMPLETED" },
      orderBy: { endedAt: "desc" },
      take: Math.min(50, Math.max(1, limit)),
      include: {
        players: {
          select: {
            displayName: true,
            role: true,
            survived: true,
            eliminationCause: true
          }
        }
      }
    });
  } catch (err) {
    return [];
  }
}

/**
 * Fetch career statistics for a given username
 */
export async function getPlayerStatistics(username: string) {
  if (!process.env.DATABASE_URL) return null;
  try {
    const user = await prisma.user.findUnique({
      where: { username: username.trim() },
      include: {
        statistics: true
      }
    });
    return user?.statistics || null;
  } catch (err) {
    return null;
  }
}

/**
 * Fetch top players by games won
 */
export async function getLeaderboard(limit = 10) {
  if (!process.env.DATABASE_URL) return [];
  try {
    const stats = await prisma.playerStats.findMany({
      orderBy: { gamesWon: "desc" },
      take: Math.min(50, Math.max(1, limit)),
      include: {
        user: {
          select: { username: true }
        }
      }
    });

    return stats.map((s, idx) => ({
      rank: idx + 1,
      username: s.user.username,
      gamesPlayed: s.gamesPlayed,
      gamesWon: s.gamesWon,
      winRate: s.gamesPlayed > 0 ? Math.round((s.gamesWon / s.gamesPlayed) * 100) : 0,
      mafiaWins: s.mafiaWins,
      citizenWins: s.citizenWins,
      timesSurvived: s.timesSurvived
    }));
  } catch (err) {
    return [];
  }
}
