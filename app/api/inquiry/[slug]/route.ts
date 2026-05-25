import { z } from 'zod';

import { parseJsonBody } from '@/lib/api/parseJsonBody';
import { jsonData, jsonError } from '@/lib/api/response';
import { withPublicRoute } from '@/lib/api/withApiRoute';
import { ensureBookingPage } from '@/lib/domain/booking/bookingPages';
import { getInquiryPageBySlug } from '@/lib/domain/intake/inquiryPages';
import { processIntake } from '@/lib/domain/intake/processIntake';
import { createServiceClient } from '@/lib/db/supabase/service';

const inquirySchema = z
  .object({
    customerName: z.string().trim().min(1, 'Name is required'),
    customerPhone: z.string().trim().optional(),
    customerEmail: z.string().trim().email().optional().or(z.literal('')),
    customerAddress: z.string().trim().optional(),
    message: z.string().trim().min(1, 'Message is required'),
    source: z.string().trim().optional(),
    campaign: z.string().trim().optional(),
    idempotencyKey: z.string().trim().optional(),
  })
  .refine((data) => Boolean(data.customerPhone?.trim() || data.customerEmail?.trim()), {
    message: 'Phone or email is required.',
    path: ['customerPhone'],
  });

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  return withPublicRoute(
    _request,
    async () => {
      const { slug } = await params;
      const service = createServiceClient();
      const page = await getInquiryPageBySlug(service, slug);

      if (!page) {
        return jsonError('Inquiry page not found.', 404, 'NOT_FOUND');
      }

      const { data: org } = await service
        .from('organizations')
        .select('name')
        .eq('id', page.organizationId)
        .single();

      let bookingSlug: string | null = null;
      if (org?.name) {
        try {
          const bookingPage = await ensureBookingPage(service, page.organizationId, org.name);
          bookingSlug = bookingPage.slug;
        } catch {
          bookingSlug = null;
        }
      }

      return jsonData({
        title: page.title,
        organizationName: org?.name ?? 'Us',
        bookingSlug,
      });
    },
    { route: '/api/inquiry/[slug]' },
  );
}

export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  return withPublicRoute(
    request,
    async (req) => {
      const service = createServiceClient();
      const page = await getInquiryPageBySlug(service, slug);

      if (!page) {
        return jsonError('Inquiry page not found.', 404, 'NOT_FOUND');
      }

      const rawBodyPromise = req.clone().json();
      const parsed = await parseJsonBody(req, inquirySchema);
      if (!parsed.ok) {
        return parsed.response;
      }

      try {
        const result = await processIntake(service, {
          organizationId: page.organizationId,
          channel: 'web',
          source: parsed.data.source?.trim() || 'website',
          campaign: parsed.data.campaign?.trim() || null,
          idempotencyKey: parsed.data.idempotencyKey,
          customerName: parsed.data.customerName,
          customerPhone: parsed.data.customerPhone?.trim() || null,
          customerEmail: parsed.data.customerEmail?.trim() || null,
          customerAddress: parsed.data.customerAddress?.trim() || null,
          message: parsed.data.message,
          raw: await rawBodyPromise,
        });

        return jsonData(result, result.created ? 201 : 200);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Inquiry submission failed.';
        return jsonError(message, 400, 'VALIDATION_ERROR');
      }
    },
    {
      route: '/api/inquiry/[slug]',
      rateLimit: { routeKey: 'inquiry-post', slug, limit: 10 },
    },
  );
}
