import type { PipelineGroupKey } from '@/lib/landscaping-full-pipeline';

const GROUP_ORDER: PipelineGroupKey[] = ['sales', 'production', 'billing', 'aftercare'];

export function pickActiveGroup(
  entries: Array<{ key: PipelineGroupKey; ratio: number }>,
): PipelineGroupKey | null {
  if (entries.length === 0) {
    return null;
  }

  let best: { key: PipelineGroupKey; ratio: number } | null = null;

  for (const entry of entries) {
    if (entry.ratio <= 0) continue;
    if (!best || entry.ratio > best.ratio) {
      best = entry;
    } else if (entry.ratio === best.ratio) {
      const entryIndex = GROUP_ORDER.indexOf(entry.key);
      const bestIndex = GROUP_ORDER.indexOf(best.key);
      if (entryIndex < bestIndex) {
        best = entry;
      }
    }
  }

  return best?.key ?? null;
}

export function nextGroupKey(current: PipelineGroupKey, direction: 1 | -1): PipelineGroupKey {
  const index = GROUP_ORDER.indexOf(current);
  const nextIndex = Math.max(0, Math.min(GROUP_ORDER.length - 1, index + direction));
  return GROUP_ORDER[nextIndex] ?? current;
}
