import { ChevronLeft, ChevronRight } from 'lucide-react';

type Props = {
  onPreviousWeek: () => void;
  onToday: () => void;
  onNextWeek: () => void;
};

export function CalendarToolbar({ onPreviousWeek, onToday, onNextWeek }: Props) {
  return (
    <div className="ops-toolbar">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="ops-page-title">Crew calendar</h1>
          <p className="mt-0.5 text-xs text-[var(--text-secondary)]">Scheduled jobs for the week</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onPreviousWeek}
            className="ops-btn-secondary px-2.5"
            aria-label="Previous week"
          >
            <ChevronLeft className="size-4" />
          </button>
          <button type="button" onClick={onToday} className="ops-btn-secondary">
            Today
          </button>
          <button
            type="button"
            onClick={onNextWeek}
            className="ops-btn-secondary px-2.5"
            aria-label="Next week"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
