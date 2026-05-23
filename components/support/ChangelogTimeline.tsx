import {
  formatReleaseTimestamp,
  PRODUCT_CHANGELOG,
  type ChangelogSection,
  type ProductRelease,
} from '@/lib/content/productChangelog';

function SectionList({ section }: { section: ChangelogSection }) {
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-tertiary)]">
        {section.title}
      </h3>
      <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-[var(--text-secondary)]">
        {section.items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

function ReleaseEntry({ release }: { release: ProductRelease }) {
  return (
    <article className="ops-list-row">
      <header>
        <p className="font-mono text-xs uppercase tracking-[0.1em] text-[var(--text-tertiary)]">
          {formatReleaseTimestamp(release.releasedAt)}
        </p>
        <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h2 className="font-display text-lg font-semibold tracking-tight text-[var(--text-primary)]">
            {release.title}
          </h2>
          <span className="ops-badge bg-[var(--surface-inset)] text-[var(--text-secondary)]">
            v{release.version}
          </span>
        </div>
        {release.summary ? (
          <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">{release.summary}</p>
        ) : null}
      </header>

      <div className="mt-5 space-y-4">
        {release.sections.map((section) => (
          <SectionList key={`${release.version}-${section.title}`} section={section} />
        ))}
      </div>
    </article>
  );
}

export function ChangelogTimeline() {
  return (
    <div className="mt-8 space-y-4">
      {PRODUCT_CHANGELOG.map((release) => (
        <ReleaseEntry key={release.version} release={release} />
      ))}
    </div>
  );
}
