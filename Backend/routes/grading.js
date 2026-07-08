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

async function getImageBufferAndMimetype(imageStr) {
  if (!imageStr) return null;
  if (imageStr.startsWith('data:')) {
    const matches = imageStr.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (matches && matches.length === 3) {
      return {
        mimeType: matches[1],
        buffer: Buffer.from(matches[2], 'base64'),
      };
    }
  } else if (imageStr.startsWith('http://') || imageStr.startsWith('https://')) {
    const res = await fetch(imageStr);
    if (res.ok) {
      const arrayBuffer = await res.arrayBuffer();
      return {
        mimeType: res.headers.get('content-type') || 'image/jpeg',
        buffer: Buffer.from(arrayBuffer),
      };
    }
  }
  return null;
}

// POST /api/grading/p2p/:productId/submit — forwards listing photo + metadata to AI1's /grade
router.post('/p2p/:productId/submit', async (req, res) => {
  try {
    const { productId } = req.params;
    const existing = await prisma.p2pProduct.findUnique({ where: { id: productId } });
    if (!existing) return res.status(404).json({ error: 'Product not found' });

    const imgData = await getImageBufferAndMimetype(existing.image);
    if (!imgData) return res.status(400).json({ error: 'No valid image on file for this listing' });

    // Determine target category for AI1
    const aiCategory = mapCategory(existing.category, null);

    // Look up required views for this category
    const required = REQUIRED_VIEWS[aiCategory] || ['front', 'back'];

    const form = new FormData();
    // Re-use the single uploaded photo buffer for all required views of this category
    for (const view of required) {
      form.append(view, new Blob([imgData.buffer], { type: imgData.mimeType }), `image_${view}.jpg`);
    }

    form.append('customerId', `p2p_${productId}`);
    form.append('category', aiCategory);
    form.append('returnReason', 'P2P Sale');
    form.append('customerNotes', existing.description || 'P2P Listing');

    const aiResponse = await fetch(`${AI1_BASE_URL}/grade`, { method: 'POST', body: form });
    const aiBody = await aiResponse.json();

    if (!aiResponse.ok) {
      return res.status(aiResponse.status).json(aiBody);
    }

    await prisma.p2pProduct.update({
      where: { id: productId },
      data: {
        aiRequestId: aiBody.requestId,
        aiStatus: aiBody.status,
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
