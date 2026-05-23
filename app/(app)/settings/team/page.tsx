'use client';

import { useEffect, useState } from 'react';

import { SettingsPageHeader } from '@/components/settings/SettingsPageHeader';

type Member = {
  userId: string;
  fullName: string | null;
  role: string;
};

function roleLabel(role: string): string {
  return role.charAt(0).toUpperCase() + role.slice(1);
}

export default function TeamSettingsPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      const response = await fetch('/api/members');
      const payload = await response.json();
      if (!response.ok) {
        setError(payload.error ?? 'Failed to load team members.');
        setLoading(false);
        return;
      }
      setMembers(payload.data ?? []);
      setLoading(false);
    })();
  }, []);

  return (
    <div className="ops-page-shell max-w-3xl">
      <SettingsPageHeader
        title="Team"
        description="People who can access this workspace and their roles."
        actions={
          <span
            className="ops-chip cursor-not-allowed opacity-70"
            title="Invites coming in a future release"
          >
            Invite member · Soon
          </span>
        }
      />

      {error ? (
        <p role="alert" className="ops-alert-error mt-4">
          {error}
        </p>
      ) : null}

      <section className="ops-section-card mt-8">
        <h2 className="text-sm font-semibold text-[var(--text-primary)]">Members</h2>
        {loading ? (
          <p className="mt-4 text-sm text-[var(--text-secondary)]">Loading…</p>
        ) : members.length ? (
          <ul className="mt-4 divide-y" style={{ borderColor: 'var(--topbar-border)' }}>
            {members.map((member) => (
              <li
                key={member.userId}
                className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
              >
                <div className="min-w-0">
                  <p className="font-medium text-[var(--text-primary)]">
                    {member.fullName?.trim() || 'Unnamed member'}
                  </p>
                  <p className="mt-0.5 font-mono text-xs text-[var(--text-tertiary)]">
                    {member.userId.slice(0, 8)}…
                  </p>
                </div>
                <span className="ops-badge shrink-0 bg-[var(--surface-inset)] text-[var(--text-secondary)]">
                  {roleLabel(member.role)}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-sm text-[var(--text-secondary)]">No members found.</p>
        )}
      </section>

      <section className="ops-empty-state mt-6">
        <p className="font-medium text-[var(--text-primary)]">Invite teammates</p>
        <p className="mt-2">
          Email invites and role management are on the roadmap. For now, new users sign up and join
          via your organization bootstrap flow.
        </p>
      </section>
    </div>
  );
}
