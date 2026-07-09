import prisma from '../db.js';

async function main() {
  console.log('🌱 Seeding customer reviews for shoe and apparel products...');

  const shoeId = 'shoe-prod-1';
  const hoodieId = 'apparel-prod-1';

  // Make sure variants exist
  const variants = [
    { variantId: 'v-shoe-8', productId: shoeId, sizeLabel: 'IND 8', sizeNumeric: 8.0 },
    { variantId: 'v-shoe-9', productId: shoeId, sizeLabel: 'IND 9', sizeNumeric: 9.0 },
    { variantId: 'v-shoe-10', productId: shoeId, sizeLabel: 'IND 10', sizeNumeric: 10.0 },
    { variantId: 'v-shoe-11', productId: shoeId, sizeLabel: 'IND 11', sizeNumeric: 11.0 },

    { variantId: 'v-apparel-s', productId: hoodieId, sizeLabel: 'Small (38)', sizeNumeric: 38.0 },
    { variantId: 'v-apparel-m', productId: hoodieId, sizeLabel: 'Medium (40)', sizeNumeric: 40.0 },
    { variantId: 'v-apparel-l', productId: hoodieId, sizeLabel: 'Large (42)', sizeNumeric: 42.0 },
    { variantId: 'v-apparel-xl', productId: hoodieId, sizeLabel: 'X-Large (44)', sizeNumeric: 44.0 },
  ];

  for (const v of variants) {
    await prisma.productVariant.upsert({
      where: { variantId: v.variantId },
      update: {},
      create: v,
    });
  }

  // 1. Shoe Reviews (18 reviews)
  const shoeReviews = [
    {
      reviewId: 's-rev-1',
      reviewerName: 'Aarav Sharma',
      email: 'aarav@gmail.com',
      rating: 5,
      title: 'Superb cushioning and comfort!',
      reviewText: 'These shoes are absolutely amazing for road running. The EnergyCell cushioning feels incredibly responsive and bouncy. I completed a 15k run last week and had zero foot fatigue. Durability is looking top-notch after 150 km. Highly recommend for marathons!',
      reviewDate: new Date('2026-03-12T10:00:00Z'),
      variantId: 'v-shoe-9',
      verifiedPurchase: true,
      helpfulVotes: 48,
      photoUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAuEJH6tNxvwdpoTwxglNBpqpLZ1aym3cnflIItQZpkWN3hskYJgMdent2dPb_hV2Zom1EJAl5QcGz3OcUsVJqimzcnyxkYdZN-3dBR8Tb9-uZC7x-Ef5lcMdF1HaC-pXoND1pcn7XOurSFfX2ZIfhK-3i_zg-QJwSj-InJKBHcPqoP8kKDAq0UmKjqIrY-rYo2PuNvCXA3h8TPbZMqoWet-strKMnXgDxX17Nebz2ukWpDKigEskWEAw'
    },
    {
      reviewId: 's-rev-2',
      reviewerName: 'Deepika K.',
      email: 'deepika@gmail.com',
      rating: 4,
      title: 'Great traction, but runs slightly narrow',
      reviewText: 'The grip on wet roads is fantastic. Build quality feels very premium. However, be careful with sizing - it is a bit tight in the toe box and runs narrow. If you have wide feet, I highly recommend sizing up by half or a full size. Other than the narrow fit, it is extremely comfortable.',
      reviewDate: new Date('2026-04-05T14:30:00Z'),
      variantId: 'v-shoe-10',
      verifiedPurchase: true,
      helpfulVotes: 23,
      photoUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCZ7VgphmkN7L3TFlgxLsLqeagc9Tsw_6wHGWupRbfUv7lxVCat16VXxQybTSF2tJu4yuv7WA0y02PzdJlW2Xe7AHFzbjbAMAALo5UXDoMFGT82H0BKHQK8JYmUjOSC5B1u8lNw01g663cBHa4ap3nz4AFh9wBBbzNXra0GFRWM379WHalJaqCvOUHt2XO2HYpljzq6myCdXSyX6k7JZDpxLyrcNvN65aNI8Pmrf_rEcQ-_hozAkA4Kdg'
    },
    {
      reviewId: 's-rev-3',
      reviewerName: 'Rohan Gupta',
      email: 'rohan@gmail.com',
      rating: 3,
      title: 'Average durability, fits narrow',
      reviewText: 'Cushioning is decent but the toe area is way too tight. It has a narrow fit which makes it uncomfortable for wide feet after 5 km. Traction is okay on roads but slips slightly on marble tiles. Expected better breathability and space at this price point.',
      reviewDate: new Date('2026-05-18T08:15:00Z'),
      variantId: 'v-shoe-9',
      verifiedPurchase: true,
      helpfulVotes: 9,
      videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
      videoDuration: '0:10'
    },
    {
      reviewId: 's-rev-4',
      reviewerName: 'Aditya Verma',
      email: 'aditya@gmail.com',
      rating: 5,
      title: 'Marathon ready! Incredible bounce',
      reviewText: 'Absolutely brilliant shoes. The carbon plate propulsion is noticeable and gives a snappy gait cycle transition. The mesh upper is highly breathable. Perfect traction on road and trail. True to size for me.',
      reviewDate: new Date('2026-01-20T11:45:00Z'),
      variantId: 'v-shoe-10',
      verifiedPurchase: true,
      helpfulVotes: 14,
    },
    {
      reviewId: 's-rev-5',
      reviewerName: 'Meera Nair',
      email: 'meera@gmail.com',
      rating: 2,
      title: 'Fits too narrow, got blisters',
      reviewText: 'I wore these for a 10k walk and ended up with bad blisters. The shoe is very narrow and tight near the sides. I would suggest buyers to size up or avoid if they do not have narrow feet. Disappointed with the sizing fit.',
      reviewDate: new Date('2026-06-02T16:20:00Z'),
      variantId: 'v-shoe-8',
      verifiedPurchase: false,
      helpfulVotes: 32,
    },
    {
      reviewId: 's-rev-6',
      reviewerName: 'Sanjay Dutt',
      email: 'sanjay@gmail.com',
      rating: 5,
      title: 'Excellent traction and solid cushioning',
      reviewText: 'Very high quality road runner. Outsole durability is amazing - showing zero wear after 80 km. The cushioning provides great impact absorption. Comfortable and fits great.',
      reviewDate: new Date('2026-02-14T09:10:00Z'),
      variantId: 'v-shoe-11',
      verifiedPurchase: true,
      helpfulVotes: 5,
    },
    {
      reviewId: 's-rev-7',
      reviewerName: 'Karan Johar',
      email: 'karan@gmail.com',
      rating: 4,
      title: 'Good value for a premium trainer',
      reviewText: 'Responsive cushioning and stylish design. It feels bouncy. My only complaint is the narrow width, it is a bit snug on the pinky toe, but after breaking it in for a week, it fits much better.',
      reviewDate: new Date('2026-04-10T12:00:00Z'),
      variantId: 'v-shoe-9',
      verifiedPurchase: true,
      helpfulVotes: 2,
    },
    {
      reviewId: 's-rev-8',
      reviewerName: 'Pooja Hegde',
      email: 'pooja@gmail.com',
      rating: 5,
      title: 'Softest cushioning ever!',
      reviewText: 'I love these running shoes! The cushioning feels like walking on clouds. Breathable mesh design is perfect for Indian summer weather. Highly recommended.',
      reviewDate: new Date('2026-03-28T15:40:00Z'),
      variantId: 'v-shoe-8',
      verifiedPurchase: true,
      helpfulVotes: 11,
    },
    {
      reviewId: 's-rev-9',
      reviewerName: 'Amitabh B.',
      email: 'amitabh@gmail.com',
      rating: 4,
      title: 'Sturdy durability and premium feel',
      reviewText: 'Very durable outsole and sturdy construction. Fits well and provides good traction on road runs. It has a slightly snug fit so buy carefully, but performance is exceptional.',
      reviewDate: new Date('2026-05-24T17:50:00Z'),
      variantId: 'v-shoe-10',
      verifiedPurchase: true,
      helpfulVotes: 19,
    },
    {
      reviewId: 's-rev-10',
      reviewerName: 'Siddharth M.',
      email: 'sid@gmail.com',
      rating: 1,
      title: 'Extremely narrow fit, painful to wear',
      reviewText: 'The shoe is painfully tight and narrow. I ordered my usual IND 9 and could barely get my foot in. Sizing is completely off. Sizing up didn’t help because the middle is just too tight. Returning immediately.',
      reviewDate: new Date('2026-06-15T11:00:00Z'),
      variantId: 'v-shoe-9',
      verifiedPurchase: true,
      helpfulVotes: 42,
    },
    {
      reviewId: 's-rev-11',
      reviewerName: 'Neha Kakkar',
      email: 'neha@gmail.com',
      rating: 5,
      title: 'Comfortable and lightweight',
      reviewText: 'Super lightweight and high-traction rubber outsole. I use them for daily gym workouts and running. Best value for money.',
      reviewDate: new Date('2026-04-20T10:15:00Z'),
      variantId: 'v-shoe-8',
      verifiedPurchase: true,
      helpfulVotes: 0,
    },
    {
      reviewId: 's-rev-12',
      reviewerName: 'Vikram Seth',
      email: 'vikram@gmail.com',
      rating: 4,
      title: 'Excellent traction on wet roads',
      reviewText: 'Traction is solid on rainy runs. Cushioning provides great bounce. Snug/narrow fit but comfortable overall.',
      reviewDate: new Date('2026-05-02T13:45:00Z'),
      variantId: 'v-shoe-11',
      verifiedPurchase: true,
      helpfulVotes: 6,
    },
    {
      reviewId: 's-rev-13',
      reviewerName: 'Anushka S.',
      email: 'anushka@gmail.com',
      rating: 5,
      title: 'Fits true to size, great cushioning',
      reviewText: 'Perfect size for me. Breathable and comfortable. The EnergyCell foam absorbs impacts very well.',
      reviewDate: new Date('2026-03-08T09:30:00Z'),
      variantId: 'v-shoe-9',
      verifiedPurchase: true,
      helpfulVotes: 3,
    },
    {
      reviewId: 's-rev-14',
      reviewerName: 'Rajkummar R.',
      email: 'raj@gmail.com',
      rating: 3,
      title: 'Decent performance but sizing is narrow',
      reviewText: 'Decent road runner. Excellent cushioning and traction but narrow. Wish they had wide options in India.',
      reviewDate: new Date('2026-05-10T15:20:00Z'),
      variantId: 'v-shoe-10',
      verifiedPurchase: true,
      helpfulVotes: 1,
    },
    {
      reviewId: 's-rev-15',
      reviewerName: 'Priyanka C.',
      email: 'priyanka@gmail.com',
      rating: 5,
      title: 'Fabulous durability',
      reviewText: 'Wore these for two half-marathons now. Durability is outstanding. The outsole still looks brand new. Very bouncy and comfortable.',
      reviewDate: new Date('2026-04-18T14:10:00Z'),
      variantId: 'v-shoe-8',
      verifiedPurchase: true,
      helpfulVotes: 7,
    }
  ];

  // 2. Hoodie Reviews (17 reviews)
  const hoodieReviews = [
    {
      reviewId: 'h-rev-1',
      reviewerName: 'Suma',
      email: 'suma@gmail.com',
      rating: 4,
      title: 'Comfortable Sweatshirt',
      reviewText: 'The sweatshirt feels soft and comfortable for daily wear in winter. The fabric is good quality. It keeps you warm without feeling too heavy. The design looks stylish. Overall, a good product, but the material could be slightly thicker for colder weather.',
      reviewDate: new Date('2026-03-24T09:00:00Z'),
      variantId: 'v-apparel-xl',
      verifiedPurchase: true,
      helpfulVotes: 1,
      photoUrl: 'https://res.cloudinary.com/dy8vdilqu/image/upload/v1783217408/ChatGPT_Image_Jul_5_2026_07_39_37_AM_exfovv.png'
    },
    {
      reviewId: 'h-rev-2',
      reviewerName: 'Salma M.',
      email: 'salma@gmail.com',
      rating: 5,
      title: 'Good one',
      reviewText: 'Good quality in best price. Softest material, fits perfect, and feels extremely comfortable. Solid stitching and very warm.',
      reviewDate: new Date('2026-06-30T16:00:00Z'),
      variantId: 'v-apparel-m',
      verifiedPurchase: true,
      helpfulVotes: 0,
    },
    {
      reviewId: 'h-rev-3',
      reviewerName: 'Babu Gopalsamy',
      email: 'babu@gmail.com',
      rating: 5,
      title: 'Good quality',
      reviewText: 'Excellent fit. Warm and comfortable fleece. The charcoal color looks exactly like the image.',
      reviewDate: new Date('2026-06-24T12:00:00Z'),
      variantId: 'v-apparel-m',
      verifiedPurchase: true,
      helpfulVotes: 0,
    },
    {
      reviewId: 'h-rev-4',
      reviewerName: 'Anjali Sharma',
      email: 'anjali@gmail.com',
      rating: 4,
      title: 'Extremely soft but fits slightly large',
      reviewText: 'The fleece inside is incredibly soft and warm. It is very cozy for winters. Note that it runs slightly large and has a loose fit. If you prefer a snug fit, order one size down. Otherwise, fabric quality is amazing and wash resistance is good.',
      reviewDate: new Date('2026-04-12T11:30:00Z'),
      variantId: 'v-apparel-m',
      verifiedPurchase: true,
      helpfulVotes: 22,
      photoUrl: 'https://res.cloudinary.com/dy8vdilqu/image/upload/v1783217408/ChatGPT_Image_Jul_5_2026_07_39_37_AM_exfovv.png'
    },
    {
      reviewId: 'h-rev-5',
      reviewerName: 'Rahul Verma',
      email: 'rahulv@gmail.com',
      rating: 3,
      title: 'Good warmth, but size runs too loose',
      reviewText: 'Warmth is fine for mild winters. The quality is decent. However, it fits too loose and runs very large. I ordered Large and it fits like an XL. I recommend sizing down.',
      reviewDate: new Date('2026-05-02T15:20:00Z'),
      variantId: 'v-apparel-l',
      verifiedPurchase: true,
      helpfulVotes: 15,
      videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
      videoDuration: '0:10'
    },
    {
      reviewId: 'h-rev-6',
      reviewerName: 'Divya N.',
      email: 'divya@gmail.com',
      rating: 5,
      title: 'Incredible value for money',
      reviewText: 'Amazing product at a reasonable price! The fabric feels high quality and thick. Kept me very warm during my trip to Shimla. Stitching is solid.',
      reviewDate: new Date('2026-01-15T14:40:00Z'),
      variantId: 'v-apparel-s',
      verifiedPurchase: true,
      helpfulVotes: 8,
    },
    {
      reviewId: 'h-rev-7',
      reviewerName: 'Jaspreet Singh',
      email: 'jaspreet@gmail.com',
      rating: 2,
      title: 'Stitching issues, fits too big',
      reviewText: 'The size is way too big and loose. I look like I am wearing a sack. Also noticed stitching threads coming out near the pocket. Quality could be much better. Sizing is completely large.',
      reviewDate: new Date('2026-06-11T13:10:00Z'),
      variantId: 'v-apparel-xl',
      verifiedPurchase: true,
      helpfulVotes: 30,
    },
    {
      reviewId: 'h-rev-8',
      reviewerName: 'Preeti Roy',
      email: 'preeti@gmail.com',
      rating: 4,
      title: 'Soft fabric and very cozy',
      reviewText: 'Very comfortable and soft midweight fleece. The fit is slightly loose, which is perfect for lounging. Wash quality is good - no lint or color bleeding.',
      reviewDate: new Date('2026-03-30T10:15:00Z'),
      variantId: 'v-apparel-m',
      verifiedPurchase: true,
      helpfulVotes: 4,
    },
    {
      reviewId: 'h-rev-9',
      reviewerName: 'Abhishek Kumar',
      email: 'abhi@gmail.com',
      rating: 5,
      title: 'Perfect hoodie for winters',
      reviewText: 'Excellent warmth and soft fabric. Best buy. Sturdy zippers and split kangaroo pockets are very functional. True to size for a relaxed hoodie fit.',
      reviewDate: new Date('2026-02-28T09:20:00Z'),
      variantId: 'v-apparel-l',
      verifiedPurchase: true,
      helpfulVotes: 6,
    },
    {
      reviewId: 'h-rev-10',
      reviewerName: 'Vikram A.',
      email: 'vikrama@gmail.com',
      rating: 4,
      title: 'Super comfortable and warm',
      reviewText: 'Great sweatshirt. The fabric quality is very good. Fits slightly large but very comfortable to wear. Definitely worth the price.',
      reviewDate: new Date('2026-04-18T16:30:00Z'),
      variantId: 'v-apparel-m',
      verifiedPurchase: true,
      helpfulVotes: 3,
    },
    {
      reviewId: 'h-rev-11',
      reviewerName: 'Sneha Rao',
      email: 'sneha@gmail.com',
      rating: 5,
      title: 'Love the softness',
      reviewText: 'Incredibly soft and comfortable fleece. Looks premium and fits well. Warm and cozy for daily wear.',
      reviewDate: new Date('2026-05-12T14:10:00Z'),
      variantId: 'v-apparel-s',
      verifiedPurchase: true,
      helpfulVotes: 0,
    },
    {
      reviewId: 'h-rev-12',
      reviewerName: 'Gaurav S.',
      email: 'gaurav@gmail.com',
      rating: 3,
      title: 'Size is quite loose',
      reviewText: 'Decent quality fabric but the size runs very large and loose. Strongly advise sizing down if you want a regular fit.',
      reviewDate: new Date('2026-05-20T17:40:00Z'),
      variantId: 'v-apparel-l',
      verifiedPurchase: true,
      helpfulVotes: 5,
    },
    {
      reviewId: 'h-rev-13',
      reviewerName: 'Shalini K.',
      email: 'shalini@gmail.com',
      rating: 5,
      title: 'Amazing quality and value',
      reviewText: 'Outstanding fabric thickness and warmth. Zippers work smoothly. Highly comfortable relaxed fit.',
      reviewDate: new Date('2026-03-05T11:20:00Z'),
      variantId: 'v-apparel-m',
      verifiedPurchase: true,
      helpfulVotes: 2,
    },
    {
      reviewId: 'h-rev-14',
      reviewerName: 'Ravi Teja',
      email: 'ravi@gmail.com',
      rating: 4,
      title: 'Warm and comfortable',
      reviewText: 'Very comfortable fleece fabric. It runs a bit large but I like the loose fit for winter layerings.',
      reviewDate: new Date('2026-04-28T09:45:00Z'),
      variantId: 'v-apparel-xl',
      verifiedPurchase: true,
      helpfulVotes: 1,
    },
    {
      reviewId: 'h-rev-15',
      reviewerName: 'Priya Mani',
      email: 'priyam@gmail.com',
      rating: 5,
      title: 'Highly recommend this soft hoodie',
      reviewText: 'Softest fleece lining ever! It is thick and keeps you very warm. Sizing is loose and comfortable.',
      reviewDate: new Date('2026-02-18T15:10:00Z'),
      variantId: 'v-apparel-s',
      verifiedPurchase: true,
      helpfulVotes: 7,
    }
  ];

  // Seed Shoe Reviews
  console.log('  Seeding shoe reviews...');
  for (const r of shoeReviews) {
    // Upsert Profile first
    const profileId = `p-${r.reviewId}`;
    await prisma.profile.upsert({
      where: { id: profileId },
      update: {},
      create: {
        id: profileId,
        email: r.email,
        fullName: r.reviewerName,
      }
    });

    await prisma.review.upsert({
      where: { reviewId: r.reviewId },
      update: {
        title: r.title,
        reviewText: r.reviewText,
        rating: r.rating,
        reviewDate: r.reviewDate,
        variantId: r.variantId,
        verifiedPurchase: r.verifiedPurchase,
        helpfulVotes: r.helpfulVotes,
        photoUrl: r.photoUrl || null,
        videoUrl: r.videoUrl || null,
        videoDuration: r.videoDuration || null,
      },
      create: {
        reviewId: r.reviewId,
        customerId: profileId,
        productId: shoeId,
        rating: r.rating,
        title: r.title,
        reviewText: r.reviewText,
        reviewDate: r.reviewDate,
        variantId: r.variantId,
        verifiedPurchase: r.verifiedPurchase,
        helpfulVotes: r.helpfulVotes,
        photoUrl: r.photoUrl || null,
        videoUrl: r.videoUrl || null,
        videoDuration: r.videoDuration || null,
      }
    });
  }

  // Seed Hoodie Reviews
  console.log('  Seeding hoodie reviews...');
  for (const r of hoodieReviews) {
    const profileId = `p-${r.reviewId}`;
    await prisma.profile.upsert({
      where: { id: profileId },
      update: {},
      create: {
        id: profileId,
        email: r.email,
        fullName: r.reviewerName,
      }
    });

    await prisma.review.upsert({
      where: { reviewId: r.reviewId },
      update: {
        title: r.title,
        reviewText: r.reviewText,
        rating: r.rating,
        reviewDate: r.reviewDate,
        variantId: r.variantId,
        verifiedPurchase: r.verifiedPurchase,
        helpfulVotes: r.helpfulVotes,
        photoUrl: r.photoUrl || null,
        videoUrl: r.videoUrl || null,
        videoDuration: r.videoDuration || null,
      },
      create: {
        reviewId: r.reviewId,
        customerId: profileId,
        productId: hoodieId,
        rating: r.rating,
        title: r.title,
        reviewText: r.reviewText,
        reviewDate: r.reviewDate,
        variantId: r.variantId,
        verifiedPurchase: r.verifiedPurchase,
        helpfulVotes: r.helpfulVotes,
        photoUrl: r.photoUrl || null,
        videoUrl: r.videoUrl || null,
        videoDuration: r.videoDuration || null,
      }
    });
  }

  console.log('✅ Seeding reviews completed successfully!');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});
