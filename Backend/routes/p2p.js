import express from 'express';
import prisma from '../db.js';

const router = express.Router();

const DEFAULT_USER_ID = '00000000-0000-0000-0000-000000000001';
const LISTING_FEE_CREDITS = 20;
const PHONE_REVEAL_FEE_CREDITS = 10;

// sellerPhone is intentionally never included here — it's only ever
// returned by the paid /products/:id/reveal-phone endpoint.
function mapProduct(p) {
  return {
    id: p.id,
    title: p.title,
    price: Number(p.price),
    originalPrice: p.originalPrice ? Number(p.originalPrice) : undefined,
    category: p.category,
    location: p.location,
    lat: p.lat,
    lng: p.lng,
    seller: p.sellerName,
    sellerImg: p.sellerImg,
    sellerMemberSince: p.sellerMemberSince,
    sellerItemsCount: p.sellerItemsCount,
    verified: p.verified,
    condition: p.condition,
    rating: Number(p.rating),
    reviewsCount: p.reviewsCount,
    description: p.description,
    image: p.image,
    thumbnails: p.thumbnails ?? [],
    timeAgo: p.timeAgo ?? 'Recently',
    aiStatus: p.aiStatus,
    grade: p.grade,
    defects: p.defects ?? [],
  };
}

function mapChat(c, messages = []) {
  return {
    id: c.id,
    sender: c.senderName,
    senderImg: c.senderImg,
    category: c.category,
    item: {
      title: c.itemTitle,
      price: String(Number(c.itemPrice)),
      image: c.itemImage,
    },
    messages: messages.map(mapMessage),
  };
}

function mapMessage(m) {
  return {
    id: m.id,
    sender: m.senderName,
    text: m.text,
    isMe: m.isMe,
    time: new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  };
}

// ─────────────────────────────
// PRODUCTS
// ─────────────────────────────

