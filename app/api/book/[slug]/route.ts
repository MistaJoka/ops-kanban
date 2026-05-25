import { z } from 'zod';

import { parseJsonBody } from '@/lib/api/parseJsonBody';
import { jsonData, jsonError } from '@/lib/api/response';
import { withPublicRoute } from '@/lib/api/withApiRoute';
import { buildAvailableSlots, getBookingPageBySlug } from '@/lib/domain/booking/bookingPages';
import { createBooking } from '@/lib/domain/booking/createBooking';
import { createServiceClient } from '@/lib/db/supabase/service';

const bookingSchema = z.object({
  serviceKey: z.string().min(1),
  serviceLabel: z.string().min(1),
  customerName: z.string().min(1),
  customerEmail: z.string().email(),
  customerPhone: z.string().optional(),
  customerAddress: z.string().optional(),
  scheduledStart: z.string().datetime(),
  notes: z.string().optional(),
  idempotencyKey: z.string().optional(),
});

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  return withPublicRoute(
    _request,
    async () => {
      const { slug } = await params;
      const service = createServiceClient();
      const page = await getBookingPageBySlug(service, slug);

      if (!page) {
        return jsonError('Booking page not found.', 404, 'NOT_FOUND');
      }

      const slots = buildAvailableSlots(new Date(), 14, page.slotDurationMinutes);

      return jsonData({
        title: page.title,
        serviceTypes: page.serviceTypes,
        slots,
      });
    },
    { route: '/api/book/[slug]' },
  );
}

export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  return withPublicRoute(
    request,
    async (req) => {
      const service = createServiceClient();
      const page = await getBookingPageBySlug(service, slug);

      if (!page) {
        return jsonError('Booking page not found.', 404, 'NOT_FOUND');
      }

      const parsed = await parseJsonBody(req, bookingSchema);
      if (!parsed.ok) {
        return parsed.response;
      }

      try {
        const result = await createBooking(service, {
          organizationId: page.organizationId,
          ...parsed.data,
        });

        return jsonData(result);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Booking failed.';
        return jsonError(message, 400, 'VALIDATION_ERROR');
      }
    },
    {
      route: '/api/book/[slug]',
      rateLimit: { routeKey: 'book-post', slug, limit: 5 },
    },
  );
}
