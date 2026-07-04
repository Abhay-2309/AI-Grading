import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
const history = await p.donationHistory.findMany({ where: { userId: '00000000-0000-0000-0000-000000000001' }, orderBy: { createdAt: 'desc' }, take: 15 });
console.table(history.map(h => ({ action: h.action, credits: h.credits, date: h.date })));
await p.$disconnect();
