import type { SupabaseClient } from '@supabase/supabase-js';

import { logActivity } from '@/lib/domain/activities/logActivity';
import type { AutomationView } from '@/lib/domain/automations/types';
import { sendCardSms } from '@/lib/domain/comms/sendSms';
import { isTwilioConfigured } from '@/lib/integrations/twilio/adapter';

async function recordAutomationRun(
  client: SupabaseClient,
  params: {
    organizationId: string;
    automationId: string;
    cardId: string;
    status: 'completed' | 'failed' | 'skipped';
    errorMessage?: string | null;
  },
) {
  await client.from('automation_runs').insert({
    organization_id: params.organizationId,
    automation_id: params.automationId,
    card_id: params.cardId,
    status: params.status,
    error_message: params.errorMessage ?? null,
  });
}

async function executeAutomation(
  client: SupabaseClient,
  automation: AutomationView,
  params: {
    organizationId: string;
    cardId: string;
    cardTitle: string;
    actorId: string | null;
  },
): Promise<void> {
  if (automation.actionType === 'log_activity') {
    const summary =
      typeof automation.actionConfig.summary === 'string'
        ? automation.actionConfig.summary
        : `Automation "${automation.name}" ran for ${params.cardTitle}`;

    await logActivity(client, {
      organizationId: params.organizationId,
      actorId: params.actorId,
      entityType: 'card',
      entityId: params.cardId,
      action: 'automation.ran',
      summary,
      metadata: { automation_id: automation.id, automation_name: automation.name },
    });
    return;
  }

  if (automation.actionType === 'set_next_action') {
    const text =
      typeof automation.actionConfig.text === 'string'
        ? automation.actionConfig.text
        : 'Follow up on this job';

    await client
      .from('cards')
      .update({ next_action: text, updated_at: new Date().toISOString() })
      .eq('id', params.cardId)
      .eq('organization_id', params.organizationId);

    await logActivity(client, {
      organizationId: params.organizationId,
      actorId: params.actorId,
      entityType: 'card',
      entityId: params.cardId,
      action: 'automation.set_next_action',
      summary: `Next action set: ${text}`,
      metadata: { automation_id: automation.id },
    });
    return;
  }

  if (automation.actionType === 'send_sms_template') {
    if (!isTwilioConfigured()) {
      throw new Error('Twilio is not configured.');
    }

    const templateId =
      typeof automation.actionConfig.templateId === 'string'
        ? automation.actionConfig.templateId
        : null;

    if (!templateId) {
      throw new Error('SMS automation requires templateId in actionConfig.');
    }

    await sendCardSms(client, {
      organizationId: params.organizationId,
      cardId: params.cardId,
      actorId: params.actorId,
      templateId,
    });
    return;
  }

  if (automation.actionType === 'send_review_request') {
    if (!isTwilioConfigured()) {
      throw new Error('Twilio is not configured.');
    }

    const reviewUrl =
      typeof automation.actionConfig.reviewUrl === 'string'
        ? automation.actionConfig.reviewUrl
        : 'https://g.page/r/your-business/review';

    await sendCardSms(client, {
      organizationId: params.organizationId,
      cardId: params.cardId,
      actorId: params.actorId,
      body: `Thanks for choosing us! If you have a moment, we'd love a review: ${reviewUrl}`,
    });
  }
}

export async function runAutomationsForColumnEnter(
  client: SupabaseClient,
  params: {
    organizationId: string;
    cardId: string;
    cardTitle: string;
    stateKey: string;
    actorId: string | null;
  },
): Promise<void> {
  const { data, error } = await client
    .from('automations')
    .select('*')
    .eq('organization_id', params.organizationId)
    .eq('active', true)
    .eq('trigger_type', 'column_enter')
    .eq('trigger_state_key', params.stateKey);

  if (error || !data?.length) {
    return;
  }

  for (const row of data) {
    const automation: AutomationView = {
      id: row.id as string,
      name: row.name as string,
      triggerType: 'column_enter',
      triggerStateKey: (row.trigger_state_key as string | null) ?? null,
      actionType: row.action_type as AutomationView['actionType'],
      actionConfig: (row.action_config as Record<string, unknown>) ?? {},
      active: Boolean(row.active),
      createdAt: row.created_at as string,
    };

    try {
      await executeAutomation(client, automation, params);
      await recordAutomationRun(client, {
        organizationId: params.organizationId,
        automationId: automation.id,
        cardId: params.cardId,
        status: 'completed',
      });
    } catch (error) {
      await recordAutomationRun(client, {
        organizationId: params.organizationId,
        automationId: automation.id,
        cardId: params.cardId,
        status: 'failed',
        errorMessage: error instanceof Error ? error.message : 'Automation failed.',
      });
    }
  }
}

export async function runAutomationsForInvoicePaid(
  client: SupabaseClient,
  params: {
    organizationId: string;
    cardId: string;
    cardTitle: string;
    actorId: string | null;
  },
): Promise<void> {
  const { data, error } = await client
    .from('automations')
    .select('*')
    .eq('organization_id', params.organizationId)
    .eq('active', true)
    .eq('trigger_type', 'invoice_paid');

  if (error || !data?.length) {
    return;
  }

  for (const row of data) {
    const automation: AutomationView = {
      id: row.id as string,
      name: row.name as string,
      triggerType: 'invoice_paid',
      triggerStateKey: null,
      actionType: row.action_type as AutomationView['actionType'],
      actionConfig: (row.action_config as Record<string, unknown>) ?? {},
      active: Boolean(row.active),
      createdAt: row.created_at as string,
    };

    try {
      await executeAutomation(client, automation, params);
      await recordAutomationRun(client, {
        organizationId: params.organizationId,
        automationId: automation.id,
        cardId: params.cardId,
        status: 'completed',
      });
    } catch (error) {
      await recordAutomationRun(client, {
        organizationId: params.organizationId,
        automationId: automation.id,
        cardId: params.cardId,
        status: 'failed',
        errorMessage: error instanceof Error ? error.message : 'Automation failed.',
      });
    }
  }
}
