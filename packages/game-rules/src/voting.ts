import { VoteTallyResult } from "./types.js";

/**
 * Calculates the exact minimum integer votes required to achieve >= 50% of eligible voters.
 * Examples:
 *  10 voters -> ceil(5.0) = 5
 *  8 voters  -> ceil(4.0) = 4
 *  7 voters  -> ceil(3.5) = 4
 *  6 voters  -> ceil(3.0) = 3
 */
export function calculateVotingThreshold(eligibleLivingVoterCount: number): number {
  if (eligibleLivingVoterCount <= 0) return 0;
  return Math.ceil(eligibleLivingVoterCount * 0.5);
}

export interface CountVotesOptions {
  /** Map of voterId -> targetCandidateId */
  ballots: Record<string, string>;
  /** Complete list of living players who are eligible to vote */
  eligibleVoterIds: string[];
  /** Valid candidates who can receive votes */
  eligibleCandidateIds: string[];
}

/**
 * Authoritatively tallies public voting ballots.
 * - Enforces voter eligibility.
 * - Enforces candidate eligibility.
 * - Computes the 50% threshold based on total eligible living voters (not just submitted ballots).
 * - Identifies ties for the leading vote count.
 */
export function countPublicVotes(options: CountVotesOptions): VoteTallyResult {
  const { ballots, eligibleVoterIds, eligibleCandidateIds } = options;

  const eligibleVoterSet = new Set(eligibleVoterIds);
  const eligibleCandidateSet = new Set(eligibleCandidateIds);

  const candidateVotes: Record<string, number> = {};
  for (const candidateId of eligibleCandidateIds) {
    candidateVotes[candidateId] = 0;
  }

  // Count valid ballots
  for (const [voterId, targetId] of Object.entries(ballots)) {
    // Voter must be an eligible living player
    if (!eligibleVoterSet.has(voterId)) {
      continue;
    }
    // Target must be an eligible candidate
    if (!eligibleCandidateSet.has(targetId)) {
      continue;
    }

    candidateVotes[targetId] = (candidateVotes[targetId] ?? 0) + 1;
  }

  const thresholdRequired = calculateVotingThreshold(eligibleVoterIds.length);

  // Find maximum votes and candidate(s)
  let maxVotes = 0;
  let topCandidates: string[] = [];

  for (const [candidateId, count] of Object.entries(candidateVotes)) {
    if (count > maxVotes) {
      maxVotes = count;
      topCandidates = [candidateId];
    } else if (count === maxVotes && count > 0) {
      topCandidates.push(candidateId);
    }
  }

  const isTie = topCandidates.length > 1;
  const thresholdMet = !isTie && maxVotes >= thresholdRequired && topCandidates.length === 1;
  const winnerId = thresholdMet ? topCandidates[0] : null;

  return {
    winnerId,
    isTie,
    tiedCandidateIds: isTie ? topCandidates : [],
    votesReceived: maxVotes,
    thresholdRequired,
    eligibleVoterCount: eligibleVoterIds.length,
    thresholdMet,
    candidateVotes
  };
}

/**
 * Determines runoff candidates from a voting tally.
 * If there is a tie for the highest vote count (with at least 1 vote), returns the tied candidates.
 * Otherwise returns an empty array.
 */
export function resolveRunoffCandidates(tally: VoteTallyResult): string[] {
  if (tally.isTie && tally.votesReceived > 0) {
    return [...tally.tiedCandidateIds];
  }
  return [];
}

