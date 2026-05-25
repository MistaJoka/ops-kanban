import { describe, expect, it, vi } from 'vitest';
import { NextResponse } from 'next/server';

import { withApiRouteNoRequest } from '@/lib/api/withApiRoute';

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

describe('withApiRoute', () => {
  it('INT-API-500: returns JSON error when handler throws', async () => {
    const response = await withApiRouteNoRequest(async () => {
      throw new Error('Database exploded');
    }, { route: '/api/test' });

    expect(response.status).toBe(500);
    const payload = await response.json();
    expect(payload).toMatchObject({
      error: 'Database exploded',
      code: 'INTERNAL_ERROR',
    });
  });

  it('INT-API-500: passes through successful handler response', async () => {
    const response = await withApiRouteNoRequest(async () =>
      NextResponse.json({ data: { ok: true } }),
    );

    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(payload.data).toEqual({ ok: true });
  });
});