// GET all products (with optional search/category filter)
router.get('/products', async (req, res) => {
  try {
    const { category, q } = req.query;
    const where = {
      OR: [
        { aiStatus: 'COMPLETED' },
        { aiStatus: null },
      ]
    };

    if (category && category !== 'All') {
      where.category = { equals: category, mode: 'insensitive' };
    }
    if (q) {
      where.AND = [
        {
          OR: [
            { title: { contains: q, mode: 'insensitive' } },
            { description: { contains: q, mode: 'insensitive' } },
          ]
        }
      ];
    }

    const products = await prisma.p2pProduct.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
    res.json(products.map(mapProduct));
  } catch (err) {
    console.error('GET /p2p/products error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET single product
router.get('/products/:id', async (req, res) => {
  try {
    const product = await prisma.p2pProduct.findUnique({ where: { id: req.params.id } });
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(mapProduct(product));
  } catch (err) {
    console.error('GET /p2p/products/:id error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST create a new product listing — charges a flat listing fee in green
// credits before the listing goes live.
router.post('/products', async (req, res) => {
  try {
    const {
      title, price, originalPrice, category, location,
      sellerName, sellerImg, sellerMemberSince, sellerItemsCount,
      verified, condition, rating, reviewsCount,
      description, image, thumbnails, timeAgo,
      lat, lng, sellerPhone,
    } = req.body;

    const profile = await prisma.profile.findUnique({ where: { id: DEFAULT_USER_ID } });
    if (!profile) return res.status(404).json({ error: 'Profile not found' });
    if (profile.greenCredits < LISTING_FEE_CREDITS) {
      return res.status(402).json({
        error: `Listing a new item costs ${LISTING_FEE_CREDITS} Green Credits — you only have ${profile.greenCredits}.`,
      });
    }

    const [product, updatedProfile] = await prisma.$transaction([
      prisma.p2pProduct.create({
        data: {
          title,
          price,
          originalPrice: originalPrice ?? null,
          category,
          location: location ?? null,
          lat: lat ?? null,
          lng: lng ?? null,
          sellerName,
          sellerImg: sellerImg ?? null,
          sellerPhone: sellerPhone ?? null,
          sellerMemberSince: sellerMemberSince ?? null,
          sellerItemsCount: sellerItemsCount ?? 0,
          verified: verified ?? false,
          condition,
          rating: rating ?? 5.0,
          reviewsCount: reviewsCount ?? 0,
          description: description ?? null,
          image: image ?? null,
          thumbnails: thumbnails ?? [],
          timeAgo: timeAgo ?? 'Just now',
          aiStatus: 'Pending',
        },
      }),
      prisma.profile.update({
        where: { id: DEFAULT_USER_ID },
        data: { greenCredits: { decrement: LISTING_FEE_CREDITS } },
      }),
      prisma.donationHistory.create({
        data: {
          userId: DEFAULT_USER_ID,
          date: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
          ngo: 'MarketConnect',
          logo: '',
          action: `Listing Fee: ${title}`,
          credits: -LISTING_FEE_CREDITS,
          isMe: false,
        },
      }),
    ]);

    res.status(201).json({ ...mapProduct(product), greenCredits: updatedProfile.greenCredits });
  } catch (err) {
    console.error('POST /p2p/products error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST reveal a seller's phone number — charges a flat unlock fee in green
// credits, paid once per product (no re-charge if already unlocked... this
// endpoint doesn't track that client-side, so the frontend only calls it once).
router.post('/products/:id/reveal-phone', async (req, res) => {
  try {
    const product = await prisma.p2pProduct.findUnique({ where: { id: req.params.id } });
    if (!product) return res.status(404).json({ error: 'Product not found' });
    if (!product.sellerPhone) {
      return res.status(404).json({ error: 'No phone number on file for this seller.' });
    }

    const profile = await prisma.profile.findUnique({ where: { id: DEFAULT_USER_ID } });
    if (!profile) return res.status(404).json({ error: 'Profile not found' });
    if (profile.greenCredits < PHONE_REVEAL_FEE_CREDITS) {
      return res.status(402).json({
        error: `Revealing the seller's number costs ${PHONE_REVEAL_FEE_CREDITS} Green Credits — you only have ${profile.greenCredits}.`,
      });
    }

    const [updatedProfile] = await prisma.$transaction([
      prisma.profile.update({
        where: { id: DEFAULT_USER_ID },
        data: { greenCredits: { decrement: PHONE_REVEAL_FEE_CREDITS } },
      }),
      prisma.donationHistory.create({
        data: {
          userId: DEFAULT_USER_ID,
          date: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
          ngo: 'MarketConnect',
          logo: '',
          action: `Contact Unlock: ${product.title}`,
          credits: -PHONE_REVEAL_FEE_CREDITS,
          isMe: false,
        },
      }),
    ]);

    res.json({ phone: product.sellerPhone, greenCredits: updatedProfile.greenCredits });
  } catch (err) {
    console.error('POST /p2p/products/:id/reveal-phone error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────
// CHATS & MESSAGES
// ─────────────────────────────

// GET all chats with their messages
router.get('/chats', async (req, res) => {
  try {
    const chats = await prisma.p2pChat.findMany({
      include: { messages: { orderBy: { createdAt: 'asc' } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json(chats.map(c => mapChat(c, c.messages)));
  } catch (err) {
    console.error('GET /p2p/chats error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST create or retrieve chat (by sellerName + itemTitle)
router.post('/chats', async (req, res) => {
  try {
    const { sellerName, senderImg, itemTitle, itemPrice, itemImage } = req.body;

    // Check if chat already exists
    const existing = await prisma.p2pChat.findFirst({
      where: { senderName: sellerName, itemTitle },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    });

    if (existing) {
      return res.json(mapChat(existing, existing.messages));
    }

    // Create new chat + welcome message
    const chat = await prisma.p2pChat.create({
      data: {
        senderName: sellerName,
        senderImg: senderImg ?? null,
        category: 'buying',
        itemTitle,
        itemPrice,
        itemImage: itemImage ?? null,
        messages: {
          create: {
            senderName: sellerName,
            text: `Hello! I noticed you are interested in the ${itemTitle}. Let me know if you have any questions!`,
            isMe: false,
          },
        },
      },
      include: { messages: true },
    });

    res.status(201).json(mapChat(chat, chat.messages));
  } catch (err) {
    console.error('POST /p2p/chats error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST send a message to a chat
router.post('/chats/:chatId/messages', async (req, res) => {
  try {
    const { chatId } = req.params;
    const { text, isMe = true, senderName = 'Me' } = req.body;

    const message = await prisma.p2pMessage.create({
      data: { chatId, senderName, text, isMe },
    });
    res.status(201).json(mapMessage(message));
  } catch (err) {
    console.error('POST /p2p/chats/:chatId/messages error:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
