import type { CardActivityView } from '@/lib/domain/cards/cardDetail';

export function ActivityTimeline({ activities }: { activities: CardActivityView[] }) {
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)]">
        Activity
      </h3>
      <ul className="mt-3">
        {activities.length === 0 ? (
          <li className="text-sm text-[var(--text-secondary)]">No activity yet.</li>
        ) : (
          activities.map((activity) => (
            <li key={activity.id} className="ops-timeline-item">
              <p className="text-sm leading-snug text-[var(--text-primary)]">{activity.summary}</p>
              <p className="mt-1 font-mono text-[10px] uppercase tracking-wide text-[var(--text-tertiary)]">
                {activity.action.replace('.', ' ')} ·{' '}
                {new Date(activity.createdAt).toLocaleString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                })}
              </p>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
