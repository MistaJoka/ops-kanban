export function BoardCardSkeleton({ title }: { title?: string }) {
  return (
    <article
      className="ops-board-card ops-board-card--skeleton"
      aria-label={title ? `Creating ${title}` : 'Creating job'}
      aria-busy="true"
    >
      <div className="ops-board-card__surface">
        <div className="ops-board-card__inner">
          {title ? (
            <h3 className="ops-board-card__title">{title}</h3>
          ) : (
            <div className="ops-skeleton ops-skeleton--title" />
          )}
          <div className="ops-skeleton ops-skeleton--line" />
          <div className="ops-skeleton ops-skeleton--meta" />
          <div className="ops-skeleton ops-skeleton--footer" />
        </div>
      </div>
    </article>
  );
}
