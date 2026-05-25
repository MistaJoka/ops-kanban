'use client';

import { useCallback, useEffect, useState } from 'react';

async function parseJsonResponse(response: Response) {
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.error ?? 'Request failed.');
  }
  return payload.data;
}

export function useSettingsResource<T>(url: string) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(url);
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? 'Failed to load settings.');
      }
      setData(payload.data as T);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load settings.');
    } finally {
      setLoading(false);
    }
  }, [url]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const save = useCallback(
    async (body: unknown) => {
      setError(null);
      const next = await parseJsonResponse(
        await fetch(url, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        }),
      );
      setData(next as T);
      return next as T;
    },
    [url],
  );

  return { data, loading, error, setError, refresh, save };
}

export function useSettingsCollection<T>(url: string) {
  const { data, loading, error, setError, refresh } = useSettingsResource<T[]>(url);

  const create = useCallback(
    async (body: unknown) => {
      setError(null);
      await parseJsonResponse(
        await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        }),
      );
      await refresh();
    },
    [refresh, setError, url],
  );

  const remove = useCallback(
    async (id: string) => {
      setError(null);
      await parseJsonResponse(await fetch(`${url}/${id}`, { method: 'DELETE' }));
      await refresh();
    },
    [refresh, setError, url],
  );

  const postAction = useCallback(
    async (path: string, body?: unknown) => {
      setError(null);
      const result = await parseJsonResponse(
        await fetch(path, {
          method: 'POST',
          headers: body ? { 'Content-Type': 'application/json' } : undefined,
          body: body ? JSON.stringify(body) : undefined,
        }),
      );
      await refresh();
      return result;
    },
    [refresh, setError],
  );

  return {
    items: data ?? [],
    loading,
    error,
    setError,
    refresh,
    create,
    remove,
    postAction,
  };
}

export type OrgSettings = {
  name: string;
  pipelineMode: 'compact' | 'full';
  role: string;
};

export type IntegrationStatus = {
  stripe: { configured: boolean; status: string; errorMessage?: string | null };
  twilio: { configured: boolean; status: string; errorMessage?: string | null };
  resend: { configured: boolean };
  nativeAccounting: { enabled: boolean };
  nativeSigning: { enabled: boolean };
  bookingPageUrl: string | null;
  inquiryPageUrl: string | null;
  inquiryLinkPresets: Array<{ label: string; url: string }>;
};

export type MessageTemplate = {
  id: string;
  name: string;
  channel: 'sms' | 'email';
  subject: string | null;
  body: string;
};

export type AutomationRule = {
  id: string;
  name: string;
  triggerType: string;
  triggerStateKey: string | null;
  actionType: string;
  actionConfig: Record<string, unknown>;
  active: boolean;
};

export type ContractView = {
  id: string;
  customerId: string;
  customerName: string;
  title: string;
  jobType: string | null;
  frequency: string;
  nextRunAt: string;
  amount: number | null;
  active: boolean;
  lastCardId: string | null;
};

export function useSettingsOrganization() {
  return useSettingsResource<OrgSettings>('/api/settings/organization');
}

export type AiMemorySettings = {
  brandVoice: string;
};

export function useSettingsAiMemory() {
  return useSettingsResource<AiMemorySettings>('/api/settings/ai-memory');
}

export function useSettingsMembers() {
  return useSettingsResource<Array<{ userId: string; fullName: string | null; role: string }>>(
    '/api/members',
  );
}

export function useSettingsIntegrations() {
  return useSettingsResource<IntegrationStatus>('/api/integrations');
}

export function useSettingsMessageTemplates() {
  return useSettingsCollection<MessageTemplate>('/api/message-templates');
}

export function useSettingsAutomations() {
  return useSettingsCollection<AutomationRule>('/api/automations');
}

export function useSettingsContracts() {
  return useSettingsCollection<ContractView>('/api/contracts');
}

export function summarizeIntegrations(status: IntegrationStatus | null): string | null {
  if (!status) return null;
  const connected: string[] = [];
  if (status.stripe.status === 'active') connected.push('Stripe');
  if (status.twilio.status === 'active') connected.push('SMS');
  if (status.resend.configured) connected.push('Email');
  return connected.length > 0 ? `${connected.join(', ')} connected` : 'Native modules on';
}
