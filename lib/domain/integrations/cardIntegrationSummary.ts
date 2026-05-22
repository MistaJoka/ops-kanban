import type { SupabaseClient } from '@supabase/supabase-js';

import { getIntegrationStatus } from '@/lib/domain/integrations/integrationAccounts';
import type { InvoiceView } from '@/lib/domain/money/invoices';
import type { PaymentView } from '@/lib/domain/integrations/payments';

export type CardIntegrationSummary = {
  stripe: { label: string; status: 'active' | 'inactive' | 'paid' | 'pending' };
  estimateSign: { label: string; status: 'signed' | 'awaiting' | 'inactive' };
  twilio: { label: string; status: 'active' | 'inactive'; unread: number };
  accounting: { label: string; status: 'paid' | 'due' | 'inactive' };
};

export async function getCardIntegrationSummary(
  client: SupabaseClient,
  organizationId: string,
  cardId: string,
  invoice: InvoiceView | null,
  payment: PaymentView | null,
  baseUrl?: string,
): Promise<CardIntegrationSummary> {
  const [integrationStatus, signatureResult, messageResult] = await Promise.all([
    getIntegrationStatus(client, organizationId, baseUrl),
    client
      .from('signatures')
      .select('signed_at, provider')
      .eq('organization_id', organizationId)
      .eq('card_id', cardId)
      .order('signed_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    client
      .from('messages')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .eq('card_id', cardId)
      .eq('direction', 'inbound')
      .eq('status', 'received'),
  ]);

  let stripeStatus: CardIntegrationSummary['stripe']['status'] = 'inactive';
  let stripeLabel = 'Stripe not configured';

  if (integrationStatus.stripe.configured && integrationStatus.stripe.status === 'active') {
    if (invoice?.status === 'paid') {
      stripeStatus = 'paid';
      stripeLabel = `Paid $${invoice.total.toFixed(2)}`;
    } else if (payment?.paymentUrl) {
      stripeStatus = 'pending';
      stripeLabel = `Link pending $${payment.amount.toFixed(2)}`;
    } else if (invoice && invoice.balanceDue > 0) {
      stripeStatus = 'active';
      stripeLabel = `$${invoice.balanceDue.toFixed(2)} due`;
    } else {
      stripeStatus = 'active';
      stripeLabel = 'Ready for payment link';
    }
  }

  let estimateSignStatus: CardIntegrationSummary['estimateSign']['status'] = 'inactive';
  let estimateSignLabel = 'No signature yet';

  if (signatureResult.data?.signed_at) {
    estimateSignStatus = 'signed';
    const signedAt = new Date(signatureResult.data.signed_at as string).toLocaleDateString();
    estimateSignLabel = `Signed ${signedAt}`;
  } else {
    estimateSignStatus = 'awaiting';
    estimateSignLabel = 'Awaiting portal approval';
  }

  const twilioActive =
    integrationStatus.twilio.configured && integrationStatus.twilio.status === 'active';

  let accountingStatus: CardIntegrationSummary['accounting']['status'] = 'inactive';
  let accountingLabel = 'No invoice yet';

  if (invoice) {
    if (invoice.status === 'paid') {
      accountingStatus = 'paid';
      accountingLabel = `Recorded $${invoice.total.toFixed(2)}`;
    } else if (invoice.balanceDue > 0) {
      accountingStatus = 'due';
      accountingLabel = `AR $${invoice.balanceDue.toFixed(2)} due`;
    } else {
      accountingStatus = 'inactive';
      accountingLabel = `Invoice ${invoice.status}`;
    }
  }

  return {
    stripe: { label: stripeLabel, status: stripeStatus },
    estimateSign: { label: estimateSignLabel, status: estimateSignStatus },
    twilio: {
      label: twilioActive ? 'SMS enabled' : 'Twilio not configured',
      status: twilioActive ? 'active' : 'inactive',
      unread: messageResult.count ?? 0,
    },
    accounting: { label: accountingLabel, status: accountingStatus },
  };
}
