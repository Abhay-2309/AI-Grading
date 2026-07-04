import express from 'express';
import prisma from '../db.js';

const router = express.Router();

const DEFAULT_USER_ID = '00000000-0000-0000-0000-000000000001';

function mapCampaign(c) {
  return {
    id: c.id,
    title: c.title,
    ngoName: c.ngoName,
    ngoLogo: c.ngoLogo,
    description: c.description,
    image: c.image,
    urgency: c.urgency,
    category: c.category,
    progress: c.progress,
    received: Number(c.received),
    target: Number(c.target),
    unit: c.unit,
    location: c.location,
    state: c.state,
    founder: c.founder,
    contactPerson: c.contactPerson,
    contactEmail: c.contactEmail,
    contactPhone: c.contactPhone,
    registrationNumber: c.registrationNumber,
    foundedYear: c.foundedYear,
    address: c.address,
    missionStatement: c.missionStatement,
  };
}

function mapHistory(h) {
  return {
    id: h.id,
    date: h.date,
    ngo: h.ngo,
    logo: h.logo,
    action: h.action,
    credits: h.credits,
    isMe: h.isMe,
  };
}

// GET all NGO campaigns
router.get('/campaigns', async (req, res) => {
  try {
    const campaigns = await prisma.ngoCampaign.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.json(campaigns.map(mapCampaign));
  } catch (err) {
    console.error('GET /donations/campaigns error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST add new campaign need (NGO portal)
router.post('/campaigns/need', async (req, res) => {
  try {
    const {
      title, ngoName, ngoLogo, description, image, urgency, category, target, unit, location, state,
      founder, contactPerson, contactEmail, contactPhone, registrationNumber, foundedYear, address, missionStatement,
    } = req.body;

    const campaign = await prisma.ngoCampaign.create({
      data: {
        title,
        ngoName,
        ngoLogo: ngoLogo ?? null,
        description: description ?? null,
        image: image ?? null,
        urgency: urgency ?? 'standard',
        category,
        target,
        unit,
        location: location ?? null,
        state: state ?? null,
        founder: founder ?? null,
        contactPerson: contactPerson ?? null,
        contactEmail: contactEmail ?? null,
        contactPhone: contactPhone ?? null,
        registrationNumber: registrationNumber ?? null,
        foundedYear: foundedYear ?? null,
        address: address ?? null,
        missionStatement: missionStatement ?? null,
        progress: 0,
        received: 0,
      },
    });
    res.status(201).json(mapCampaign(campaign));
  } catch (err) {
    console.error('POST /donations/campaigns/need error:', err);
    res.status(500).json({ error: err.message });
  }
});

// PATCH edit an existing campaign need (NGO portal "Edit Need")
router.patch('/campaigns/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title, description, image, urgency, category, target, unit, location, state,
      founder, contactPerson, contactEmail, contactPhone, registrationNumber, foundedYear, address, missionStatement,
    } = req.body;

    const existing = await prisma.ngoCampaign.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Campaign not found' });

    const campaign = await prisma.ngoCampaign.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(image !== undefined && { image }),
        ...(urgency !== undefined && { urgency }),
        ...(category !== undefined && { category }),
        ...(target !== undefined && { target }),
        ...(unit !== undefined && { unit }),
        ...(location !== undefined && { location }),
        ...(state !== undefined && { state }),
        ...(founder !== undefined && { founder }),
        ...(contactPerson !== undefined && { contactPerson }),
        ...(contactEmail !== undefined && { contactEmail }),
        ...(contactPhone !== undefined && { contactPhone }),
        ...(registrationNumber !== undefined && { registrationNumber }),
        ...(foundedYear !== undefined && { foundedYear }),
        ...(address !== undefined && { address }),
        ...(missionStatement !== undefined && { missionStatement }),
      },
    });
    res.json(mapCampaign(campaign));
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Campaign not found' });
    console.error('PATCH /donations/campaigns/:id error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST donate to a campaign
router.post('/donate', async (req, res) => {
  try {
    const { campaignId, itemCategory, qty } = req.body;
    const creditsAwarded = qty * 30;

    // Fetch campaign
    const campaign = await prisma.ngoCampaign.findUnique({ where: { id: campaignId } });
    if (!campaign) return res.status(404).json({ error: 'Campaign not found' });

    const nextReceived = Number(campaign.received) + qty;
    const nextProgress = Math.min(Math.round((nextReceived / Number(campaign.target)) * 100), 100);

    // Run all DB changes in a transaction
    const [updatedCampaign, updatedProfile, newHistory] = await prisma.$transaction([
      // Update campaign progress
      prisma.ngoCampaign.update({
        where: { id: campaignId },
        data: { received: nextReceived, progress: nextProgress },
      }),
      // Award credits to user
      prisma.profile.update({
        where: { id: DEFAULT_USER_ID },
        data: {
          greenCredits: { increment: creditsAwarded },
          causesHelped: { increment: 1 },
        },
      }),
      // Log donation history
      prisma.donationHistory.create({
        data: {
          userId: DEFAULT_USER_ID,
          date: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
          ngo: campaign.ngoName,
          logo: campaign.ngoLogo ?? '',
          action: `Donated ${qty} x ${itemCategory}`,
          credits: creditsAwarded,
          isMe: true,
        },
      }),
    ]);

    // Fetch updated full data
    const [allCampaigns, allHistory] = await Promise.all([
      prisma.ngoCampaign.findMany({ orderBy: { createdAt: 'desc' } }),
      prisma.donationHistory.findMany({
        where: { userId: DEFAULT_USER_ID },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    res.json({
      greenCredits: updatedProfile.greenCredits,
      impactStats: { treesPlanted: updatedProfile.treesPlanted, causesHelped: updatedProfile.causesHelped },
      donationCampaigns: allCampaigns.map(mapCampaign),
      donationHistory: allHistory.map(mapHistory),
    });
  } catch (err) {
    console.error('POST /donations/donate error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST redeem green credits
router.post('/redeem', async (req, res) => {
  try {
    const { tierCredits, perkTitle } = req.body;

    const profile = await prisma.profile.findUnique({ where: { id: DEFAULT_USER_ID } });
    if (!profile) return res.status(404).json({ error: 'Profile not found' });
    if (profile.greenCredits < tierCredits) {
      return res.status(400).json({ error: 'Insufficient green credits' });
    }

    const [updatedProfile, newHistory] = await prisma.$transaction([
      prisma.profile.update({
        where: { id: DEFAULT_USER_ID },
        data: { greenCredits: { decrement: tierCredits } },
      }),
      prisma.donationHistory.create({
        data: {
          userId: DEFAULT_USER_ID,
          date: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
          ngo: 'MarketConnect Store',
          logo: '',
          action: `Redeemed ${perkTitle}`,
          credits: -tierCredits,
          isMe: false,
        },
      }),
    ]);

    const allHistory = await prisma.donationHistory.findMany({
      where: { userId: DEFAULT_USER_ID },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      greenCredits: updatedProfile.greenCredits,
      donationHistory: allHistory.map(mapHistory),
    });
  } catch (err) {
    console.error('POST /donations/redeem error:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
