// Using native global fetch available in Node.js 18+

const BASE_URL = 'http://localhost:5000';

async function testRoute(name, url, options = {}) {
  try {
    const res = await fetch(url, options);
    const data = await res.json();
    console.log(`\n🔹 [${name}] ${options.method || 'GET'} ${url.replace(BASE_URL, '')}`);
    console.log(`Status: ${res.status} ${res.statusText}`);
    if (res.status >= 400) {
      console.error('❌ Error body:', data);
    } else {
      console.log('✅ Success: Received data length / keys:', Array.isArray(data) ? `Array of size ${data.length}` : Object.keys(data));
      if (name === 'Get Returns' && data.length > 0) {
        console.log('Sample item:', { id: data[0].id, itemName: data[0].itemName, price: data[0].price });
      }
    }
    return { status: res.status, data };
  } catch (err) {
    console.error(`❌ [${name}] Request failed:`, err.message);
    return { status: 500, error: err.message };
  }
}

async function runTests() {
  console.log('🚀 Starting Backend Diagnostic Tool...');

  // 1. Health check
  await testRoute('Health Check', `${BASE_URL}/health`);

  // 2. Returns API
  const returns = await testRoute('Get Returns', `${BASE_URL}/api/returns`);
  
  if (returns.status === 200 && returns.data.length > 0) {
    const sampleId = returns.data[0].id;
    // Get single return
    await testRoute('Get Single Return', `${BASE_URL}/api/returns/${sampleId}`);
    
    // Update return (Agent assessment)
    await testRoute('Update Return (Agent)', `${BASE_URL}/api/returns/${sampleId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'Completed',
        agentGrade: 'GRADE A',
        agentDefects: 'No defects found.',
      }),
    });
  }

  // 3. P2P Market API
  const products = await testRoute('Get Products', `${BASE_URL}/api/p2p/products`);
  
  // Create product listing
  await testRoute('Create Product', `${BASE_URL}/api/p2p/products`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: 'Sony Alpha Camera',
      price: 1200.00,
      originalPrice: 1500.00,
      category: 'Electronics',
      sellerName: 'David Chen',
      condition: 'Like New',
      description: 'Barely used professional camera.',
    }),
  });

  // Get/Create P2P Chat
  const chatResult = await testRoute('Create P2P Chat', `${BASE_URL}/api/p2p/chats`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sellerName: 'David Chen',
      itemTitle: 'Sony Alpha Camera',
      itemPrice: '1200',
    }),
  });

  if (chatResult.status === 201 || chatResult.status === 200) {
    const chatId = chatResult.data.id;
    // Send P2P message
    await testRoute('Send P2P Message', `${BASE_URL}/api/p2p/chats/${chatId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: 'Is this camera still available for inspection?',
        isMe: true,
        senderName: 'Me',
      }),
    });
  }

  // 4. Donations API
  const campaigns = await testRoute('Get Campaigns', `${BASE_URL}/api/donations/campaigns`);
  
  if (campaigns.status === 200 && campaigns.data.length > 0) {
    const sampleCampId = campaigns.data[0].id;
    // Donate
    await testRoute('Donate to Campaign', `${BASE_URL}/api/donations/donate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        campaignId: sampleCampId,
        itemCategory: 'Food Security',
        qty: 2,
      }),
    });
  }

  // Redeem Green Credits (Edge Case: insufficient credits / success)
  await testRoute('Redeem Credits (Edge Case - Success)', `${BASE_URL}/api/donations/redeem`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      tierCredits: 10,
      perkTitle: '₹100 Amazon Gift Card',
    }),
  });

  await testRoute('Redeem Credits (Edge Case - Insufficient)', `${BASE_URL}/api/donations/redeem`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      tierCredits: 999999, // Way too high
      perkTitle: 'Super Special Perk',
    }),
  });

  // 5. Profile API
  await testRoute('Get Profile', `${BASE_URL}/api/profile`);
  await testRoute('Get Leaderboard', `${BASE_URL}/api/profile/leaderboard`);

  console.log('\n🏁 Diagnostic check complete!');
}

runTests();
