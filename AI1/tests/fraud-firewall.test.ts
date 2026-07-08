import { describe, it, expect } from 'vitest';
import { calculateGeoRisk } from '../src/api/middleware/fraud-firewall.js';
import { buildApp } from '../src/app.js';

describe('Fraud Firewall Unit Tests', () => {
  describe('calculateGeoRisk', () => {
    it('returns undefined for local/private IP addresses (failsafe/fails open)', () => {
      expect(calculateGeoRisk('127.0.0.1')).toBeUndefined();
      expect(calculateGeoRisk('192.168.1.1')).toBeUndefined();
      expect(calculateGeoRisk('10.0.0.1')).toBeUndefined();
    });

    it('returns undefined for domestic Indian IP addresses', () => {
      // 103.206.115.1 is an IP registered in India
      expect(calculateGeoRisk('103.206.115.1')).toBeUndefined();
    });

    it('returns High_Risk_Geo for international IP addresses (e.g., US/UK)', () => {
      // 8.8.8.8 resolves to US
      expect(calculateGeoRisk('8.8.8.8')).toBe('High_Risk_Geo');
    });
  });

  describe('Fastify Integration Rejections', () => {
    it('rejects POST /grade with missing User-Agent header', async () => {
      const app = await buildApp();
      const res = await app.inject({
        method: 'POST',
        url: '/grade',
        headers: {
          'content-type': 'multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW',
          'user-agent': ''
        },
      });

      expect(res.statusCode).toBe(403);
      const body = res.json();
      expect(body).toEqual({
        status: 'FRAUD_FLAG',
        reason: 'MISSING_USER_AGENT',
      });
    });

    it('allows GET /health and GET /ready even with missing User-Agent', async () => {
      const app = await buildApp();
      const resHealth = await app.inject({
        method: 'GET',
        url: '/health',
        headers: {},
      });
      expect(resHealth.statusCode).toBe(200);

      // We don't test /ready because it attempts connection to DynamoDB/S3 which is skipped or stubbed.
    });
  });
});
