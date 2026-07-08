import express from 'express';
import prisma from '../db.js';
import { computeRouting } from '../utils/routing.js';
import { checkBanStatus } from '../utils/checkBanStatus.js';
import { calculateRiskScore } from '../utils/riskScoring.js';

const router = express.Router();

// Helper: format Decimal fields to number for JSON
function mapReturn(r) {
  return {
    id: r.id,
    customerId: r.customerId,
    customerName: r.customerName,
    timeWindow: r.timeWindow,
    address: r.address,
    district: r.district,
    itemName: r.itemName,
    category: r.category,
    subcategory: r.subcategory,
    price: Number(r.price),
    sku: r.sku,
    imgUrl: r.imgUrl,
    reason: r.reason,
    comments: r.comments,
    conditionAnswers: r.conditionAnswers ?? {},
    status: r.status,
    userGrade: r.userGrade,
    userConfidence: r.userConfidence,
    defects: r.defects ?? [],
    aiNotesContradict: r.aiNotesContradict ?? false,
    aiRequiresHumanReview: r.aiRequiresHumanReview ?? false,
    inspection_required: r.aiRequiresHumanReview ?? false,
    agentGrade: r.agentGrade ?? '',
    agentDefects: r.agentDefects ?? '',
    disagreementCount: r.disagreementCount,
    downgradeRate: r.downgradeRate,
    routing: r.routing,
    riskTier: r.riskTier,
    trend30d: r.trend30d,
    flagReason: r.flagReason,
    refundStatus: r.refundStatus ?? 'PENDING',
    fraudFlagReason: r.fraudFlagReason ?? null,
  };
}

// GET all returns
router.get('/', async (req, res) => {
  try {
    const returns = await prisma.return.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.json(returns.map(mapReturn));
  } catch (err) {
    console.error('GET /returns error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET single return by ID
router.get('/:id', async (req, res) => {
  try {
    const item = await prisma.return.findUnique({ where: { id: req.params.id } });
    if (!item) return res.status(404).json({ error: 'Return not found' });
    res.json(mapReturn(item));
  } catch (err) {
    console.error('GET /returns/:id error:', err);
    res.status(500).json({ error: err.message });
  }
});

// PUT update a return (agent assessment, hub resolution, etc.)
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      status, agentGrade, agentDefects, userGrade, reason,
      comments, routing, riskTier, disagreementCount,
    } = req.body;

    const existing = await prisma.return.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Return not found' });

    const nextStatus = status !== undefined ? status : existing.status;
    // Auto-compute the warehouse route once a return reaches 'Completed',
    // unless the caller explicitly supplied its own routing value.
    const autoRouting =
      routing === undefined && nextStatus === 'Completed'
        ? computeRouting({
            userGrade: userGrade !== undefined ? userGrade : existing.userGrade,
            agentGrade: agentGrade !== undefined ? agentGrade : existing.agentGrade,
            defects: existing.defects,
          })
        : undefined;

    const updated = await prisma.return.update({
      where: { id },
      data: {
        ...(status !== undefined && { status }),
        ...(agentGrade !== undefined && { agentGrade }),
        ...(agentDefects !== undefined && { agentDefects }),
        ...(userGrade !== undefined && { userGrade }),
        ...(reason !== undefined && { reason }),
        ...(comments !== undefined && { comments }),
        ...(routing !== undefined && { routing }),
        ...(autoRouting !== undefined && { routing: autoRouting }),
        ...(riskTier !== undefined && { riskTier }),
        ...(disagreementCount !== undefined && { disagreementCount }),
      },
    });

    res.json(mapReturn(updated));
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Return not found' });
    console.error('PUT /returns/:id error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST submit return from customer portal
// checkBanStatus: if the submitting user is banned they receive 403 immediately
router.post('/submit', checkBanStatus, async (req, res) => {
  try {
    const { itemId, reason, comments, subcategory, conditionAnswers } = req.body;

    const existing = await prisma.return.findUnique({ where: { id: itemId } });
    if (!existing) return res.status(404).json({ error: 'Return not found' });

    // ── Behavioral Risk Scoring ─────────────────────────────────────────────
    const ip = req.body.mockIp || req.headers['x-forwarded-for'] || req.ip || '';
    const rawIp = Array.isArray(ip) ? ip[0] : ip;
    const clientIp = rawIp.split(',')[0].trim();

    // Look up user's purchase history for order date context
    const purchase = await prisma.purchaseHistory.findFirst({
      where: {
        userId: existing.customerId,
        itemName: existing.itemName,
      },
      orderBy: { purchasedAt: 'desc' },
    });

    const orderDate = purchase ? purchase.purchasedAt : new Date(Date.now() - 15 * 24 * 60 * 60 * 1000);
    const returnDate = new Date();

    const riskScore = await calculateRiskScore(
      existing.customerId,
      clientIp,
      orderDate,
      returnDate,
      existing.address || ''
    );

    let isInspectionRequired = existing.aiRequiresHumanReview;
    let nextStatus = existing.aiRequiresHumanReview ? 'In Review' : 'Approved';
    let refundStatus = existing.refundStatus;
    let fraudFlagReason = existing.fraudFlagReason;
    let riskTier = existing.riskTier;
    let flagReason = existing.flagReason;
    let routing = existing.routing;

    if (riskScore < 30) {
      // 1. Trusted Tier
      isInspectionRequired = false;
      nextStatus = 'Approved';
      refundStatus = 'APPROVED';
      riskTier = 'Baseline';
      flagReason = `Trusted Account (Risk Score: ${riskScore})`;
    } else if (riskScore >= 70) {
      // 2. High Risk Tier - Instant Quarantine
      isInspectionRequired = true;
      nextStatus = 'In Review';
      refundStatus = 'HELD_FOR_REVIEW';
      fraudFlagReason = `High risk score (${riskScore}) calculated by Behavioral Risk engine`;
      riskTier = 'Critical Risk';
      flagReason = 'Behavioral Risk Alert';
      routing = 'Manual Review';
    } else {
      // 3. Middle Tier (30 <= riskScore < 70) - Standard AI vision routing
      isInspectionRequired = true;
      nextStatus = 'In Progress'; // standard AI pipeline status
      refundStatus = 'PENDING';
      riskTier = 'Moderate Risk';
      flagReason = `Standard Inspection Required (Risk Score: ${riskScore})`;
    }

    const updated = await prisma.return.update({
      where: { id: itemId },
      data: {
        reason,
        comments,
        status: nextStatus,
        aiRequiresHumanReview: isInspectionRequired,
        refundStatus,
        fraudFlagReason,
        riskTier,
        flagReason,
        ...(routing && { routing }),
        ...(subcategory !== undefined && { subcategory }),
        ...(conditionAnswers !== undefined && { conditionAnswers }),
      },
    });

    res.json(mapReturn(updated));
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Return not found' });
    console.error('POST /returns/submit error:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
