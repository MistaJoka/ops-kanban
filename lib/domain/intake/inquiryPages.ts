import 'server-only';

import { createHash } from 'node:crypto';

import type { SupabaseClient } from '@supabase/supabase-js';

import { slugifyOrgName } from '@/lib/domain/booking/bookingPages';

export type InquiryPageView = {
  organizationId: string;
  slug: string;
  title: string;
  active: boolean;
};

export const INQUIRY_LINK_PRESETS = [
  { key: 'yard-sign', label: 'Yard sign' },
  { key: 'truck-wrap', label: 'Truck wrap' },
  { key: 'business-card', label: 'Business card' },
  { key: 'website', label: 'Website embed' },
] as const;

export async function ensureInquiryPage(
  client: SupabaseClient,
  organizationId: string,
  organizationName: string,
): Promise<InquiryPageView> {
  const { data: existing } = await client
    .from('inquiry_pages')
    .select('organization_id, slug, title, active')
    .eq('organization_id', organizationId)
    .maybeSingle();

  if (existing) {
    return mapInquiryPage(existing);
  }

  const slug = `${slugifyOrgName(organizationName)}-${organizationId.slice(0, 8)}-quote`;

  const { data, error } = await client
    .from('inquiry_pages')
    .insert({
      organization_id: organizationId,
      slug,
      title: `Get a quote from ${organizationName}`,
      active: true,
    })
    .select('organization_id, slug, title, active')
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? 'Failed to create inquiry page.');
  }

  return mapInquiryPage(data);
}

export async function getInquiryPageBySlug(
  client: SupabaseClient,
  slug: string,
): Promise<InquiryPageView | null> {
  const { data, error } = await client
    .from('inquiry_pages')
    .select('organization_id, slug, title, active')
    .eq('slug', slug)
    .eq('active', true)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return mapInquiryPage(data);
}

function mapInquiryPage(row: {
  organization_id: string;
  slug: string;
  title: string;
  active: boolean;
}): InquiryPageView {
  return {
    organizationId: row.organization_id,
    slug: row.slug,
    title: row.title,
    active: row.active,
  };
}

export function inquiryIdempotencyKey(input: {
  organizationId: string;
  email?: string | null;
  phone?: string | null;
  message: string;
}): string {
  const contact = (input.email?.trim().toLowerCase() || input.phone?.trim() || 'unknown').slice(
    0,
    120,
  );
  const message = input.message.trim().slice(0, 200);
  return createHash('sha256')
    .update(`${input.organizationId}:${contact}:${message}`)
    .digest('hex');
}

export function buildInquiryLinkPresets(
  baseUrl: string,
  slug: string,
): Array<{ label: string; url: string }> {
  const base = `${baseUrl.replace(/\/$/, '')}/inquiry/${slug}`;
  return INQUIRY_LINK_PRESETS.map((preset) => ({
    label: preset.label,
    url: `${base}?src=${encodeURIComponent(preset.key)}`,
  }));
}
