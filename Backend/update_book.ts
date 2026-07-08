import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function run() {
  await prisma.return.upsert({
    where: { id: 'ITEM-BOOK-TEST' },
    update: {
      status: 'Pending',
      reason: null,
      comments: null,
      userGrade: null,
      userConfidence: null,
      defects: [],
      aiStatus: null,
      aiRequestId: null,
      aiRequiresHumanReview: false,
      refundStatus: 'PENDING',
      fraudFlagReason: null
    },
    create: {
      id: 'ITEM-BOOK-TEST',
      customerId: '00000000-0000-0000-0000-000000000001',
      customerName: 'USER_99218',
      timeWindow: '2:00 PM - 4:00 PM',
      address: '1248 North Industrial Blvd, Suite 402',
      district: 'Downtown Logistics Center',
      itemName: 'The Hobbit Fantasy Novel Book',
      category: 'BOOKS',
      price: 999.00,
      sku: 'BOOK-FIC-001',
      imgUrl: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=100&auto=format&fit=crop',
      status: 'Pending',
      refundStatus: 'PENDING'
    }
  });
  console.log('Book test item upserted successfully!');
}

run().catch(console.error).finally(() => prisma.$disconnect());
