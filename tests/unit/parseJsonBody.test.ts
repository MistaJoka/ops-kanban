import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { NextResponse } from 'next/server';

import { parseJsonBody } from '@/lib/api/parseJsonBody';
import { withPublicRoute, withWebhookRoute } from '@/lib/api/withApiRoute';

describe('parseJsonBody', () => {
  const schema = z.object({ name: z.string().min(1, 'Name is required') });

  it('UNIT-API-001: returns 400 for invalid JSON', async () => {
    const request = new Request('http://localhost/api/test', {
      method: 'POST',
      body: 'not-json',
    });

    const result = await parseJsonBody(request, schema);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.response.status).toBe(400);
      const payload = await result.response.json();
      expect(payload).toMatchObject({ code: 'VALIDATION_ERROR' });
    }
  });

  it('UNIT-API-001: returns 400 with first Zod issue message', async () => {
    const request = new Request('http://localhost/api/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: '' }),
    });

    const result = await parseJsonBody(request, schema);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      const payload = await result.response.json();
      expect(payload.error).toBe('Name is required');
    }
  });

  it('UNIT-API-001: returns parsed data on success', async () => {
    const request = new Request('http://localhost/api/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Acme' }),
    });

    const result = await parseJsonBody(request, schema);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual({ name: 'Acme' });
    }
  });
});

describe('withPublicRoute', () => {
  it('UNIT-API-002: returns JSON error when handler throws', async () => {
    const request = new Request('http://localhost/api/inquiry/test');
    const response = await withPublicRoute(
      request,
      async () => {
        throw new Error('Public route failed');
      },
      { route: '/api/inquiry/test' },
    );

    expect(response.status).toBe(500);
    const payload = await response.json();
    expect(payload).toMatchObject({
      error: 'Public route failed',
      code: 'INTERNAL_ERROR',
    });
  });

  it('UNIT-API-002: passes through successful handler response', async () => {
    const request = new Request('http://localhost/api/inquiry/test');
    const response = await withPublicRoute(request, async () =>
      NextResponse.json({ data: { ok: true } }),
    );

    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(payload.data).toEqual({ ok: true });
  });
});

describe('withWebhookRoute', () => {
  it('UNIT-API-002: returns JSON error when webhook handler throws', async () => {
    const request = new Request('http://localhost/api/webhooks/twilio', { method: 'POST' });
    const response = await withWebhookRoute(
      request,
      async () => {
        throw new Error('Webhook processing failed');
      },
      { route: '/api/webhooks/twilio' },
    );

    expect(response.status).toBe(500);
    const payload = await response.json();
    expect(payload).toMatchObject({
      error: 'Webhook processing failed',
      code: 'INTERNAL_ERROR',
    });
  });
});
