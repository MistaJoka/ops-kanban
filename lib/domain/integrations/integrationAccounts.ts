import type { SupabaseClient } from '@supabase/supabase-js';

import { ensureBookingPage } from '@/lib/domain/booking/bookingPages';
import { isStripeConfigured } from '@/lib/integrations/stripe/adapter';
import { isTwilioConfigured } from '@/lib/integrations/twilio/adapter';

export type IntegrationStatusView = {
  stripe: {
    configured: boolean;
    status: 'active' | 'disconnected' | 'error';
    errorMessage?: string | null;
  };
  twilio: {
    configured: boolean;
    status: 'active' | 'disconnected' | 'error';
    errorMessage?: string | null;
  };
  resend: {
    configured: boolean;
  };
  nativeAccounting: {
    enabled: boolean;
  };
  nativeSigning: {
    enabled: boolean;
  };
  bookingPageUrl: string | null;
};

export async function getIntegrationStatus(
  client: SupabaseClient,
  organizationId: string,
  baseUrl?: string,
): Promise<IntegrationStatusView> {
  const { data } = await client
    .from('integration_accounts')
    .select('provider, status, error_message')
    .eq('organization_id', organizationId)
    .in('provider', ['stripe', 'twilio']);

  const stripeRow = data?.find((row) => row.provider === 'stripe');
  const twilioRow = data?.find((row) => row.provider === 'twilio');

  let bookingPageUrl: string | null = null;

  try {
    const { data: org } = await client
      .from('organizations')
      .select('name')
      .eq('id', organizationId)
      .single();

    if (org?.name) {
      const page = await ensureBookingPage(client, organizationId, org.name);
      bookingPageUrl = baseUrl ? `${baseUrl}/book/${page.slug}` : `/book/${page.slug}`;
    }
  } catch {
    bookingPageUrl = null;
  }

  return {
    stripe: {
      configured: isStripeConfigured(),
      status: stripeRow?.status ?? (isStripeConfigured() ? 'active' : 'disconnected'),
      errorMessage: stripeRow?.error_message ?? null,
    },
    twilio: {
      configured: isTwilioConfigured(),
      status: twilioRow?.status ?? (isTwilioConfigured() ? 'active' : 'disconnected'),
      errorMessage: twilioRow?.error_message ?? null,
    },
    resend: {
      configured: Boolean(process.env.RESEND_API_KEY),
    },
    nativeAccounting: {
      enabled: true,
    },
    nativeSigning: {
      enabled: true,
    },
    bookingPageUrl,
  };
}

export async function upsertIntegrationAccount(
  client: SupabaseClient,
  organizationId: string,
  provider: 'stripe' | 'twilio',
  status: 'active' | 'disconnected',
) {
  const { error } = await client.from('integration_accounts').upsert(
    {
      organization_id: organizationId,
      provider,
      status,
      updated_at: new Date().toISOString(),
      error_message: null,
    },
    { onConflict: 'organization_id,provider' },
  );

  if (error) {
    throw new Error(error.message);
  }
}
