import 'server-only';

import { createHash } from 'node:crypto';

import type { SupabaseClient } from '@supabase/supabase-js';

export type BookingServiceType = {
  key: string;
  label: string;
  description?: string;
};

export type BookingPageView = {
  organizationId: string;
  slug: string;
  title: string;
  serviceTypes: BookingServiceType[];
  slotDurationMinutes: number;
  active: boolean;
};

const DEFAULT_SERVICES: BookingServiceType[] = [
  { key: 'site_visit', label: 'Site visit', description: 'On-site consultation and measurements' },
  { key: 'consultation', label: 'Phone consultation', description: 'Quick scope discussion' },
];

export function slugifyOrgName(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);

  return base || 'book';
}

export async function ensureBookingPage(
  client: SupabaseClient,
  organizationId: string,
  organizationName: string,
): Promise<BookingPageView> {
  const { data: existing } = await client
    .from('booking_pages')
    .select('organization_id, slug, title, service_types, slot_duration_minutes, active')
    .eq('organization_id', organizationId)
    .maybeSingle();

  if (existing) {
    return mapBookingPage(existing);
  }

  const slug = `${slugifyOrgName(organizationName)}-${organizationId.slice(0, 8)}`;

  const { data, error } = await client
    .from('booking_pages')
    .insert({
      organization_id: organizationId,
      slug,
      title: `Book with ${organizationName}`,
      service_types: DEFAULT_SERVICES,
      active: true,
    })
    .select('organization_id, slug, title, service_types, slot_duration_minutes, active')
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? 'Failed to create booking page.');
  }

  return mapBookingPage(data);
}

export async function getBookingPageBySlug(
  client: SupabaseClient,
  slug: string,
): Promise<BookingPageView | null> {
  const { data, error } = await client
    .from('booking_pages')
    .select('organization_id, slug, title, service_types, slot_duration_minutes, active')
    .eq('slug', slug)
    .eq('active', true)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return mapBookingPage(data);
}

function mapBookingPage(row: {
  organization_id: string;
  slug: string;
  title: string;
  service_types: unknown;
  slot_duration_minutes: number;
  active: boolean;
}): BookingPageView {
  const serviceTypes = Array.isArray(row.service_types)
    ? (row.service_types as BookingServiceType[])
    : DEFAULT_SERVICES;

  return {
    organizationId: row.organization_id,
    slug: row.slug,
    title: row.title,
    serviceTypes,
    slotDurationMinutes: row.slot_duration_minutes,
    active: row.active,
  };
}

export function buildAvailableSlots(
  startDate: Date,
  days: number,
  slotDurationMinutes: number,
): string[] {
  const slots: string[] = [];
  const cursor = new Date(startDate);
  cursor.setHours(0, 0, 0, 0);

  for (let day = 0; day < days; day += 1) {
    const dayStart = new Date(cursor);
    dayStart.setDate(cursor.getDate() + day);

    if (dayStart.getDay() === 0) {
      continue;
    }

    for (let hour = 9; hour < 17; hour += 1) {
      const slot = new Date(dayStart);
      slot.setHours(hour, 0, 0, 0);
      if (slot.getTime() <= Date.now()) {
        continue;
      }

      slots.push(slot.toISOString());

      if (slotDurationMinutes === 30 && hour < 16) {
        const half = new Date(slot);
        half.setMinutes(30);
        if (half.getTime() > Date.now()) {
          slots.push(half.toISOString());
        }
      }
    }
  }

  return slots.slice(0, 40);
}

export function bookingIdempotencyKey(input: {
  organizationId: string;
  email: string;
  scheduledStart: string;
  serviceKey: string;
}): string {
  return createHash('sha256')
    .update(`${input.organizationId}:${input.email}:${input.scheduledStart}:${input.serviceKey}`)
    .digest('hex');
}
