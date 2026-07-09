import express from 'express';
import multer from 'multer';
import prisma from '../db.js';
import { SUBCATEGORY_TAXONOMY } from '../config/subcategoryTaxonomy.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

const AI1_BASE_URL = (process.env.AI1_BASE_URL || 'http://localhost:3000').replace(/\/$/, '');

// Backend's Return.category / P2pProduct.category values -> AI1's lowercase grading-category enum.
// Used only when there's no subcategory (or no taxonomy entry) to look up.
const CATEGORY_MAP = {
  ELECTRONICS: 'electronics',
  ACCESSORIES: 'electronics',
  APPAREL: 'apparel',
  BOOKS: 'books',
  HOME: 'home',
  TOYS: 'toys',
  SPORTS: 'sports',
  PHOTOGRAPHY: 'electronics',
  FASHION: 'apparel',
  'HOME & FURNITURE': 'home',
  'SPORTS & OUTDOORS': 'sports',
  'BOOKS & HOBBIES': 'books',
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

    const { conditionAnswers, subcategory } = req.body;
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
    // The subcategory picked earlier in the wizard never got persisted to
    // this row until now — without it, mapCategory() falls back to the
    // generic top-level category, which requires a different (broader) set
    // of views than what the photo-capture step actually asked the customer for.
    if (subcategory) {
      existing.subcategory = subcategory;
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
        ...(subcategory && { subcategory }),
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
      const isMismatch = report.itemMatchesCategory === false || report.mismatchFlag === true;
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
          aiRequiresHumanReview: (report.requiresHumanReview ?? false) || isMismatch,
          ...(isMismatch && {
            refundStatus: 'HELD_FOR_REVIEW',
            fraudFlagReason: 'Category Mismatch detected by Moondream VLM'
          })
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

const REQUIRED_VIEWS = {
  electronics: ['front', 'back', 'left', 'right', 'top', 'bottom'],
  books: ['front', 'back'],
  apparel: ['front', 'back'],
  home: ['front', 'back', 'left', 'right', 'top', 'bottom'],
  toys: ['front', 'back', 'left', 'right', 'top', 'bottom'],
  sports: ['front', 'back', 'left', 'right', 'top', 'bottom'],
  other: ['front', 'back', 'left', 'right', 'top', 'bottom'],
};

function mapGradeToCondition(grade) {
  if (!grade) return 'Good';
  const g = grade.toUpperCase();
  if (g.startsWith('A+')) return 'New (Sealed)';
  if (g.startsWith('A')) return 'Like New';
  if (g.startsWith('B')) return 'Very Good';
  if (g.startsWith('C')) return 'Good';
  if (g.startsWith('D')) return 'Acceptable';
  return 'Unsalvageable';
}

function bufferToDataUrl(buffer, mimetype) {
  return `data:${mimetype};base64,${buffer.toString('base64')}`;
}

// POST /api/grading/p2p/:productId/submit — MarketConnect's own seller
// inspection step (independent of the returns flow): accepts the seller's
// real multi-angle photos plus condition answers, persists the photos onto
// the listing (there's no image-hosting backend for P2P — the data URI *is*
// the stored image, same as the rest of this feature), and forwards
// everything to AI1's /grade exactly like a return submission does.
router.post('/p2p/:productId/submit', upload.fields(UPLOAD_FIELDS), async (req, res) => {
  try {
    const { productId } = req.params;
    const existing = await prisma.p2pProduct.findUnique({ where: { id: productId } });
    if (!existing) return res.status(404).json({ error: 'Product not found' });

    const { subcategory, conditionAnswers, extraAnswers } = req.body;

    const leaf = findSubcategoryLeaf(existing.category, subcategory);
    const aiCategory = mapCategory(existing.category, subcategory);
    const required = leaf?.requiredViews || REQUIRED_VIEWS[aiCategory] || REQUIRED_VIEWS.other;

    const missing = required.filter((view) => !req.files?.[view]?.[0]);
    if (missing.length > 0) {
      return res.status(400).json({ error: `Missing required photo(s): ${missing.join(', ')}` });
    }

    let parsedExtra;
    if (extraAnswers) {
      try {
        parsedExtra = JSON.parse(extraAnswers);
      } catch {
        // ignore malformed extra answers rather than failing the whole submission
      }
    }

    const form = new FormData();
    const photos = {};
    for (const view of required) {
      const file = req.files[view][0];
      form.append(view, new Blob([file.buffer], { type: file.mimetype }), file.originalname);
      photos[view] = bufferToDataUrl(file.buffer, file.mimetype);
    }

    // Subcategory-specific answers (powers on?, battery health, tags attached,
    // etc.) can't be scored directly — they become part of the free-text
    // customerNotes AI1's vision model reads, same as the returns flow.
    const notesSource = {
      category: existing.category,
      subcategory: subcategory || existing.subcategory,
      conditionAnswers: parsedExtra ?? existing.conditionAnswers,
      comments: existing.description,
    };

    form.append('customerId', `p2p_${productId}`);
    form.append('category', aiCategory);
    form.append('returnReason', 'P2P Sale');
    form.append('customerNotes', buildCustomerNotes(notesSource));
    // The 5-dimension generic answers (coreFunction/completeness/structure/
    // usage/originality) are AI1's own structured schema — these directly
    // drive its questionScore, unlike the free-text notes above.
    if (conditionAnswers) form.append('conditionAnswers', conditionAnswers);

    const aiResponse = await fetch(`${AI1_BASE_URL}/grade`, { method: 'POST', body: form });
    const aiBody = await aiResponse.json();

    if (!aiResponse.ok) {
      return res.status(aiResponse.status).json(aiBody);
    }

    const viewNames = Object.keys(photos);
    const primaryView = viewNames.includes('front') ? 'front' : viewNames[0];

    await prisma.p2pProduct.update({
      where: { id: productId },
      data: {
        aiRequestId: aiBody.requestId,
        aiStatus: aiBody.status,
        photos,
        image: photos[primaryView],
        thumbnails: viewNames.filter((v) => v !== primaryView).map((v) => photos[v]),
        ...(subcategory && { subcategory }),
        ...(parsedExtra !== undefined && { conditionAnswers: parsedExtra }),
      },
    });

    res.status(aiResponse.status).json(aiBody);
  } catch (err) {
    console.error('POST /grading/p2p/:productId/submit error:', err);
    res.status(502).json({ error: 'Failed to reach AI grading service', details: err.message });
  }
});

// GET /api/grading/p2p/:productId/status — proxies AI1's GET /status/:id
router.get('/p2p/:productId/status', async (req, res) => {
  try {
    const { productId } = req.params;
    const existing = await prisma.p2pProduct.findUnique({ where: { id: productId } });
    if (!existing) return res.status(404).json({ error: 'Product not found' });
    if (!existing.aiRequestId) {
      return res.status(404).json({ error: 'No grading request in progress for this product' });
    }

    const aiResponse = await fetch(`${AI1_BASE_URL}/status/${existing.aiRequestId}`);
    const aiBody = await aiResponse.json();

    if (aiResponse.ok && aiBody.status && aiBody.status !== existing.aiStatus) {
      await prisma.p2pProduct.update({
        where: { id: productId },
        data: { aiStatus: aiBody.status },
      });
    }

    res.status(aiResponse.status).json(aiBody);
  } catch (err) {
    console.error('GET /grading/p2p/:productId/status error:', err);
    res.status(502).json({ error: 'Failed to reach AI grading service', details: err.message });
  }
});

// GET /api/grading/p2p/:productId/result — proxies AI1's GET /result/:id and, on COMPLETED, updates product row
router.get('/p2p/:productId/result', async (req, res) => {
  try {
    const { productId } = req.params;
    const existing = await prisma.p2pProduct.findUnique({ where: { id: productId } });
    if (!existing) return res.status(404).json({ error: 'Product not found' });
    if (!existing.aiRequestId) {
      return res.status(404).json({ error: 'No grading request in progress for this product' });
    }

    const aiResponse = await fetch(`${AI1_BASE_URL}/result/${existing.aiRequestId}`);
    const aiBody = await aiResponse.json();

    if (aiResponse.ok && aiBody.status === 'COMPLETED' && aiBody.report) {
      const { report } = aiBody;
      await prisma.p2pProduct.update({
        where: { id: productId },
        data: {
          aiStatus: 'COMPLETED',
          verified: true,
          grade: report.grade,
          condition: mapGradeToCondition(report.grade),
          defects: report.damages || [],
        },
      });
    } else if (aiResponse.ok && aiBody.status === 'FAILED') {
      await prisma.p2pProduct.update({
        where: { id: productId },
        data: { aiStatus: 'FAILED' },
      });
    }

    res.status(aiResponse.status).json(aiBody);
  } catch (err) {
    console.error('GET /grading/p2p/:productId/result error:', err);
    res.status(502).json({ error: 'Failed to reach AI grading service', details: err.message });
  }
});

export default router;
