'use client';

import type { CardDetailView } from '@/lib/domain/cards/cardDetail';
import { Field } from '@/components/card/Field';

export function PropertyTab({
  card,
  onSave,
  saving,
}: {
  card: CardDetailView;
  onSave: (form: FormData) => Promise<void>;
  saving: boolean;
}) {
  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        void onSave(new FormData(event.currentTarget));
      }}
    >
      <Field label="Customer name">
        <input
          name="name"
          defaultValue={card.customer?.name ?? ''}
          required
          className="field-input"
        />
      </Field>
      <Field label="Phone">
        <input name="phone" defaultValue={card.customer?.phone ?? ''} className="field-input" />
      </Field>
      <Field label="Email">
        <input
          name="email"
          type="email"
          defaultValue={card.customer?.email ?? ''}
          className="field-input"
        />
      </Field>
      <Field label="Property address">
        <input name="address" defaultValue={card.customer?.address ?? ''} className="field-input" />
      </Field>
      <Field label="Access notes">
        <textarea
          name="notes"
          defaultValue={card.customer?.notes ?? ''}
          rows={3}
          className="field-input"
        />
      </Field>
      <button type="submit" disabled={saving} className="ops-btn-primary">
        Save property
      </button>
    </form>
  );
}
