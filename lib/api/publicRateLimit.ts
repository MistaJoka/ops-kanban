const DEFAULT_WINDOW_MS = 60_000;

const memoryBuckets = new Map<string, { count: number; resetAt: number }>();

export type RateLimitResult = {
  allowed: boolean;
  retryAfterMs?: number;
};

export function checkMemoryRateLimit(
  key: string,
  maxRequests: number,
  windowMs = DEFAULT_WINDOW_MS,
): RateLimitResult {
  const now = Date.now();
  const bucket = memoryBuckets.get(key);

  if (!bucket || now >= bucket.resetAt) {
    memoryBuckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true };
  }

  if (bucket.count >= maxRequests) {
    return { allowed: false, retryAfterMs: bucket.resetAt - now };
  }

  bucket.count += 1;
  return { allowed: true };
}

export function clientIpFromRequest(request: Request): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip')?.trim() ??
    'unknown'
  );
}

export type PublicRateLimitConfig = {
  routeKey: string;
  slug?: string;
  limit: number;
  windowMs?: number;
};

export function checkPublicRateLimit(
  request: Request,
  config: PublicRateLimitConfig,
): RateLimitResult {
  const ip = clientIpFromRequest(request);
  const slug = config.slug ?? 'global';
  const key = `${config.routeKey}:${ip}:${slug}`;
  return checkMemoryRateLimit(key, config.limit, config.windowMs);
}
