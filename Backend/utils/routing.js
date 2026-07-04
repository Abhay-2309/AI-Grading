// Computes the warehouse routing decision from a return's final verified
// grade. Called whenever a Return's status transitions to 'Completed'.
//
// Grade -> route (smart routing table):
//   A+ / A          -> Resale
//   B+ / B          -> Renewed
//   C               -> Donation
//   D / F           -> Liquidation
//   any real agent/AI grade disagreement -> Manual Review (overrides all above)
//   unrecognized/legacy grade format      -> Manual Review (safe default)
export function computeRouting({ userGrade, agentGrade }) {
  if (agentGrade && userGrade && agentGrade !== userGrade) {
    return 'Manual Review';
  }

  const grade = agentGrade || userGrade;

  if (grade === 'A+' || grade === 'A') return 'Resale';
  if (grade === 'B+' || grade === 'B') return 'Renewed';
  if (grade === 'C') return 'Donation';
  if (grade === 'D' || grade === 'F') return 'Liquidation';

  return 'Manual Review';
}
