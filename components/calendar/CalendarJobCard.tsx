import type { ScheduledCard } from '@/components/calendar/types';

export function CalendarJobCard({ card }: { card: ScheduledCard }) {
  return (
    <article className="ops-calendar-job">
      <p className="ops-calendar-job__title">{card.title}</p>
      <p className="ops-calendar-job__time">
        {new Date(card.scheduledStart).toLocaleTimeString(undefined, {
          hour: 'numeric',
          minute: '2-digit',
        })}
      </p>
    </article>
  );
}
