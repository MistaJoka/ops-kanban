'use client';

import { useEffect, useState } from 'react';

import { SettingsNav } from '@/components/settings/SettingsNav';

type IntegrationStatus = {
  stripe: { configured: boolean; status: string };
  twilio: { configured: boolean; status: string };
};

function needsIntegrationsAttention(status: IntegrationStatus | null): boolean {
  if (!status) return false;
  const stripeNeeds = status.stripe.configured && status.stripe.status !== 'active';
  const twilioNeeds = status.twilio.configured && status.twilio.status !== 'active';
  return stripeNeeds || twilioNeeds;
}

export function SettingsShell({ children }: { children: React.ReactNode }) {
  const [integrationsAttention, setIntegrationsAttention] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const response = await fetch('/api/integrations');
        if (!response.ok) return;
        const payload = await response.json();
        if (payload.data) {
          setIntegrationsAttention(needsIntegrationsAttention(payload.data));
        }
      } catch {
        /* fail silent */
      }
    })();
  }, []);

  return (
    <div className="ops-settings-layout flex min-h-0 flex-1 flex-col md:flex-row">
      <SettingsNav integrationsAttention={integrationsAttention} />
      <div className="ops-settings-content min-h-0 flex-1 overflow-y-auto">{children}</div>
    </div>
  );
}
