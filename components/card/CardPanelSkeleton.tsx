export function CardPanelSkeleton() {
  return (
    <div
      className="ops-panel-skeleton flex min-h-0 flex-1 flex-col"
      role="status"
      aria-live="polite"
    >
      <span className="sr-only">Loading job…</span>
      <div className="ops-panel-skeleton__header">
        <div className="ops-skeleton ops-skeleton--panel-title" />
        <div className="ops-skeleton ops-skeleton--panel-line" />
        <div className="flex gap-2 pt-2">
          <div className="ops-skeleton ops-skeleton--pill" />
          <div className="ops-skeleton ops-skeleton--pill-sm" />
        </div>
      </div>
      <div className="ops-panel-skeleton__tabs">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="ops-skeleton ops-skeleton--tab" />
        ))}
      </div>
      <div className="ops-panel-skeleton__body">
        <div className="ops-skeleton ops-skeleton--block" />
        <div className="ops-skeleton ops-skeleton--block-short" />
      </div>
    </div>
  );
}
