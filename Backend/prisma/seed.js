import { PrismaClient } from '@prisma/client';
import 'dotenv/config';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // ─────────────────────────────
  // Default Profile (User)
  // ─────────────────────────────
  const defaultUser = await prisma.profile.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      email: 'user99218@amazon.com',
      fullName: 'USER_99218',
      greenCredits: 320,
      treesPlanted: 14,
      causesHelped: 8,
    },
  });
  console.log('✅ Profile seeded:', defaultUser.email);

  // ─────────────────────────────
  // Leaderboard
  // ─────────────────────────────
  const leaderboardData = [
    { rank: 1, name: 'David Chen',       verifiedCount: 342, accuracy: '99.4%', avgSpeed: '1m 24s', score: 980 },
    { rank: 2, name: 'Sarah Jenkins',    verifiedCount: 318, accuracy: '98.8%', avgSpeed: '1m 35s', score: 955 },
    { rank: 3, name: 'Maria Rodriguez',  verifiedCount: 295, accuracy: '98.2%', avgSpeed: '1m 42s', score: 920 },
    { rank: 4, name: 'James Wilson',     verifiedCount: 288, accuracy: '97.9%', avgSpeed: '1m 38s', score: 905 },
    { rank: 5, name: 'Emily Taylor',     verifiedCount: 274, accuracy: '97.5%', avgSpeed: '1m 50s', score: 880 },
  ];

  for (const entry of leaderboardData) {
    await prisma.leaderboard.upsert({
      where: { rank: entry.rank },
      update: {},
      create: entry,
    });
  }
  console.log('✅ Leaderboard seeded');

  // ─────────────────────────────
  // Returns
  // ─────────────────────────────
  const returnsData = [
    {
      id: 'ITEM-88291-ZX',
      customerName: 'USER_99218',
      timeWindow: '2:00 PM - 4:00 PM',
      address: '1248 North Industrial Blvd, Suite 402',
      district: 'Downtown Logistics Center',
      itemName: 'Sony Alpha a7 IV Mirrorless Camera',
      category: 'ELECTRONICS',
      price: 1249.00,
      sku: '884120394-B09JZT6YSS',
      imgUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDsTYRDNWcz7hABHcTI73TqyLm7IBQnVg7zSoyKvuqauJU36bZkGye0iWQMljQLgrdpylt_-SD008l6_RSIp0hbXD7gPUtM-S0Mr2xMqgTfB_p0WNpl4Eo3hLW7ExRYdkknwdqifjJcIqKqLsSORlrHiiIqO96YHuOGU3SfwkQHec1-y1CObWPVhZkoNY9725LYxlQyHhEW9Pd4WsRe7CB3Mo9OjUjPtc8ONgz1QO2RpgVncdWm7Pg-cvKETx4w_THA-QNiJfqH6MPF',
      reason: 'defective',
      comments: 'Visual inspection confirms light scratching on the external body.',
      status: 'In Progress',
      userGrade: 'F-GRADE',
      userConfidence: '94%',
      defects: [{ type: 'Surface scratches on body', desc: 'Multiple micro-abrasions detected.' }, { type: 'Missing lens cap', desc: 'Primary lens accessory missing.' }],
      agentGrade: '',
      agentDefects: '',
      disagreementCount: 14,
      downgradeRate: '12.4%',
      routing: 'Refurbish',
      riskTier: 'Moderate Risk',
      trend30d: 'up',
      flagReason: 'Stage 1/2 Disagreement',
    },
    {
      id: 'ITEM-22104',
      customerName: 'CUST-****-9003',
      timeWindow: '4:30 PM - 6:30 PM',
      address: '829 S Oakhurst Dr, Apartment 3B',
      district: 'Westside Residential District',
      itemName: 'Sony WH-1000XM4 Wireless Headphones',
      category: 'ACCESSORIES',
      price: 348.00,
      sku: '109283471-B07C1XXR99',
      imgUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCh4E7sKkKlwLI8BPTSwbMLmDj5p6mMhi9NCAbkoAu6qtx2oTiuZhpwOIetPjP6iHWc-IvJ8FdpAjPwkLspEU7htZbeu-L0zvSK2STgSZWTiwfWrGN12cWZKLgvc7wQ-mKPLz25g82ylrO0lNwi4eqSHn_WmCrQv4uB3mBx3pwQSt8RXj2lQoLgxQlj7yStQuHj5AWyHH55fd4OT4XCpzv6cVCyaNinDoF05XCZFyAoC9Fk8DK8oKX0yyCiog6ab2-ku97OYeQdZ-ZR',
      reason: 'wrong_item',
      comments: 'Received headphones with cosmetic scuffs.',
      status: 'Pending',
      userGrade: 'C GRADE',
      userConfidence: '99%',
      defects: [],
      agentGrade: 'B+ GRADE',
      agentDefects: 'Verified headphone condition in field.',
      disagreementCount: 6,
      downgradeRate: '4.1%',
      routing: 'Restock',
      riskTier: 'Medium Risk',
      trend30d: 'flat',
      flagReason: 'Reason Mismatch',
    },
    {
      id: 'ITEM-04491',
      customerName: 'CUST-****-1152',
      timeWindow: '9:00 AM - 11:00 AM',
      address: '4422 E Highland Ave, Unit 12',
      district: 'Commerce Park East',
      itemName: 'Apple Watch Series 8 GPS + Cellular',
      category: 'APPAREL',
      price: 399.00,
      sku: '440291039-B08YYR33KK',
      imgUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD9KGWSpK19ckwLldu4wFVfQ0LGEF6V4NYEqj52uQGhBqxbhcG_k-e0MSpEUqDAlUwEToRqwY-IXDGQuEb9ejylP7E9ox0nhp3iSvMYLX0SKnNkNofRC54EfhhtiSEnxVeMv6M_V2nnR61zFX6ZlKAB3WoHdpLcVa8MGaLr1V-JEMZFG8amkoRTn_bfP07jYvut7lZOsKfd2ZlnkD4RZ143Nfss5DayBLTpX_LQPuqjESNXK_aRtuNUfRmzZJeCsi12j2BfgErGE8Xk',
      reason: 'no_longer_needed',
      comments: 'Return requested by customer.',
      status: 'Pending',
      userGrade: 'D GRADE',
      userConfidence: '98%',
      defects: [],
      agentGrade: '',
      agentDefects: '',
      disagreementCount: 1,
      downgradeRate: '0.8%',
      routing: 'Restock',
      riskTier: 'Critical Risk',
      trend30d: 'down',
      flagReason: 'High-Risk Account',
    },
    {
      id: 'RTN-90214-X',
      customerName: 'CUST-****-7214',
      timeWindow: '10:00 AM - 12:00 PM',
      address: '891 Sunset Blvd, Suite 100',
      district: 'West Hollywood',
      itemName: 'iPhone 15 Pro Max',
      category: 'ELECTRONICS',
      price: 1199.00,
      sku: 'IPH15PM-B0C8V291FF',
      imgUrl: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=100&auto=format&fit=crop',
      reason: 'Defective',
      comments: 'Phone screen is unresponsive on boot.',
      status: 'Pending',
      userGrade: 'GRADE A',
      userConfidence: '99%',
      defects: [{ type: 'Display Mismatch', desc: 'Screen unresponsive' }],
      agentGrade: 'GRADE C',
      agentDefects: 'Verified unresponsive display on site.',
      disagreementCount: 8,
      downgradeRate: '85.2%',
      routing: 'Manual Review',
      riskTier: 'Critical Risk',
      trend30d: 'up',
      flagReason: 'Stage 1/2 Disagreement',
    },
    {
      id: 'RTN-88120-K',
      customerName: 'CUST-****-3310',
      timeWindow: '1:00 PM - 3:00 PM',
      address: '742 Evergreen Terrace',
      district: 'Springfield Log Center',
      itemName: 'Logitech MX Mech',
      category: 'ACCESSORIES',
      price: 199.00,
      sku: 'LOGMX-B09LK1Z91S',
      imgUrl: 'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?w=100&auto=format&fit=crop',
      reason: 'Changed Mind',
      comments: 'Keys are too loud for office work.',
      status: 'Completed',
      userGrade: 'GRADE A',
      userConfidence: '100%',
      defects: [],
      agentGrade: 'GRADE A',
      agentDefects: 'Brand new, sealed condition.',
      disagreementCount: 0,
      downgradeRate: '0.0%',
      routing: 'Back to Seller',
      riskTier: 'Baseline',
      trend30d: 'flat',
      flagReason: 'Normal Return',
    },
    {
      id: 'RTN-77341-P',
      customerName: 'CUST-****-8821',
      timeWindow: '3:00 PM - 5:00 PM',
      address: '1048 Peachtree St NE',
      district: 'Midtown Hub',
      itemName: 'Bose QC45 Black',
      category: 'ACCESSORIES',
      price: 329.00,
      sku: 'BOSEQC45-B098FH299S',
      imgUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=100&auto=format&fit=crop',
      reason: 'Performance',
      comments: 'Bluetooth connection drops frequently.',
      status: 'Completed',
      userGrade: 'GRADE B',
      userConfidence: '95%',
      defects: [],
      agentGrade: 'GRADE B',
      agentDefects: 'Tested connectivity, working as expected.',
      disagreementCount: 1,
      downgradeRate: '1.2%',
      routing: 'Renewed Prep',
      riskTier: 'Baseline',
      trend30d: 'down',
      flagReason: 'General Dispute',
    },
    {
      id: 'RTN-66412-M',
      customerName: 'CUST-****-4451',
      timeWindow: '11:00 AM - 1:00 PM',
      address: '221B Baker St',
      district: 'London Logistics Depot',
      itemName: 'KitchenAid Mixer',
      category: 'ELECTRONICS',
      price: 449.00,
      sku: 'KITCHMIX-B00004SGFW',
      imgUrl: 'https://images.unsplash.com/photo-1578643463396-0997cb5328c1?w=100&auto=format&fit=crop',
      reason: 'Damaged Box',
      comments: 'Mixer is fine but outer packaging is completely torn.',
      status: 'Completed',
      userGrade: 'GRADE C',
      userConfidence: '98%',
      defects: [{ type: 'Packaging Damage', desc: 'Torn outer carton' }],
      agentGrade: 'GRADE C',
      agentDefects: 'Confirmed torn outer carton. Mixer undamaged.',
      disagreementCount: 0,
      downgradeRate: '0.0%',
      routing: 'Donation',
      riskTier: 'Baseline',
      trend30d: 'flat',
      flagReason: 'Packaging Defect',
    },
  ];

  for (const r of returnsData) {
    await prisma.return.upsert({
      where: { id: r.id },
      update: {},
      create: r,
    });
  }
  console.log('✅ Returns seeded:', returnsData.length, 'records');

  // ─────────────────────────────
  // NGO Campaigns
  // ─────────────────────────────
  const campaigns = [
    {
      title: 'Emergency Meals for Coastal Displaced Families',
      ngoName: 'Global Relief Food Bank',
      ngoLogo: 'https://lh3.googleusercontent.com/aida-public/AB6AXuALL3Mlt1wuaYveBNMH_OKXC7MIZVtGMj6pKPrRBSX21ZjBCK0LxF1glNTQ5j1MdVMuoB4havgXpbtqA7M7QyupeFZS8t1372PCBL5EEStbZzZZtsDaSWesS1JHpCyaNjT1v69d5AsHaAUmnBeBkgXdulzJI9-jRlsGJaSV4TkU-grpxP6ffvynOYAkYzwctqrcheRBuXsLDn1oSeLMfwP83zd-zgcwq_LS-lui2U4rJTJ1Hqn8eb3luJw',
      description: 'Providing essential food parcels and nutrition boxes to displaced coastal communities in South India.',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAtxhwG-BqBNhrwQj46c44uU5m6UzvYlKpM0QNQE_tzz8Z_GVgMtl75EOjhBKf5S0TAhauxJkfJt3V1GF-UMyYyw_vMgfmFnIFIx6WFx8DFJNKbzRqmAVGZ-hqTjeSTJd7T5FQaG7P-UjQv-FuokjohKo9YtFRyDdNNsRjC9ty5_6KtZ8BW0GtBwkWm3sCVLbFfBGI6WbmK8lGUk5R52ilQ3S7igZ1Zu1WJQhXvhIFpDmFg5iFRn5EX2w',
      urgency: 'high', category: 'Food Security', progress: 64, received: 32, target: 50, unit: 'packages', location: 'Chennai, Tamil Nadu',
    },
    {
      title: 'Digital Literacy Kits for Rural Students',
      ngoName: 'LearnForward Global',
      ngoLogo: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCwfTWCFM9JVbDdxCgRarK_1Q8t-zySJRyyLRLcTdrFVrre5z3bq7ZHaB31j7y1_OLqfIJbgCgU7nzxfrCm_7JNsgf8xWfV6kc5Zhm-qp_xnU-1puAVNVfcqIDOudMjQk6vZPTtIuRYrM46EMY5cWbqvSuABJYmp78evzSOznK-dWplmXgczBuozuUauY7uS5RJmAZQUt5C5jFKfvtdIueLjGG_Xs4lScCHmt5LAXL6TLyKNVOtfToi9g',
      description: 'Procuring and distributing educational kits and tablets for rural classrooms lacking basic tech setup.',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBTuPh9OTxaTgSjHP0yHaw6nkpPWYi0TwSwLSWPVgX6TEHe-1ZRUf-U0SmKFesPz6ZLs1cV96I_tVIU4AGOZJXGC5NVzuuF9BMGh0V8fE429iD9BiU6pUSfu5cfMmxH7SjLTw3LGs8kgvhjpnQySktSM-iYqwunungzTq_tzY2yEELjS52OOwb5NWaaO00f78Cef3REldGtHlRA1HaJjuOFJO5LsH6G489-Pf-Vg-Rsu2elSien7a59EA',
      urgency: 'standard', category: 'Education', progress: 24, received: 12, target: 50, unit: 'kits', location: 'Pune, Maharashtra',
    },
    {
      title: 'Safe Housing Units for Single Mothers',
      ngoName: 'ShelterSolutions Int.',
      ngoLogo: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBUeN1KM2YnkW4urp-tKH2cptNA_itZFbV9-iYXV7C3FCPJnK9pQqYzZeIC3vi6CzFePslKslMvxadNYwPiQVu2BaGBHu2NF0cWoGmQMWJPtlS7agKw0fSKT5M_wqkzm0ANyNdK4KmoGczsPN1FR5u3LAXVEBpV9jCDGybG-bteQShHeb696lPqZHPZts7R0iYnCFTDGW7LCybcjywZNOKVkBR9ibQNGbAh4m9iTd1gckSON1vC81R96A',
      description: 'Building transitional eco-friendly shelter units with clean amenities for low-income single mothers.',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB68YDjh71LZnm3SDdlfG478aqGt-s2izF1ucw5M1WiT1_l3pVaqTcRMBl5zkuBOib_aeZ5VTxbuh6p8SZLEk6EasEWbGA-V1XkGvbyZcvadW5K94pFStQuBzZ_-SPKTQxPC4wR8FDdSc-gKMNeEYMviU4hA5oNV1U-Bj39bC_DTDiZttUVfOG8D1rd9B0pSyllu2elRLqdZMNg8MOFV_YlRw5ysN_bTfJJYI26t2fYFHi9YKrAsm3aBg',
      urgency: 'standard', category: 'Emergency Shelter', progress: 90, received: 45, target: 50, unit: 'funded', location: 'Bengaluru, Karnataka',
    },
    {
      title: 'Clean Water Initiative: Solar Pumps',
      ngoName: 'GreenEarth Alliance',
      ngoLogo: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCdBKOC5aGKXtP3QmmGYlZpUjq9T2MG1zN8WtjPPnTfgutZV_4uXWOq74g-nnrwSdOcXJfr5OzVmbt9EhRAHYCdo2jKGZBXonAdQM3QnJsSXhHeY7AeMWS59YFGlw4NdceAwvmkqtungcqlwV9IXmXt81EyBs1nWL6LI1k-lfFb2L7Jz0aIMiVjujT5aGyP95MXpPGUQ9wgVw-NtkMUJ3m0alWfgQfMNBwQ5ARFdte6DJbae3c-0T-X7A',
      description: 'Providing sustainable water access through solar-powered pumps for drought-affected areas.',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA-s9i63pIhk7HllMd6iOdnldZHEy_yQTFKglJ6bO6MMjcqyJkS1ytJ8TvBGsDueUuy6G44dYZCwK5KWU2Mu0WRHQWlcLVg1x-ypa9CSEKISDbpx_6pC7Gme12qY_Yzm9AuAUPmB8CI5QV58FtnH6z3NV04Pz1Z6b670vJF62hVXg1KnOQ-vbCQKUo-D_7H4XVfvHuQ9dv2wRNuLD_lDxtpLLMZ2BnKeW_NQofAIrIk_-gjso-b12XQQ',
      urgency: 'high', category: 'Sustainability', progress: 75, received: 15, target: 20, unit: 'pumps', location: 'Hyderabad, Telangana',
    },
    {
      title: 'Amazon Basin Reforestation',
      ngoName: 'GreenEarth Alliance',
      ngoLogo: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCdBKOC5aGKXtP3QmmGYlZpUjq9T2MG1zN8WtjPPnTfgutZV_4uXWOq74g-nnrwSdOcXJfr5OzVmbt9EhRAHYCdo2jKGZBXonAdQM3QnJsSXhHeY7AeMWS59YFGlw4NdceAwvmkqtungcqlwV9IXmXt81EyBs1nWL6LI1k-lfFb2L7Jz0aIMiVjujT5aGyP95MXpPGUQ9wgVw-NtkMUJ3m0alWfgQfMNBwQ5ARFdte6DJbae3c-0T-X7A',
      description: 'Restoring rainforest cover through native species planting and community stewardship.',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDCQkCtwokaRMdYsoLYToIyQtjrzQYelfPYqsBtkXGigmpMtd1KTg-EemDtvTkC3uPRHrVN0vJH488vaPh_hrhXB90xUWv7MyEMPpz8ciOkYjjKU2Nl0qumlWIXsAOdHCuqAJ8Op7U4aUK1lebePPLE5KEOZiqBHtFLRqTkwsyLQBnDx_YSxzdcCeyOaOByMTikjWZpa1CC_iEAZ403u2ntm37u3fTvskDEVF1rveE1yJ1vrU450eD-Pw',
      urgency: 'standard', category: 'Sustainability', progress: 42, received: 42, target: 100, unit: 'acres', location: 'Nairobi, Kenya',
    },
    {
      title: 'Secondary Science Lab Equipment',
      ngoName: 'Global Literacy Initiative',
      ngoLogo: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCwfTWCFM9JVbDdxCgRarK_1Q8t-zySJRyyLRLcTdrFVrre5z3bq7ZHaB31j7y1_OLqfIJbgCgU7nzxfrCm_7JNsgf8xWfV6kc5Zhm-qp_xnU-1puAVNVfcqIDOudMjQk6vZPTtIuRYrM46EMY5cWbqvSuABJYmp78evzSOznK-dWplmXgczBuozuUauY7uS5RJmAZQUt5C5jFKfvtdIueLjGG_Xs4lScCHmt5LAXL6TLyKNVOtfToi9g',
      description: 'Procuring and setting up biology and chemistry laboratory kits for higher secondary classrooms.',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB6qJsw7Is1nszzoHXJNX7JxsX191vYRMzzpv8MllL4rBtJ7_rf27rKcu4bM2pFpXD5-FZKiZ1d3poINO_mTZgb7z80vDL3i7L7BGzb1w3wGGUwS3tuUB9rfeDftRt2R0oOXoKmTl7mAwxbdjUxx7Fifl_6YswZ1y_KjsFvi3PCR8zyd8FfN9IjZJxrwV9-DnUsBpaLTyxtOH6s9ZiwLiC6vlpuVQdM9hqsf9UouWn6E_Ew9_JLhdw6_Q',
      urgency: 'standard', category: 'Education', progress: 40, received: 12, target: 30, unit: 'kits', location: 'Mumbai, Maharashtra',
    },
  ];

  for (const c of campaigns) {
    await prisma.ngoCampaign.create({ data: c });
  }
  console.log('✅ NGO Campaigns seeded:', campaigns.length, 'records');

  // ─────────────────────────────
  // Donation History
  // ─────────────────────────────
  const history = [
    { userId: defaultUser.id, date: 'Oct 24, 2026', ngo: 'GreenEarth Foundation', logo: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBcBOdx-t4JAYW_02uJ4afwhHNlB0av7y8AoRmG0v877q8Fw9z9FoVWNutehuXcggvVu3VMEcN_PEgPpgt2f6EI6_eA1fQv1KYX9FzBwZiWViboLI9ScBeJOhlMdVrky_mbKvBDU7HMAxRjCrer-941KtUWa_yNeDEPGRMk1PziaAM8OG4koBiPaofPafAPRjD25u4FfZyfFIcwRBD1lnwf3JhYKF0pkfa4jgrBENTfqgkufnOVz_Tm5g', action: 'Direct Donation', credits: 50, isMe: true },
    { userId: defaultUser.id, date: 'Oct 18, 2026', ngo: 'WaterCare Int.', logo: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBgHEZbD7WMhq6QjH1NcSWZjDN3NGKLonCjswAEBXO3Mv5o6IVevR6rcCkgBxK8ltc66uB4Y4pQG4ByyOrmHTRtWYEEHScgoHXk59rEBiNzemCgOuLyydF-YtT-tNzQnMJntjoCxYdNi7HSSPRJMZjMpfR9hdDImrUOdhsz6LqWI8coMjn7sUtxkirOf9pkua8AyhpIKkzNAGWKB2XrNjrWaExETQCKv_Udof6RF_faCUSm0ECpwAw7bw', action: 'Campaign Support', credits: 25, isMe: true },
    { userId: defaultUser.id, date: 'Oct 12, 2026', ngo: 'MarketConnect Store', logo: '', action: 'Redemption (Listing)', credits: -100, isMe: false },
    { userId: defaultUser.id, date: 'Oct 05, 2026', ngo: 'EduReach Global', logo: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA9NljDma2gixaoV0GaJVGccPK5E7xOsmyW1RYAn9qKacLY94xohIYASE3pItA5rwZLkSiK1pth3XO33AP2qJKWdDuO8BUWFOFobAsvispldoXrfmrzbt6ZAGpHP2GSyFWvIxQURb_JwnnoPxhQHzKfoJY7mdbhwPRcv0ky34LAqibR8lR6XFjLHTim8-ejElxhp_xgtFdNhnfTm_ozOENAC6rIkx_eShEYbIzJ2gDJdMMs3Q2Jia_WJQ', action: 'Monthly Contribution', credits: 100, isMe: true },
    { userId: defaultUser.id, date: 'Sep 28, 2026', ngo: 'Paws & Hearts', logo: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDi9AFuaWDtWEoMrBoieQiZVa3gsm0TP86ocMdCqR_g-kJeTEU8otbK-LWptsx6StuItGi3ZxFy0u3WX77VVSurSyHoaf-s30A_Xhn3R5w6pamRYGnvw-voCFCpqbzXFtcmX5psEjbg61egvAWDcP2zdjoCd18BRh3VaeXoGMFlbDwjU_refte0ZoVssIkA7Kx0MGoL5RY0bacy4xqH1k7srccvtJ8aRz1aWy7hh-FVPXRHnHLm8qO2NQ', action: 'Matching Gift', credits: 200, isMe: true },
  ];

  await prisma.donationHistory.createMany({ data: history });
  console.log('✅ Donation history seeded:', history.length, 'records');

  console.log('\n🎉 Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
