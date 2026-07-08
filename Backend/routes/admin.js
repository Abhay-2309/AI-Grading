import express from 'express';
import prisma from '../db.js';

const router = express.Router();

/**
 * POST /api/admin/resolve-fraud/:returnId
 *
 * Body: { "decision": "APPROVE" | "CONFIRM_FRAUD" }
 *
 * APPROVE       → refundStatus = "APPROVED", fraudFlagReason cleared,
 *                 aiRequiresHumanReview reset to false
 * CONFIRM_FRAUD → refundStatus = "DENIED_FRAUD",
 *                 Profile.isBanned = true for the return's owner
 *
 * In a production system this route would be guarded by an admin-role JWT
 * check.  For the hackathon demo the caller is trusted.
 */
router.post('/resolve-fraud/:returnId', async (req, res) => {
  const { returnId } = req.params;
  const { decision } = req.body;

  if (!decision || !['APPROVE', 'CONFIRM_FRAUD'].includes(decision)) {
    return res.status(400).json({
      error: "Invalid decision. Must be 'APPROVE' or 'CONFIRM_FRAUD'.",
    });
  }

  try {
    // 1. Fetch the return (and its owner) in one query
    const existingReturn = await prisma.return.findUnique({
      where: { id: returnId },
      select: { id: true, customerId: true, refundStatus: true },
    });

    if (!existingReturn) {
      return res.status(404).json({ error: 'Return not found.' });
    }

    if (decision === 'APPROVE') {
      // ── APPROVE path ───────────────────────────────────────────────
      // Clear the fraud hold, approve the refund, and unblock the return
      // from the human-review queue so the standard grading flow resumes.
      const updated = await prisma.return.update({
        where: { id: returnId },
        data: {
          refundStatus: 'APPROVED',
          fraudFlagReason: null,
          aiRequiresHumanReview: false,
          status: 'Approved',
        },
      });

      return res.json({
        message: 'Return approved. Refund hold released.',
        returnId: updated.id,
        refundStatus: updated.refundStatus,
      });
    }

    if (decision === 'CONFIRM_FRAUD') {
      // ── CONFIRM_FRAUD path ─────────────────────────────────────────
      // 1. Deny the return's refund
      const [updatedReturn] = await prisma.$transaction([
        prisma.return.update({
          where: { id: returnId },
          data: { refundStatus: 'DENIED_FRAUD', status: 'Rejected' },
        }),
        // 2. Ban the account that submitted the fraudulent return
        ...(existingReturn.customerId
          ? [
              prisma.profile.update({
                where: { id: existingReturn.customerId },
                data: { isBanned: true },
              }),
            ]
          : []),
      ]);

      console.warn(
        `[FraudBan] Return ${returnId} confirmed as fraud. ` +
          `User ${existingReturn.customerId ?? 'unknown'} has been banned.`
      );

      return res.json({
        message: 'Fraud confirmed. Refund denied and account suspended.',
        returnId: updatedReturn.id,
        refundStatus: updatedReturn.refundStatus,
        bannedUserId: existingReturn.customerId ?? null,
      });
    }
  } catch (err) {
    console.error('POST /api/admin/resolve-fraud/:returnId error:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/admin/flagged-returns
 *
 * Returns all returns currently in HELD_FOR_REVIEW state so the admin
 * dashboard can display a pending fraud queue.
 */
router.get('/flagged-returns', async (req, res) => {
  try {
    const flagged = await prisma.return.findMany({
      where: { refundStatus: 'HELD_FOR_REVIEW' },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        customerId: true,
        customerName: true,
        itemName: true,
        category: true,
        price: true,
        refundStatus: true,
        fraudFlagReason: true,
        aiRequiresHumanReview: true,
        createdAt: true,
      },
    });

    res.json(
      flagged.map((r) => ({ ...r, price: Number(r.price) }))
    );
  } catch (err) {
    console.error('GET /api/admin/flagged-returns error:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
