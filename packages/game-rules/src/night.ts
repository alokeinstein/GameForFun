import { NightKillResult } from "./types.js";

export interface CountNightVotesOptions {
  /** Map of mafiaVoterId -> targetCitizenId */
  ballots: Record<string, string>;
  /** Complete list of living Mafia member IDs */
  livingMafiaIds: string[];
  /** Complete list of living Citizen target IDs */
  eligibleTargetIds: string[];
}

/**
 * Authoritatively tallies Mafia night selections.
 * Rules:
 *  - Only living Mafia can submit selections.
 *  - Targets must be eligible living Citizens.
 *  - Strict plurality: Candidate with strictly highest vote count is killed.
 *  - If tied for highest votes: Nobody dies (victimId = null).
 *  - If zero votes cast: Nobody dies (victimId = null).
 *  - No random tie-breaker, no host override.
 */
export function countNightMafiaVotes(options: CountNightVotesOptions): NightKillResult {
  const { ballots, livingMafiaIds, eligibleTargetIds } = options;

  const livingMafiaSet = new Set(livingMafiaIds);
  const eligibleTargetSet = new Set(eligibleTargetIds);

  const candidateVotes: Record<string, number> = {};
  for (const targetId of eligibleTargetIds) {
    candidateVotes[targetId] = 0;
  }

  let totalVotesCast = 0;

  for (const [voterId, targetId] of Object.entries(ballots)) {
    // Voter must be living Mafia
    if (!livingMafiaSet.has(voterId)) {
      continue;
    }
    // Target must be an eligible living Citizen
    if (!eligibleTargetSet.has(targetId)) {
      continue;
    }

    candidateVotes[targetId] = (candidateVotes[targetId] ?? 0) + 1;
    totalVotesCast++;
  }

  // If no valid votes were cast, nobody dies
  if (totalVotesCast === 0) {
    return {
      victimId: null,
      isTie: false,
      tiedCandidateIds: [],
      highestVotes: 0,
      candidateVotes,
      totalVotesCast: 0
    };
  }

  let maxVotes = 0;
  let topTargets: string[] = [];

  for (const [targetId, count] of Object.entries(candidateVotes)) {
    if (count > maxVotes) {
      maxVotes = count;
      topTargets = [targetId];
    } else if (count === maxVotes && count > 0) {
      topTargets.push(targetId);
    }
  }

  const isTie = topTargets.length > 1;
  const victimId = !isTie && topTargets.length === 1 ? topTargets[0] : null;

  return {
    victimId,
    isTie,
    tiedCandidateIds: isTie ? topTargets : [],
    highestVotes: maxVotes,
    candidateVotes,
    totalVotesCast
  };
}
