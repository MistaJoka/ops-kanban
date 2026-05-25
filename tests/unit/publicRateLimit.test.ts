import { describe, expect, it } from 'vitest';

import { checkPublicRateLimit } from '@/lib/api/publicRateLimit';

describe('publicRateLimit', () => {
  it('UNIT-RATE-001: returns 429 after limit exceeded', () => {
    const request = new Request('http://localhost/api/inquiry/test', {
      headers: { 'x-forwarded-for': '203.0.113.10' },
    });
    const config = { routeKey: 'test-post', slug: 'demo', limit: 10 };

    for (let i = 0; i < 10; i += 1) {
      expect(checkPublicRateLimit(request, config).allowed).toBe(true);
    }

    const blocked = checkPublicRateLimit(request, config);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterMs).toBeGreaterThan(0);
  });
});
