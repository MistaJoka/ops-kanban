export function computeInsertPosition(
  columnCards: Array<{ position: number }>,
  insertIndex: number,
): number {
  const sorted = [...columnCards].sort((a, b) => a.position - b.position);
  const clampedIndex = Math.max(0, Math.min(insertIndex, sorted.length));

  if (sorted.length === 0) {
    return 0;
  }

  if (clampedIndex === 0) {
    return sorted[0]!.position - 1;
  }

  if (clampedIndex >= sorted.length) {
    return sorted[sorted.length - 1]!.position + 1;
  }

  const previousPosition = sorted[clampedIndex - 1]!.position;
  const nextPosition = sorted[clampedIndex]!.position;

  if (nextPosition - previousPosition > 0) {
    return previousPosition + (nextPosition - previousPosition) / 2;
  }

  return clampedIndex;
}
