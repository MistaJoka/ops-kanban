'use client';

import { cn } from '@/lib/utils';
import { PIPELINE_GROUP_LABELS, type PipelineGroupKey } from '@/lib/landscaping-full-pipeline';

const GROUP_KEYS: PipelineGroupKey[] = ['sales', 'production', 'billing', 'aftercare'];

export function PipelineGroupJump({
  activeGroup,
  onJump,
}: {
  activeGroup: PipelineGroupKey | null;
  onJump: (key: PipelineGroupKey) => void;
}) {
  return (
    <nav className="ops-group-jump" aria-label="Pipeline groups">
      <div className="ops-group-jump__track">
        {GROUP_KEYS.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => onJump(key)}
            className={cn(
              'ops-group-jump__chip',
              activeGroup === key && 'ops-group-jump__chip--active',
            )}
            aria-current={activeGroup === key ? 'true' : undefined}
          >
            {PIPELINE_GROUP_LABELS[key]}
          </button>
        ))}
      </div>
    </nav>
  );
}
