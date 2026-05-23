'use client';

import type { CardDetailView } from '@/lib/domain/cards/cardDetail';
import type { OrgMemberView } from '@/lib/domain/organization/listMembers';
import { toLocalInput } from '@/components/card/cardPatchUtils';
import { Field } from '@/components/card/Field';

export function ScheduleTab({
  card,
  members,
  onPatch,
  saving,
}: {
  card: CardDetailView;
  members: OrgMemberView[];
  onPatch: (patch: Record<string, unknown>) => Promise<void>;
  saving: boolean;
}) {
  return (
    <div className="space-y-4">
      <Field label="Scheduled start">
        <input
          type="datetime-local"
          defaultValue={toLocalInput(card.scheduledStart)}
          onBlur={(event) =>
            void onPatch({
              scheduledStart: event.target.value
                ? new Date(event.target.value).toISOString()
                : null,
            })
          }
          className="field-input"
        />
      </Field>
      <Field label="Scheduled end">
        <input
          type="datetime-local"
          defaultValue={toLocalInput(card.scheduledEnd)}
          onBlur={(event) =>
            void onPatch({
              scheduledEnd: event.target.value
                ? new Date(event.target.value).toISOString()
                : null,
            })
          }
          className="field-input"
        />
      </Field>
      <Field label="Crew assignee">
        <select
          value={card.assignedTo ?? ''}
          onChange={(event) =>
            void onPatch({ assignedTo: event.target.value || null })
          }
          className="field-input"
          disabled={saving}
        >
          <option value="">Unassigned</option>
          {members.map((member) => (
            <option key={member.userId} value={member.userId}>
              {member.fullName ?? member.userId}
            </option>
          ))}
        </select>
      </Field>
    </div>
  );
}
