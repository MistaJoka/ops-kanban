'use client';

import { useEffect, useState } from 'react';

import { DevResetBoardButton } from '@/components/workspace/DevResetBoardButton';

export function DevWorkspaceSection() {
  const [authDisabled, setAuthDisabled] = useState<boolean | null>(null);

  useEffect(() => {
    void fetch('/api/app/context')
      .then((response) => response.json())
      .then((payload) => {
        setAuthDisabled(Boolean(payload.data?.authDisabled));
      })
      .catch(() => setAuthDisabled(false));
  }, []);

  if (authDisabled !== true) {
    return null;
  }

  return (
    <section
      id="dev-workspace"
      className="ops-section-card space-y-4 border-[var(--accent)]/25 bg-[var(--accent-muted)]/40"
    >
      <div>
        <p className="ops-field-label text-[var(--accent)]">Development workspace</p>
        <p className="mt-1 text-sm leading-relaxed text-[var(--text-secondary)]">
          Auth bypassed for build — all phases in progress. Login and signup are disabled; use this
          workspace for local development and QA only.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <DevResetBoardButton variant="settings" />
        <p className="text-xs text-[var(--text-tertiary)]">
          Deletes all jobs and customers. Columns and settings are kept.
        </p>
      </div>
    </section>
  );
}
