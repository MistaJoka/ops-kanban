'use client';

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="ops-field-label">{label}</span>
      {children}
    </label>
  );
}
