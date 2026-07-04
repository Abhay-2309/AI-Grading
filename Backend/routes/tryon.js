import express from 'express';
import multer from 'multer';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

const GEMINI_IMAGE_API_KEY = process.env.GEMINI_IMAGE_API_KEY;
const GEMINI_IMAGE_MODEL = process.env.GEMINI_IMAGE_MODEL || 'gemini-3.1-flash-lite';

// randomuser.me serves stable, freely-usable placeholder portrait photos by
// fixed index — used only as the base "model" photo for the "Use a model"
// path, never for real customer photos.
const MODEL_POOL = [
  'https://randomuser.me/api/portraits/men/32.jpg',
  'https://randomuser.me/api/portraits/men/54.jpg',
  'https://randomuser.me/api/portraits/men/76.jpg',
  'https://randomuser.me/api/portraits/women/44.jpg',
  'https://randomuser.me/api/portraits/women/65.jpg',
  'https://randomuser.me/api/portraits/women/21.jpg',
];

async function fetchImageAsBase64(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch image (${res.status}): ${url}`);
  const mimeType = res.headers.get('content-type') || 'image/jpeg';
  const buffer = Buffer.from(await res.arrayBuffer());
  return { mimeType, data: buffer.toString('base64') };
}

function bufferToBase64Part(buffer, mimetype) {
  return { mimeType: mimetype || 'image/jpeg', data: buffer.toString('base64') };
}

// POST /api/tryon/generate — composites a garment photo onto a person photo
// (uploaded by the customer, or a randomly-picked stock model) using a
// generative image model, so the customer sees themself/a model actually
// wearing the exact item instead of a static hardcoded preview.
router.post('/generate', upload.single('personImage'), async (req, res) => {
  try {
    if (!GEMINI_IMAGE_API_KEY || GEMINI_IMAGE_API_KEY === 'replace-me') {
      return res.status(503).json({
        error: 'Virtual try-on is not configured yet — set GEMINI_IMAGE_API_KEY (an image-generation-capable Gemini key) in Backend/.env.',
      });
    }

    const { mode, garmentImageUrl, garmentLabel, pinnedModelPhotoUrl } = req.body;
    if (mode !== 'photo' && mode !== 'model') {
      return res.status(400).json({ error: "mode must be 'photo' or 'model'" });
    }
    if (!garmentImageUrl) {
      return res.status(400).json({ error: 'garmentImageUrl is required' });
    }

    let personPart;
    let modelPhotoUrl = null;
    if (mode === 'model') {
      // Reuse the same model across a color swap instead of re-randomizing,
      // unless the caller explicitly wants a fresh one (no pinned URL sent).
      modelPhotoUrl =
        pinnedModelPhotoUrl && MODEL_POOL.includes(pinnedModelPhotoUrl)
          ? pinnedModelPhotoUrl
          : MODEL_POOL[Math.floor(Math.random() * MODEL_POOL.length)];
      personPart = await fetchImageAsBase64(modelPhotoUrl);
    } else {
      if (!req.file) return res.status(400).json({ error: 'personImage file is required for mode=photo' });
      personPart = bufferToBase64Part(req.file.buffer, req.file.mimetype);
    }

    const garmentPart = await fetchImageAsBase64(garmentImageUrl);

    const prompt =
      `Generate a single photorealistic image of the exact same person shown in the first photo, ` +
      `now wearing the exact garment shown in the second photo${garmentLabel ? ` (${garmentLabel})` : ''}. ` +
      `Preserve the person's face, body shape, skin tone, pose, and background as closely as possible — ` +
      `only replace their visible clothing with the garment shown. Studio e-commerce product-photo lighting, ` +
      `realistic fabric drape and fit.`;

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_IMAGE_MODEL}:generateContent?key=${GEMINI_IMAGE_API_KEY}`;
    const geminiRes = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: prompt },
            { inlineData: personPart },
            { inlineData: garmentPart },
          ],
        }],
      }),
    });

    const geminiBody = await geminiRes.json();

    if (!geminiRes.ok) {
      const reason = geminiBody?.error?.message || `Gemini returned ${geminiRes.status}`;
      console.error('POST /tryon/generate — Gemini error:', reason);
      return res.status(502).json({ error: `AI try-on generation failed: ${reason}` });
    }

    const imagePart = geminiBody?.candidates?.[0]?.content?.parts?.find((p) => p.inlineData);
    if (!imagePart) {
      const textPart = geminiBody?.candidates?.[0]?.content?.parts?.find((p) => p.text);
      return res.status(502).json({
        error: textPart?.text
          ? `AI declined to generate an image: ${textPart.text}`
          : 'AI try-on generation returned no image.',
      });
    }

    res.json({
      image: `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`,
      modelPhotoUrl,
    });
  } catch (err) {
    console.error('POST /tryon/generate error:', err);
    res.status(502).json({ error: err.message || 'Failed to generate virtual try-on image' });
  }
});

export default router;
