import * as Sentry from '@sentry/nextjs';

import { logError } from '@/lib/ops/logError';

type CaptureContext = {
  route?: string;
  surface?: string;
  orgId?: string;
  digest?: string;
  componentStack?: string;
};

function isSentryEnabled(): boolean {
  return Boolean(process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN);
}

export function captureApiError(error: unknown, context: CaptureContext = {}) {
  const message = error instanceof Error ? error.message : 'Unknown API error';
  logError(message, {
    route: context.route,
    code: context.surface,
    orgId: context.orgId,
    digest: context.digest,
  });

  if (isSentryEnabled()) {
    Sentry.captureException(error, {
      tags: { route: context.route, surface: context.surface },
      extra: { orgId: context.orgId, digest: context.digest },
    });
  }
}

export function captureClientError(error: unknown, context: CaptureContext = {}) {
  const message = error instanceof Error ? error.message : 'Unknown client error';
  logError(message, {
    route: context.surface,
    digest: context.digest,
  });

  if (isSentryEnabled()) {
    Sentry.captureException(error, {
      tags: { surface: context.surface },
      extra: { componentStack: context.componentStack, digest: context.digest },
    });
  }
}

export function captureSyncFailure(message: string, context: CaptureContext = {}) {
  logError(message, { route: context.surface, code: 'SYNC_FAILURE' });

  if (isSentryEnabled()) {
    Sentry.captureMessage(message, {
      level: 'warning',
      tags: { surface: context.surface ?? 'outbound-sync' },
    });
  }
}
