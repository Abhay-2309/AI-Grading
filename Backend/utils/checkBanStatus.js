import prisma from '../db.js';

/**
 * checkBanStatus middleware
 *
 * Reads the userId from either:
 *   - req.headers['x-user-id']  (set by the frontend on every authenticated call)
 *   - req.body.userId            (fallback for POST bodies)
 *
 * If the corresponding Profile has isBanned === true, it immediately returns
 * 403 Forbidden and stops the request chain.  All other requests pass through.
 */
export async function checkBanStatus(req, res, next) {
  const userId =
    req.headers['x-user-id'] ||
    req.body?.userId ||
    req.query?.userId;

  // No identity supplied — let the route handle auth/404 itself
  if (!userId) return next();

  try {
    const profile = await prisma.profile.findUnique({
      where: { id: userId },
      select: { isBanned: true },
    });

    if (profile?.isBanned) {
      return res.status(403).json({
        error: 'Account suspended due to policy violations. Contact support.',
      });
    }

    return next();
  } catch (err) {
    console.error('checkBanStatus middleware error:', err);
    // Fail open: don't block requests if the DB call fails
    return next();
  }
}
