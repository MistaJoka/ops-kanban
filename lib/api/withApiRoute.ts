import type { NextResponse } from 'next/server';

import { jsonError } from '@/lib/api/response';
import { checkPublicRateLimit, type PublicRateLimitConfig } from '@/lib/api/publicRateLimit';
import { domainErrorToResponse } from '@/lib/domain/db/mapSupabaseError';
import { getHandlerContext, isHandlerContext, type HandlerContext } from '@/lib/domain/api/handlerContext';
import { captureApiError } from '@/lib/ops/captureError';

type ApiHandler = (context: HandlerContext, request: Request) => Promise<NextResponse>;

type RouteHandlerOptions = {
  route?: string;
  rateLimit?: PublicRateLimitConfig;
};

export async function withApiRoute(
  request: Request,
  handler: ApiHandler,
  options: RouteHandlerOptions = {},
): Promise<NextResponse> {
  try {
    const context = await getHandlerContext();
    if (!isHandlerContext(context)) {
      return context;
    }

    return await handler(context, request);
  } catch (error) {
    captureApiError(error, { route: options.route });
    return domainErrorToResponse(error);
  }
}

export async function withApiRouteNoRequest(
  handler: (context: HandlerContext) => Promise<NextResponse>,
  options: RouteHandlerOptions = {},
): Promise<NextResponse> {
  try {
    const context = await getHandlerContext();
    if (!isHandlerContext(context)) {
      return context;
    }

    return await handler(context);
  } catch (error) {
    captureApiError(error, { route: options.route });
    return domainErrorToResponse(error);
  }
}

type PublicHandler = (request: Request) => Promise<NextResponse>;

export async function withPublicRoute(
  request: Request,
  handler: PublicHandler,
  options: RouteHandlerOptions = {},
): Promise<NextResponse> {
  try {
    if (options.rateLimit) {
      const rate = checkPublicRateLimit(request, options.rateLimit);
      if (!rate.allowed) {
        return jsonError('Too many requests. Try again shortly.', 429, 'RATE_LIMITED');
      }
    }

    return await handler(request);
  } catch (error) {
    captureApiError(error, { route: options.route });
    return domainErrorToResponse(error);
  }
}

type WebhookHandler = (request: Request) => Promise<NextResponse>;

export async function withWebhookRoute(
  request: Request,
  handler: WebhookHandler,
  options: RouteHandlerOptions = {},
): Promise<NextResponse> {
  try {
    return await handler(request);
  } catch (error) {
    captureApiError(error, { route: options.route, surface: 'webhook' });
    return domainErrorToResponse(error);
  }
}
