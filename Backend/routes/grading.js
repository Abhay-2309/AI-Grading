import express from 'express';
import multer from 'multer';
import prisma from '../db.js';
import { SUBCATEGORY_TAXONOMY } from '../config/subcategoryTaxonomy.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

const AI1_BASE_URL = process.env.AI1_BASE_URL || 'http://localhost:3000';

// Backend's Return.category values -> AI1's lowercase grading-category enum.
// Used only when there's no subcategory (or no taxonomy entry) to look up.
const CATEGORY_MAP = {
  ELECTRONICS: 'electronics',
  ACCESSORIES: 'electronics',
  APPAREL: 'apparel',
  BOOKS: 'books',
  HOME: 'home',
  TOYS: 'toys',
  SPORTS: 'sports',
};

function findSubcategoryLeaf(category, subcategory) {
  const bucket = SUBCATEGORY_TAXONOMY[(category || '').toUpperCase()];
  if (!bucket || !subcategory) return null;
  return bucket.subcategories.find((s) => s.key === subcategory) || null;
}

function mapCategory(category, subcategory) {
  const leaf = findSubcategoryLeaf(category, subcategory);
  if (leaf) return leaf.aiCategory;
  return CATEGORY_MAP[(category || '').toUpperCase()] || 'other';
}

// Serializes the customer's structured condition answers (things a photo
// can't show — battery health, powers on?, accessories included, etc.) into
// AI1's existing customerNotes field. AI1's own rules already handle this
// correctly: customer notes can add customer_reported damages, can never
// improve a grade, and get flagged if they contradict the photos.
function buildCustomerNotes(existing) {
  const leaf = findSubcategoryLeaf(existing.category, existing.subcategory);
  const answers = existing.conditionAnswers || {};
  const lines = [];

  if (leaf) {
    for (const q of leaf.conditionQuestions) {
      const val = answers[q.key];
      if (val === undefined || val === null || val === '') continue;
      if (q.type === 'boolean') {
        const shortLabel = q.key === 'powersOn' ? 'Powers on' : q.label.replace(/\?$/, '');
        lines.push(`${shortLabel}: ${val ? 'Yes' : 'No'}`);
      } else {
        lines.push(`${q.label}: ${val}`);
      }
    }
  }

  const structuredBlock = lines.length > 0 ? `Customer-reported condition details: ${lines.join('. ')}.` : '';
  // AI1's Zod schema 400s on customerNotes over 2000 chars rather than
  // truncating it — must slice here before sending, not rely on AI1.
  return [structuredBlock, existing.comments || ''].filter(Boolean).join(' ').slice(0, 2000);
}

const VIEW_FIELDS = ['front', 'back', 'left', 'right', 'top', 'bottom'];
const CLOSEUP_FIELDS = Array.from({ length: 6 }, (_, i) => `closeup_${i + 1}`);
const UPLOAD_FIELDS = [...VIEW_FIELDS, ...CLOSEUP_FIELDS].map((name) => ({ name, maxCount: 1 }));

