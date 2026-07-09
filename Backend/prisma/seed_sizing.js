import prisma from '../db.js';

async function main() {
  console.log('🌱 Seeding e-commerce sizing data...');

  const productId = 'shoe-prod-1';
  const apparelProductId = 'apparel-prod-1';

  // 1. Create Product Variants
  console.log('  Creating product variants...');
  const variants = [
    { variantId: 'v-shoe-8', productId, sizeLabel: 'IND 8', sizeNumeric: 8.0 },
    { variantId: 'v-shoe-9', productId, sizeLabel: 'IND 9', sizeNumeric: 9.0 },
    { variantId: 'v-shoe-10', productId, sizeLabel: 'IND 10', sizeNumeric: 10.0 },
    { variantId: 'v-shoe-11', productId, sizeLabel: 'IND 11', sizeNumeric: 11.0 },

    { variantId: 'v-apparel-s', productId: apparelProductId, sizeLabel: 'Small (38)', sizeNumeric: 38.0 },
    { variantId: 'v-apparel-m', productId: apparelProductId, sizeLabel: 'Medium (40)', sizeNumeric: 40.0 },
    { variantId: 'v-apparel-l', productId: apparelProductId, sizeLabel: 'Large (42)', sizeNumeric: 42.0 },
    { variantId: 'v-apparel-xl', productId: apparelProductId, sizeLabel: 'X-Large (44)', sizeNumeric: 44.0 },
  ];

  for (const v of variants) {
    await prisma.productVariant.upsert({
      where: { variantId: v.variantId },
      update: v,
      create: v,
    });
  }

  // 2. Create Profiles and Customer Profiles
  console.log('  Creating customer profiles & orders...');
  const customerData = [
    { id: 'c-shoe-1', email: 'cust1@amazon.com', fullName: 'John Doe', footLengthCm: 26.5, footWidth: 'Medium (Standard)', variantId: 'v-shoe-9' },
    { id: 'c-shoe-2', email: 'cust2@amazon.com', fullName: 'Jane Smith', footLengthCm: 26.4, footWidth: 'Medium (Standard)', variantId: 'v-shoe-9' },
    { id: 'c-shoe-3', email: 'cust3@amazon.com', fullName: 'Bob Johnson', footLengthCm: 26.6, footWidth: 'Medium (Standard)', variantId: 'v-shoe-9' },
    { id: 'c-shoe-4', email: 'cust4@amazon.com', fullName: 'Alice Williams', footLengthCm: 26.5, footWidth: 'Medium (Standard)', variantId: 'v-shoe-9' },
    { id: 'c-shoe-5', email: 'cust5@amazon.com', fullName: 'Charlie Brown', footLengthCm: 26.7, footWidth: 'Medium (Standard)', variantId: 'v-shoe-9' },
    { id: 'c-shoe-6', email: 'cust6@amazon.com', fullName: 'David Davis', footLengthCm: 26.3, footWidth: 'Medium (Standard)', variantId: 'v-shoe-9' },
    // Wide fit profile -> kept size 10
    { id: 'c-shoe-7', email: 'cust7@amazon.com', fullName: 'Frank Miller', footLengthCm: 26.5, footWidth: 'Wide', variantId: 'v-shoe-10' },
    { id: 'c-shoe-8', email: 'cust8@amazon.com', fullName: 'Grace Wilson', footLengthCm: 26.6, footWidth: 'Wide', variantId: 'v-shoe-10' },
  ];

  // Make sure default user profile exists
  await prisma.profile.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      email: 'user99218@amazon.com',
      fullName: 'USER_99218',
    }
  });

  // Seed default user CustomerProfile
  await prisma.customerProfile.upsert({
    where: { customerId: '00000000-0000-0000-0000-000000000001' },
    update: {
      footLengthCm: 26.5,
      footWidth: 'Medium (Standard)',
      shoeSizeSelected: 'IND 9',
      chestCm: 94.0,
      heightCm: 175.0,
      weightKg: 70.0
    },
    create: {
      customerId: '00000000-0000-0000-0000-000000000001',
      footLengthCm: 26.5,
      footWidth: 'Medium (Standard)',
      shoeSizeSelected: 'IND 9',
      chestCm: 94.0,
      heightCm: 175.0,
      weightKg: 70.0
    }
  });

  // Seed default user orders & returns to show live e-commerce returns behavior in the return prevention suggestions
  console.log('  Seeding active user orders and returns...');
  for (let i = 1; i <= 10; i++) {
    const isApparel = i % 2 === 0;
    const orderId = `o-default-${i}`;
    await prisma.order.upsert({
      where: { orderId },
      update: {},
      create: {
        orderId,
        customerId: '00000000-0000-0000-0000-000000000001',
        productId: isApparel ? apparelProductId : productId,
        variantId: isApparel ? 'v-apparel-m' : 'v-shoe-9',
        price: isApparel ? 2069.00 : 2499.00,
      }
    });
  }

  // 2 of these orders are returned
  await prisma.ecommerceReturn.upsert({
    where: { returnId: 'r-default-1' },
    update: {},
    create: {
      returnId: 'r-default-1',
      orderId: 'o-default-1',
      returnReason: 'wrong_size',
    }
  });

  await prisma.ecommerceReturn.upsert({
    where: { returnId: 'r-default-2' },
    update: {},
    create: {
      returnId: 'r-default-2',
      orderId: 'o-default-2',
      returnReason: 'too_small',
    }
  });

  for (const c of customerData) {
    // Create Profile
    await prisma.profile.upsert({
      where: { id: c.id },
      update: { email: c.email, fullName: c.fullName },
      create: { id: c.id, email: c.email, fullName: c.fullName },
    });

    // Create CustomerProfile
    await prisma.customerProfile.upsert({
      where: { customerId: c.id },
      update: { footLengthCm: c.footLengthCm, footWidth: c.footWidth },
      create: { customerId: c.id, footLengthCm: c.footLengthCm, footWidth: c.footWidth },
    });

    // Create Order
    const orderId = `o-${c.id}`;
    await prisma.order.upsert({
      where: { orderId },
      update: { productId, variantId: c.variantId },
      create: {
        orderId,
        customerId: c.id,
        productId,
        variantId: c.variantId,
        price: 2499.00
      }
    });
  }

  // Seed product-level return reasons for apparel-prod-1 to demonstrate quality issues returns analysis
  console.log('  Seeding product-level returns for apparel...');
  const apparelCustomers = [
    { id: 'c-app-1', email: 'app1@amazon.com', fullName: 'Alice Green', variantId: 'v-apparel-m', returnReason: 'quality_issue' },
    { id: 'c-app-2', email: 'app2@amazon.com', fullName: 'Bob Blue', variantId: 'v-apparel-l', returnReason: 'quality_issue' },
    { id: 'c-app-3', email: 'app3@amazon.com', fullName: 'Charlie Red', variantId: 'v-apparel-xl', returnReason: 'quality_issue' },
    { id: 'c-app-4', email: 'app4@amazon.com', fullName: 'Diana White', variantId: 'v-apparel-m', returnReason: 'quality_issue' },
    { id: 'c-app-5', email: 'app5@amazon.com', fullName: 'Evan Black', variantId: 'v-apparel-s', returnReason: null }, // kept
  ];

  for (const c of apparelCustomers) {
    await prisma.profile.upsert({
      where: { id: c.id },
      update: { email: c.email, fullName: c.fullName },
      create: { id: c.id, email: c.email, fullName: c.fullName },
    });

    const orderId = `o-${c.id}`;
    await prisma.order.upsert({
      where: { orderId },
      update: { productId: apparelProductId, variantId: c.variantId },
      create: {
        orderId,
        customerId: c.id,
        productId: apparelProductId,
        variantId: c.variantId,
        price: 2069.00
      }
    });

    if (c.returnReason) {
      const returnId = `r-${c.id}`;
      await prisma.ecommerceReturn.upsert({
        where: { returnId },
        update: { returnReason: c.returnReason },
        create: {
          returnId,
          orderId,
          returnReason: c.returnReason,
        }
      });
    }
  }

  // 3. Create Reviews for Shoe Sizing Miner
  console.log('  Creating product reviews...');
  const reviews = [
    { reviewId: 'rev-1', orderId: 'o-c-shoe-1', customerId: 'c-shoe-1', productId, rating: 5, reviewText: 'Nice fit, runs true to size. High quality product.' },
    { reviewId: 'rev-2', orderId: 'o-c-shoe-2', customerId: 'c-shoe-2', productId, rating: 4, reviewText: 'Very comfortable but runs a bit small, suggest ordering half a size up for wider feet.' },
    { reviewId: 'rev-3', orderId: 'o-c-shoe-3', customerId: 'c-shoe-3', productId, rating: 4, reviewText: 'Runs tight at the toes. Definitely fits small, size up!' },
    { reviewId: 'rev-4', orderId: 'o-c-shoe-4', customerId: 'c-shoe-4', productId, rating: 5, reviewText: 'Fits small, glad I got a larger size. Awesome shoes.' },
    { reviewId: 'rev-5', orderId: 'o-c-shoe-5', customerId: 'c-shoe-5', productId, rating: 3, reviewText: 'Quality is decent but they run narrow and tight. Size up.' },
  ];

  for (const r of reviews) {
    await prisma.review.upsert({
      where: { reviewId: r.reviewId },
      update: r,
      create: r,
    });
  }

  console.log('✅ Seed sizing completed successfully!');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});
