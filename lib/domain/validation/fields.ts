export function validateCardTitle(title: string): { ok: true } | { ok: false; error: string } {
  if (!title.trim()) {
    return { ok: false, error: 'Title is required.' };
  }
  return { ok: true };
}

export function validateRevenueValue(value: number): { ok: true } | { ok: false; error: string } {
  if (value < 0) {
    return { ok: false, error: 'Revenue value must be non-negative.' };
  }
  return { ok: true };
}
