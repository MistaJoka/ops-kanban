import { NextResponse, type NextRequest } from 'next/server';

import { jsonError } from '@/lib/api/response';
import { logError } from '@/lib/ops/logError';
import { middleware as authMiddleware } from './middleware.auth';

export async function middleware(request: NextRequest) {
  try {
    return await authMiddleware(request);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Middleware error';
    logError(message, { route: request.nextUrl.pathname, code: 'MIDDLEWARE_ERROR' });

    if (request.nextUrl.pathname.startsWith('/api/')) {
      return jsonError('Service temporarily unavailable.', 503, 'SERVICE_UNAVAILABLE');
    }

    return NextResponse.redirect(new URL('/login?error=service', request.url));
  }
}

export { config } from './middleware.auth';
