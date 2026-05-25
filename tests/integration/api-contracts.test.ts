import { describe, expect, it, vi } from 'vitest';
import { NextResponse } from 'next/server';

import { POST as createCardPost } from '@/app/api/cards/route';
import { withApiRouteNoRequest } from '@/lib/api/withApiRoute';
import { DomainError } from '@/lib/domain/errors';

vi.mock('@/lib/domain/api/handlerContext', () => ({
  getHandlerContext: vi.fn(async () => ({
    client: {},
    organizationId: 'org-1',
    userId: 'user-1',
    role: 'owner',
  })),
  isHandlerContext: (value: unknown) =>
    typeof value === 'object' && value !== null && 'organizationId' in value,
}));

describe('INT-API contract envelopes', () => {
  it('INT-API-500: withApiRoute returns JSON error envelope on throw', async () => {
    const response = await withApiRouteNoRequest(async () => {
      throw new DomainError('Database exploded', 'VALIDATION_ERROR');
    }, { route: '/api/test' });

    expect(response.status).toBe(400);
    const payload = await response.json();
    expect(payload).toMatchObject({
      error: 'Database exploded',
      code: 'VALIDATION_ERROR',
    });
  });

  it('INT-API-101: POST /api/cards rejects invalid JSON with 400', async () => {
    const response = await createCardPost(
      new Request('http://localhost/api/cards', {
        method: 'POST',
        body: 'not-json',
      }),
    );

    expect(response.status).toBe(400);
    const payload = await response.json();
    expect(payload.code).toBe('VALIDATION_ERROR');
  });

  it('INT-API-101: POST /api/cards rejects missing title with 400', async () => {
    const response = await createCardPost(
      new Request('http://localhost/api/cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: '' }),
      }),
    );

    expect(response.status).toBe(400);
    const payload = await response.json();
    expect(payload.code).toBe('VALIDATION_ERROR');
  });
});

describe('INT-API-PUB-001 public rate limits', () => {
  it('returns RATE_LIMITED JSON when limit exceeded', async () => {
    const { withPublicRoute } = await import('@/lib/api/withApiRoute');
    const request = new Request('http://localhost/api/inquiry/demo', {
      method: 'POST',
      headers: { 'x-forwarded-for': '198.51.100.44' },
    });

    let response: NextResponse | null = null;
    for (let i = 0; i < 11; i += 1) {
      response = await withPublicRoute(
        request,
        async () => NextResponse.json({ data: { ok: true } }),
        {
          route: '/api/inquiry/demo',
          rateLimit: { routeKey: 'contract-test', slug: 'demo', limit: 10 },
        },
      );
    }

    expect(response?.status).toBe(429);
    const payload = await response!.json();
    expect(payload.code).toBe('RATE_LIMITED');
  });
});