// POST /api/grading/:returnId/submit — forwards photos + metadata to AI1's /grade
router.post('/:returnId/submit', upload.fields(UPLOAD_FIELDS), async (req, res) => {
  try {
    const { returnId } = req.params;
    const existing = await prisma.return.findUnique({ where: { id: returnId } });
    if (!existing) return res.status(404).json({ error: 'Return not found' });

    const { conditionAnswers } = req.body;
    let parsedAnswers = undefined;
    if (conditionAnswers) {
      try {
        parsedAnswers = JSON.parse(conditionAnswers);
      } catch (e) {
        // ignore
      }
    }

    if (parsedAnswers) {
      existing.conditionAnswers = parsedAnswers;
    }

    const form = new FormData();
    for (const field of [...VIEW_FIELDS, ...CLOSEUP_FIELDS]) {
      const file = req.files?.[field]?.[0];
      if (!file) continue;
      form.append(field, new Blob([file.buffer], { type: file.mimetype }), file.originalname);
    }

    form.append('customerId', returnId);
    form.append('category', mapCategory(existing.category, existing.subcategory));
    form.append('returnReason', existing.reason || req.body.returnReason || 'Not specified');
    form.append('customerNotes', buildCustomerNotes(existing));
    if (existing.sku) form.append('sku', existing.sku);
    if (conditionAnswers) {
      form.append('conditionAnswers', conditionAnswers);
    }

    const aiResponse = await fetch(`${AI1_BASE_URL}/grade`, { method: 'POST', body: form });
    const aiBody = await aiResponse.json();

    if (!aiResponse.ok) {
      return res.status(aiResponse.status).json(aiBody);
    }

    await prisma.return.update({
      where: { id: returnId },
      data: {
        aiRequestId: aiBody.requestId,
        aiStatus: aiBody.status,
        ...(parsedAnswers !== undefined && { conditionAnswers: parsedAnswers }),
      },
    });

    res.status(aiResponse.status).json(aiBody);
  } catch (err) {
    console.error('POST /grading/:returnId/submit error:', err);
    res.status(502).json({ error: 'Failed to reach AI grading service', details: err.message });
  }
});

// GET /api/grading/:returnId/status — proxies AI1's GET /status/:id
router.get('/:returnId/status', async (req, res) => {
  try {
    const { returnId } = req.params;
    const existing = await prisma.return.findUnique({ where: { id: returnId } });
    if (!existing) return res.status(404).json({ error: 'Return not found' });
    if (!existing.aiRequestId) {
      return res.status(404).json({ error: 'No grading request in progress for this return' });
    }

    const aiResponse = await fetch(`${AI1_BASE_URL}/status/${existing.aiRequestId}`);
    const aiBody = await aiResponse.json();

    if (aiResponse.ok && aiBody.status && aiBody.status !== existing.aiStatus) {
      await prisma.return.update({
        where: { id: returnId },
        data: { aiStatus: aiBody.status },
      });
    }

    res.status(aiResponse.status).json(aiBody);
  } catch (err) {
    console.error('GET /grading/:returnId/status error:', err);
    res.status(502).json({ error: 'Failed to reach AI grading service', details: err.message });
  }
});

// GET /api/grading/:returnId/result — proxies AI1's GET /result/:id and, on
// COMPLETED, summarizes the report onto the Return row for other dashboards.
router.get('/:returnId/result', async (req, res) => {
  try {
    const { returnId } = req.params;
    const existing = await prisma.return.findUnique({ where: { id: returnId } });
    if (!existing) return res.status(404).json({ error: 'Return not found' });
    if (!existing.aiRequestId) {
      return res.status(404).json({ error: 'No grading request in progress for this return' });
    }

    const aiResponse = await fetch(`${AI1_BASE_URL}/result/${existing.aiRequestId}`);
    const aiBody = await aiResponse.json();

    if (aiResponse.ok && aiBody.status === 'COMPLETED' && aiBody.report) {
      const { report } = aiBody;
      await prisma.return.update({
        where: { id: returnId },
        data: {
          aiStatus: 'COMPLETED',
          userGrade: report.grade,
          userConfidence: `${Math.round(report.overallConfidence * 100)}%`,
          // Store the full damage objects (type/view/severity/description/
          // confidence/source) rather than a stripped type+desc pair — the
          // pickup-agent full-checklist verification needs the rest.
          defects: report.damages,
          aiNotesContradict: report.notesContradictImages ?? false,
          aiRequiresHumanReview: report.requiresHumanReview ?? false,
        },
      });
    } else if (aiResponse.ok && aiBody.status === 'FAILED') {
      await prisma.return.update({
        where: { id: returnId },
        data: { aiStatus: 'FAILED' },
      });
    }

    res.status(aiResponse.status).json(aiBody);
  } catch (err) {
    console.error('GET /grading/:returnId/result error:', err);
    res.status(502).json({ error: 'Failed to reach AI grading service', details: err.message });
  }
});

export default router;
