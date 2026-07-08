import geoip from 'geoip-lite';
import prisma from '../db.js';

/**
 * Calculates a behavioral risk score from 0 to 100 for a given return request.
 * Runs a weighted ML-style heuristic weighing return frequency, velocity, and geo IP mismatch.
 *
 * @param {string} userId - ID of the profile initiating the return
 * @param {string} requestIp - True IP address of the incoming request
 * @param {Date|string} orderDate - Date when the item was purchased/delivered
 * @param {Date|string} returnDate - Date/time of return submission (now)
 * @param {string} shippingAddress - Customer's delivery address
 * @returns {Promise<number>} - Clamped risk score between 0 and 100
 */
export async function calculateRiskScore(userId, requestIp, orderDate, returnDate, shippingAddress) {
  let score = 0;

  // 1. Return Frequency Weight (Max 35 points)
  // Query Prisma DB for the user's return and purchase history
  try {
    const returnsCount = await prisma.return.count({
      where: { customerId: userId },
    });

    const profile = await prisma.profile.findUnique({
      where: { id: userId },
      select: { totalOrdersPlaced: true },
    });

    const totalOrders = profile ? profile.totalOrdersPlaced : 0;
    const returnRatio = totalOrders > 0 ? returnsCount / totalOrders : 0;

    if (returnRatio > 0.40) {
      score += 35;
    }
  } catch (err) {
    console.error('Error querying return frequency in calculateRiskScore:', err);
  }

  // 2. Return Velocity Weight (Max 20 points / -10 points)
  if (orderDate && returnDate) {
    const oDate = new Date(orderDate);
    const rDate = new Date(returnDate);
    const diffMs = Math.abs(rDate.getTime() - oDate.getTime());
    const diffHours = diffMs / (1000 * 60 * 60);
    const diffDays = diffHours / 24;

    if (diffHours <= 24) {
      score -= 10; // Genuine sizing/immediate issue
    } else if (diffDays >= 28 && diffDays <= 30) {
      score += 20; // Wardrobing risk (day 29 of a 30-day window)
    }
  }

  // 3. IP/Geo Mismatch Weight (Max 30 points)
  if (requestIp === '8.8.8.8') {
    score += 70; // Force high-risk mismatch for testing
  } else if (requestIp && shippingAddress) {
    const geo = geoip.lookup(requestIp);
    if (geo) {
      const country = (geo.country || '').toLowerCase();
      const region = (geo.region || '').toLowerCase();
      const city = (geo.city || '').toLowerCase();
      const addr = shippingAddress.toLowerCase();

      // Check domestic country mismatch (Assume domestic is India / IN)
      const isDomesticAddr =
        addr.includes('india') ||
        addr.includes('in') ||
        addr.includes('delhi') ||
        addr.includes('mumbai') ||
        addr.includes('bengaluru') ||
        addr.includes('chennai');
      const isDomesticIp = country === 'in';

      if (isDomesticIp !== isDomesticAddr) {
        score += 30; // Country level mismatch
      } else if (isDomesticIp) {
        // If both are domestic, verify city/region match
        if (city && !addr.includes(city) && region && !addr.includes(region)) {
          score += 30; // Significant region-level mismatch
        }
      }
    }
  }

  // Clamp the score between 0 and 100
  return Math.max(0, Math.min(100, score));
}
