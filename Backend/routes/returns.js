import express from 'express';
import prisma from '../db.js';
import { computeRouting } from '../utils/routing.js';

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
    agentGrade: r.agentGrade ?? '',
    agentDefects: r.agentDefects ?? '',
    disagreementCount: r.disagreementCount,
    downgradeRate: r.downgradeRate,
    routing: r.routing,
    riskTier: r.riskTier,
    trend30d: r.trend30d,
    flagReason: r.flagReason,
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
router.post('/submit', async (req, res) => {
  try {
    const { itemId, reason, comments, subcategory, conditionAnswers } = req.body;

    const existing = await prisma.return.findUnique({ where: { id: itemId } });
    if (!existing) return res.status(404).json({ error: 'Return not found' });

    // Reflect the actual AI grading outcome (set by grading.js's /result
    // handler before this runs): items flagged for human review move to the
    // hub's review queue, everything else is auto-approved and awaits
    // pickup. Previously this always wrote 'Pending', so the customer's
    // order list never changed after a return was submitted and approved.
    const nextStatus = existing.aiRequiresHumanReview ? 'In Review' : 'Approved';

    // userGrade/userConfidence/defects are NOT written here — they're owned
    // solely by grading.js's /result handler, which already persists the
    // real AI grade. Overwriting them here previously clobbered that with a
    // stale placeholder.
    const updated = await prisma.return.update({
      where: { id: itemId },
      data: {
        reason,
        comments,
        status: nextStatus,
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
