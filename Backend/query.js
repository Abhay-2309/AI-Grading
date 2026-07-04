import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// Delete all existing returns
await prisma.return.deleteMany({});

// Create the 4 pending return items
const seeded = await prisma.return.createMany({
  data: [
    {
      id: 'ITEM-CLOTH-1',
      customerId: '00000000-0000-0000-0000-000000000001',
      customerName: 'USER_99218',
      itemName: 'Premium Cotton Shirt',
      category: 'APPAREL',
      subcategory: 'shirt',
      price: 1499.00,
      sku: 'CLOTH-SHIRT-001',
      imgUrl: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=200&auto=format&fit=crop',
      status: 'Pending',
      address: '221B Baker St',
      district: 'London Logistics Depot',
      timeWindow: '11:00 AM - 1:00 PM',
      reason: 'Wrong size',
      comments: 'Fitted too tight at shoulders.'
    },
    {
      id: 'ITEM-BOOK-1',
      customerId: '00000000-0000-0000-0000-000000000001',
      customerName: 'USER_99218',
      itemName: 'Hardcover Fiction Book',
      category: 'BOOKS',
      subcategory: 'book',
      price: 699.00,
      sku: 'BOOK-FIC-001',
      imgUrl: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=200&auto=format&fit=crop',
      status: 'Pending',
      address: '221B Baker St',
      district: 'London Logistics Depot',
      timeWindow: '11:00 AM - 1:00 PM',
      reason: 'Item damaged',
      comments: 'Dust jacket ripped on arrival.'
    },
    {
      id: 'ITEM-ELEC-1',
      customerId: '00000000-0000-0000-0000-000000000001',
      customerName: 'USER_99218',
      itemName: 'iPhone 15 Pro Max',
      category: 'ELECTRONICS',
      subcategory: 'mobile',
      price: 129900.00,
      sku: 'ELEC-MOB-001',
      imgUrl: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=200&auto=format&fit=crop',
      status: 'Pending',
      address: '221B Baker St',
      district: 'London Logistics Depot',
      timeWindow: '11:00 AM - 1:00 PM',
      reason: 'Defective',
      comments: 'Speaker crackles at high volume.'
    },
    {
      id: 'ITEM-METAL-1',
      customerId: '00000000-0000-0000-0000-000000000001',
      customerName: 'USER_99218',
      itemName: 'Stainless Steel Kettle',
      category: 'HOME',
      subcategory: 'appliance',
      price: 2499.00,
      sku: 'HOME-APP-001',
      imgUrl: 'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=200&auto=format&fit=crop',
      status: 'Pending',
      address: '221B Baker St',
      district: 'London Logistics Depot',
      timeWindow: '11:00 AM - 1:00 PM',
      reason: 'Color not as expected',
      comments: 'Appears more grey than silver.'
    }
  ]
});

console.log(`Successfully seeded ${seeded.count} items.`);
await prisma.$disconnect();
