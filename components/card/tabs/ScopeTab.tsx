'use client';

import type { CardDetailView } from '@/lib/domain/cards/cardDetail';
import { Field } from '@/components/card/Field';

export function ScopeTab({
  card,
  onPatch,
  saving,
}: {
  card: CardDetailView;
  onPatch: (patch: Record<string, unknown>) => Promise<void>;
  saving: boolean;
}) {
  return (
    <div className="space-y-4">
      <Field label="Job type">
        <select
          value={card.jobType ?? ''}
          onChange={(event) =>
            void onPatch({ jobType: event.target.value || null })
          }
          className="field-input"
          disabled={saving}
        >
          <option value="">Select type</option>
          {['maintenance', 'install', 'hardscape', 'cleanup', 'irrigation', 'other'].map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Scope / description">
        <textarea
          defaultValue={card.description ?? ''}
          rows={8}
          onBlur={(event) => void onPatch({ description: event.target.value || null })}
          className="field-input"
        />
      </Field>
    </div>
  );
}
