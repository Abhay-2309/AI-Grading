import express from 'express';
import prisma from '../db.js';
import { computeCreditScore } from '../utils/creditScore.js';

const router = express.Router();

const DEFAULT_USER_ID = '00000000-0000-0000-0000-000000000001';

// Shared by GET /risk-score and POST /risk-score/claim-reward so both
// always agree on the current score/tier from live data.
async function getRiskProfile() {
  const profile = await prisma.profile.findUnique({ where: { id: DEFAULT_USER_ID } });
  if (!profile) return null;

  const [totalReturns, disagreementAgg] = await Promise.all([
    prisma.return.count({
      where: { customerId: DEFAULT_USER_ID, status: { not: 'Pending' } },
    }),
    prisma.return.aggregate({
      where: { customerId: DEFAULT_USER_ID, status: { not: 'Pending' } },
      _sum: { disagreementCount: true },
    }),
  ]);

  const totalDisagreements = disagreementAgg._sum.disagreementCount || 0;
  const { returnRate, score, tier, rewardCredits } = computeCreditScore({
    totalOrdersPlaced: profile.totalOrdersPlaced,
    totalReturns,
    totalDisagreements,
  });

  return { profile, totalReturns, totalDisagreements, returnRate, score, tier, rewardCredits };
}

// GET user profile: credits, stats, donation history
router.get('/', async (req, res) => {
  try {
    const [profile, history] = await Promise.all([
      prisma.profile.findUnique({ where: { id: DEFAULT_USER_ID } }),
      prisma.donationHistory.findMany({
        where: { userId: DEFAULT_USER_ID },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    if (!profile) return res.status(404).json({ error: 'Profile not found' });

    res.json({
      greenCredits: profile.greenCredits,
      impactStats: {
        treesPlanted: profile.treesPlanted,
        causesHelped: profile.causesHelped,
      },
      donationHistory: history.map(h => ({
        id: h.id,
        date: h.date,
        ngo: h.ngo,
        logo: h.logo,
        action: h.action,
        credits: h.credits,
        isMe: h.isMe,
      })),
    });
  } catch (err) {
    console.error('GET /profile error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET most recent previous purchase in a category (e.g. "SHOES") — powers
// "Use my previous size" in the Shoe Size Finder.
router.get('/purchase-history/previous', async (req, res) => {
  try {
    const { category } = req.query;
    if (!category) return res.status(400).json({ error: 'category query param is required' });

    const previous = await prisma.purchaseHistory.findFirst({
      where: { userId: DEFAULT_USER_ID, category: { equals: category, mode: 'insensitive' } },
      orderBy: { purchasedAt: 'desc' },
    });

    if (!previous) return res.json({ found: false });

    res.json({
      found: true,
      itemName: previous.itemName,
      sizeSystem: previous.sizeSystem,
      size: previous.size,
      width: previous.width,
      purchasedAt: previous.purchasedAt,
    });
  } catch (err) {
    console.error('GET /profile/purchase-history/previous error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET the real account risk/credit-score profile — total orders vs actual
// returns, disagreement history, computed score/tier, and whether a green
// credit reward is currently claimable for the tier.
router.get('/risk-score', async (req, res) => {
  try {
    const risk = await getRiskProfile();
    if (!risk) return res.status(404).json({ error: 'Profile not found' });
    const { profile, totalReturns, totalDisagreements, returnRate, score, tier, rewardCredits } = risk;

    const alreadyClaimed = rewardCredits > 0
      ? Boolean(await prisma.donationHistory.findFirst({
          where: { userId: DEFAULT_USER_ID, action: `Risk Score Reward (${tier})` },
        }))
      : false;

    res.json({
      totalOrdersPlaced: profile.totalOrdersPlaced,
      totalReturns,
      totalDisagreements,
      returnRate,
      score,
      tier,
      rewardCredits,
      rewardClaimable: rewardCredits > 0 && !alreadyClaimed,
      greenCredits: profile.greenCredits,
    });
  } catch (err) {
    console.error('GET /profile/risk-score error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST claim the green-credit reward for the customer's current risk tier
// (once per tier reached — re-claiming the same tier again is a no-op).
router.post('/risk-score/claim-reward', async (req, res) => {
  try {
    const risk = await getRiskProfile();
    if (!risk) return res.status(404).json({ error: 'Profile not found' });
    const { tier, rewardCredits } = risk;

    if (rewardCredits <= 0) {
      return res.status(400).json({ error: `No reward available at the ${tier} tier.` });
    }

    const alreadyClaimed = await prisma.donationHistory.findFirst({
      where: { userId: DEFAULT_USER_ID, action: `Risk Score Reward (${tier})` },
    });
    if (alreadyClaimed) {
      return res.status(400).json({ error: `Already claimed the ${tier} tier reward.` });
    }

    const [updatedProfile] = await prisma.$transaction([
      prisma.profile.update({
        where: { id: DEFAULT_USER_ID },
        data: { greenCredits: { increment: rewardCredits } },
      }),
      prisma.donationHistory.create({
        data: {
          userId: DEFAULT_USER_ID,
          date: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
          ngo: 'Amazon Trust & Safety',
          logo: '',
          action: `Risk Score Reward (${tier})`,
          credits: rewardCredits,
          isMe: true,
        },
      }),
    ]);

    res.json({ greenCredits: updatedProfile.greenCredits, rewardCredits, tier });
  } catch (err) {
    console.error('POST /profile/risk-score/claim-reward error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET leaderboard
router.get('/leaderboard', async (req, res) => {
  try {
    const entries = await prisma.leaderboard.findMany({ orderBy: { rank: 'asc' } });
    res.json(entries.map(e => ({
      rank: e.rank,
      name: e.name,
      verifiedCount: e.verifiedCount,
      accuracy: e.accuracy,
      avgSpeed: e.avgSpeed,
      score: e.score,
    })));
  } catch (err) {
    console.error('GET /profile/leaderboard error:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
