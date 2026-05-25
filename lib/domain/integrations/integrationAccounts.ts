import type { SupabaseClient } from '@supabase/supabase-js';

import { ensureBookingPage } from '@/lib/domain/booking/bookingPages';
import {
  buildInquiryLinkPresets,
  ensureInquiryPage,
} from '@/lib/domain/intake/inquiryPages';
import { isPayPalConfigured } from '@/lib/integrations/paypal/adapter';
import { isTwilioConfigured } from '@/lib/integrations/twilio/adapter';

export type IntegrationStatusView = {
  paypal: {
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
  inquiryPageUrl: string | null;
  inquiryLinkPresets: Array<{ label: string; url: string }>;
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
    .in('provider', ['paypal', 'twilio']);

  const paypalRow = data?.find((row) => row.provider === 'paypal');
  const twilioRow = data?.find((row) => row.provider === 'twilio');

  let bookingPageUrl: string | null = null;
  let inquiryPageUrl: string | null = null;
  let inquiryLinkPresets: Array<{ label: string; url: string }> = [];

  try {
    const { data: org } = await client
      .from('organizations')
      .select('name')
      .eq('id', organizationId)
      .single();

    if (org?.name) {
      const page = await ensureBookingPage(client, organizationId, org.name);
      bookingPageUrl = baseUrl ? `${baseUrl}/book/${page.slug}` : `/book/${page.slug}`;

      const inquiryPage = await ensureInquiryPage(client, organizationId, org.name);
      inquiryPageUrl = baseUrl
        ? `${baseUrl}/inquiry/${inquiryPage.slug}`
        : `/inquiry/${inquiryPage.slug}`;
      inquiryLinkPresets = buildInquiryLinkPresets(baseUrl ?? '', inquiryPage.slug);
    }
  } catch {
    bookingPageUrl = null;
    inquiryPageUrl = null;
    inquiryLinkPresets = [];
  }

  return {
    paypal: {
      configured: isPayPalConfigured(),
      status: paypalRow?.status ?? (isPayPalConfigured() ? 'active' : 'disconnected'),
      errorMessage: paypalRow?.error_message ?? null,
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
    inquiryPageUrl,
    inquiryLinkPresets,
  };
}

export async function upsertIntegrationAccount(
  client: SupabaseClient,
  organizationId: string,
  provider: 'paypal' | 'twilio',
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
