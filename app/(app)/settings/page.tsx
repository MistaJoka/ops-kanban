'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowRight, ChevronRight } from 'lucide-react';

import { SettingsPageHeader } from '@/components/settings/SettingsPageHeader';
import { SETTINGS_OVERVIEW_ITEMS } from '@/lib/settings/nav';

type OverviewStats = {
  memberCount: number;
  integrationsSummary: string | null;
};

export default function SettingsOverviewPage() {
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      let memberCount = 0;
      let integrationsSummary: string | null = null;

      try {
        const [membersRes, integrationsRes] = await Promise.all([
          fetch('/api/members'),
          fetch('/api/integrations'),
        ]);
        const membersPayload = await membersRes.json();
        const integrationsPayload = await integrationsRes.json();

        if (membersRes.ok && Array.isArray(membersPayload.data)) {
          memberCount = membersPayload.data.length;
        }

        if (integrationsRes.ok && integrationsPayload.data) {
          const status = integrationsPayload.data as {
            stripe: { configured: boolean; status: string };
            twilio: { configured: boolean; status: string };
            resend: { configured: boolean };
          };
          const connected: string[] = [];
          if (status.stripe.status === 'active') connected.push('Stripe');
          if (status.twilio.status === 'active') connected.push('SMS');
          if (status.resend.configured) connected.push('Email');
          integrationsSummary =
            connected.length > 0 ? `${connected.join(', ')} connected` : 'Native modules on';
        }
      } catch {
        /* optional stats */
      }

      setStats({ memberCount, integrationsSummary });
      setLoading(false);
    })();
  }, []);

  return (
    <div className="ops-page-shell max-w-4xl">
      <SettingsPageHeader
        title="Settings"
        description="Configure your workspace, team, integrations, and operational automations."
      />

      <section className="mt-8 grid gap-4 sm:grid-cols-2">
        {SETTINGS_OVERVIEW_ITEMS.filter((item) => item.href !== '/settings').map((item) => {
          const Icon = item.icon;
          let meta: string | null = null;
          if (!loading && stats) {
            if (item.href === '/settings/team' && stats.memberCount > 0) {
              meta = `${stats.memberCount} member${stats.memberCount === 1 ? '' : 's'}`;
            }
            if (item.href === '/settings/integrations' && stats.integrationsSummary) {
              meta = stats.integrationsSummary;
            }
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className="ops-settings-overview-card group"
            >
              <span className="ops-settings-overview-card__icon">
                <Icon className="size-5" strokeWidth={2} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-[var(--text-primary)] group-hover:text-[var(--accent)]">
                    {item.label}
                  </p>
                  <ChevronRight className="size-4 shrink-0 text-[var(--text-tertiary)] opacity-0 transition-opacity group-hover:opacity-100" />
                </div>
                {item.description ? (
                  <p className="mt-1 text-sm leading-relaxed text-[var(--text-secondary)]">
                    {item.description}
                  </p>
                ) : null}
                {meta ? (
                  <p className="mt-2 text-xs font-medium text-[var(--accent)]">{meta}</p>
                ) : null}
              </div>
            </Link>
          );
        })}
      </section>

      <section className="ops-section-card mt-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="font-semibold text-[var(--text-primary)]">Need help?</p>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              Guides, support contact, and keyboard shortcuts live outside settings.
            </p>
          </div>
          <Link href="/support/help" className="ops-link inline-flex items-center gap-1">
            Help & guides
            <ArrowRight className="size-3.5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
