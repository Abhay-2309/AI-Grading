// Computes an account "return credit score" — modeled on a CIBIL-style
// 300-900 credit score, but scored against return behavior instead of debt
// repayment. Two real, stored/queried inputs:
//   totalOrdersPlaced — lifetime order count stored on the Profile
//   totalReturns      — count of that customer's Return rows that were
//                       actually submitted (status != 'Pending')
//   totalDisagreements — sum of disagreementCount across those returns
//                        (agent/AI grade conflicts — a fraud/misrepresentation signal)
const BASE_SCORE = 900;
const MIN_SCORE = 300;
const MAX_SCORE = 900;
const RETURN_RATE_WEIGHT = 500;
const DISAGREEMENT_WEIGHT = 15;

export function computeCreditScore({ totalOrdersPlaced, totalReturns, totalDisagreements }) {
  const returnRate = totalOrdersPlaced > 0 ? totalReturns / totalOrdersPlaced : 0;
  const raw = BASE_SCORE - returnRate * RETURN_RATE_WEIGHT - totalDisagreements * DISAGREEMENT_WEIGHT;
  const score = Math.max(MIN_SCORE, Math.min(MAX_SCORE, Math.round(raw)));

  let tier;
  let rewardCredits = 0;
  if (score >= 750) {
    tier = 'Baseline';
    rewardCredits = 100;
  } else if (score >= 650) {
    tier = 'Elevated';
    rewardCredits = 25;
  } else if (score >= 500) {
    tier = 'Moderate Risk';
    rewardCredits = 0;
  } else {
    tier = 'Critical Risk';
    rewardCredits = 0;
  }

  return { returnRate, score, tier, rewardCredits };
}
