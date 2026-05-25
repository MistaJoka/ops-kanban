import { CalendarJobCard } from '@/components/calendar/CalendarJobCard';
import type { ScheduledCard } from '@/components/calendar/types';
import { dayKey, formatDayHeader } from '@/lib/domain/calendar/weekDates';

type Props = {
  days: Date[];
  cardsByDay: Map<string, ScheduledCard[]>;
};

export function CalendarWeekTable({ days, cardsByDay }: Props) {
  const todayKey = dayKey(new Date());

  return (
    <div className="ops-calendar-week-wrap">
      <table className="ops-calendar-week" aria-label="Weekly schedule">
        <thead>
          <tr>
            {days.map((day) => {
              const isToday = dayKey(day) === todayKey;
              return (
                <th
                  key={day.toISOString()}
                  scope="col"
                  className={isToday ? 'ops-calendar-week__head--today' : undefined}
                >
                  {formatDayHeader(day)}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          <tr>
            {days.map((day) => {
              const key = dayKey(day);
              const dayCards = cardsByDay.get(key) ?? [];
              const isToday = key === todayKey;

              return (
                <td
                  key={day.toISOString()}
                  data-label={formatDayHeader(day)}
                  className={isToday ? 'ops-calendar-week__cell--today' : undefined}
                >
                  <div className="ops-calendar-week__jobs">
                    {dayCards.length === 0 ? (
                      <p className="ops-calendar-week__empty">No jobs</p>
                    ) : (
                      dayCards.map((card) => <CalendarJobCard key={card.id} card={card} />)
                    )}
                  </div>
                </td>
              );
            })}
          </tr>
        </tbody>
      </table>
    </div>
  );
}
