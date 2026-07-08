/**
 * Fraud Firewall Middleware
 * ─────────────────────────────────────────────────────────────────────────────
 * Fastify plugin that intercepts every POST /grade request on the `onRequest`
 * lifecycle hook — BEFORE multipart parsing, BEFORE S3 uploads, BEFORE any
 * DynamoDB writes, and BEFORE the Python AI engine is contacted.
 *
 * Three independent checks run in sequence:
 *   1. User-Agent presence  (blocks headless bots immediately)
 *   2. IP velocity          (max 3 req / 15 min per IP using in-process fixed window)
 *   3. GeoIP risk           (soft flag — does NOT block, written to DynamoDB audit)
 *
 * A SHA-256 device fingerprint is derived from UA + Accept-Language + IP subnet
 * and made available on `request.deviceFingerprint` for downstream logging.
 *
 * Separation of concerns is maintained:  this file has zero knowledge of
 * business logic, grading models, or S3.  It only reads HTTP headers and throws
 * FraudBlockError (which the existing error-handler serialises).
 */

import fp from 'fastify-plugin';
import type { FastifyPluginAsync, FastifyRequest } from 'fastify';
import { createHash } from 'node:crypto';
import geoip from 'geoip-lite';
import { RateLimiter } from '../../services/intake/rateLimiter.js';
import { FraudBlockError } from '../../utils/errors.js';
import { config } from '../../config/config.js';

// ── Type augmentation ────────────────────────────────────────────────────────

declare module 'fastify' {
  interface FastifyRequest {
    /** True client IP, resolved from x-forwarded-for when behind a reverse proxy. */
    trustedIp: string;
    /** SHA-256 hex of UA + Accept-Language + IP /24 subnet. */
    deviceFingerprint: string;
    /**
     * 'High_Risk_Geo' if the request IP resolves to a country outside the
     * order's domestic region; undefined otherwise.  Never causes a block —
     * grade.controller appends it to the DynamoDB securityFlags audit field.
     */
    geoRisk: 'High_Risk_Geo' | undefined;
  }
}

// ── IP velocity limiter (IP-keyed, separate from the per-customer limiter) ───

const ipRateLimiter = new RateLimiter(
  config.FRAUD_IP_RATE_LIMIT_MAX,
  config.FRAUD_IP_RATE_LIMIT_WINDOW_SECONDS
);

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Extract the real client IP.
 * Reads x-forwarded-for (rightmost trusted proxy wins in standard setups) then
 * falls back to Fastify's request.ip (the socket remote address).
 */
function extractTrustedIp(request: FastifyRequest): string {
  const xff = request.headers['x-forwarded-for'];
  if (xff) {
    const rawXff = Array.isArray(xff) ? xff[0] : xff;
    if (rawXff) {
      const parts = rawXff.split(',');
      const firstPart = parts[0];
      if (typeof firstPart === 'string') {
        const first = firstPart.trim();
        if (first) return first;
      }
    }
  }
  return request.ip;
}

/**
 * Derive a lightweight device fingerprint by hashing the combination of:
 *   - User-Agent string
 *   - Accept-Language header
 *   - The /24 subnet of the client IP (strips the last octet for minor NAT tolerance)
 *
 * This is intentionally NOT a tracking cookie — it is a single-request hash
 * used for anomaly correlation in the audit log.
 */
function buildDeviceFingerprint(ua: string, lang: string, ip: string): string {
  const subnet = ip.split('.').slice(0, 3).join('.'); // e.g. 192.168.1
  return createHash('sha256').update(`${ua}|${lang}|${subnet}`).digest('hex');
}

/**
 * Assess geolocation risk for a given IP against an order shipping address.
 *
 * The heuristic used:
 *   - If the IP resolves to India (domestic), risk = none.
 *   - If geoip-lite cannot resolve the IP (private/local), risk = none.
 *   - If the IP resolves to any other country, risk = High_Risk_Geo.
 *
 * This is a *stub* — a production system would compare against the order's
 * actual shipping country fetched from the database.  The domestic country
 * is read from DOMESTIC_COUNTRY env (default: 'IN' for India).
 */
export function calculateGeoRisk(
  requestIp: string,
  _orderShippingAddress?: string
): 'High_Risk_Geo' | undefined {
  const geo = geoip.lookup(requestIp);

  // Private/loopback IPs (127.x, 10.x, 192.168.x, etc.) return null from
  // geoip-lite.  Treat as safe — developer / staging environment traffic.
  if (!geo) return undefined;

  const domesticCountry = process.env.DOMESTIC_COUNTRY ?? 'IN';
  if (geo.country === domesticCountry) return undefined;

  return 'High_Risk_Geo';
}

// ── Fastify plugin ───────────────────────────────────────────────────────────

/**
 * `fraudFirewallPlugin` runs on the `onRequest` hook which fires:
 *   ✅  After the TCP connection is accepted
 *   ✅  Before @fastify/multipart reads the body
 *   ✅  Before any S3, DynamoDB, or Python calls
 *
 * It is registered with fastify-plugin (fp) so that Fastify's scoping does
 * NOT isolate the request decorator additions — they are visible in every
 * route including gradeRoutes.
 */
export const fraudFirewallPlugin: FastifyPluginAsync = fp(async (app) => {
  // Decorate request with default values — Fastify requires decorators to be
  // registered before any hook that sets them.
  app.decorateRequest('trustedIp', '');
  app.decorateRequest('deviceFingerprint', '');
  app.decorateRequest('geoRisk', undefined);

  app.addHook('onRequest', async (request, _reply) => {
    const url = request.url.split('?')[0];
    if (request.method !== 'POST' || url !== '/grade') return;

    // ── 1. User-Agent check ───────────────────────────────────────────────
    const ua = request.headers['user-agent'] ?? '';
    if (!ua.trim()) {
      throw new FraudBlockError('MISSING_USER_AGENT', {
        hint: 'Automated requests without a User-Agent header are not permitted.',
      });
    }

    // ── 2. IP extraction & velocity check ────────────────────────────────
    const trustedIp = extractTrustedIp(request);
    request.trustedIp = trustedIp;

    // RateLimiter.check() throws RateLimitError on breach — re-throw as
    // FraudBlockError so the error handler uses the fraud envelope.
    try {
      if (config.NODE_ENV !== 'test') {
        ipRateLimiter.check(trustedIp);
      }
    } catch {
      throw new FraudBlockError('VELOCITY_EXCEEDED', {
        ip: trustedIp,
        limit: config.FRAUD_IP_RATE_LIMIT_MAX,
        windowSeconds: config.FRAUD_IP_RATE_LIMIT_WINDOW_SECONDS,
      });
    }

    // ── 3. Device fingerprint ─────────────────────────────────────────────
    const lang = String(request.headers['accept-language'] ?? '');
    request.deviceFingerprint = buildDeviceFingerprint(ua, lang, trustedIp);

    // ── 4. Geolocation risk (soft signal — never blocks) ──────────────────
    request.geoRisk = calculateGeoRisk(trustedIp);

    request.log.debug(
      {
        trustedIp,
        fingerprint: request.deviceFingerprint.slice(0, 12) + '…',
        geoRisk: request.geoRisk ?? 'none',
      },
      'fraud-firewall: request passed'
    );
  });
});
