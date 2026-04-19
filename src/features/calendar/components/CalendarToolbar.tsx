import clsx from 'clsx'
import type { CalendarViewMode } from '@/features/calendar/types'

type CalendarToolbarProps = {
  viewMode: CalendarViewMode
  onViewModeChange: (mode: CalendarViewMode) => void
  periodLabel: string
  onPrev: () => void
  onNext: () => void
  onToday: () => void
}

const VIEW_OPTIONS: { mode: CalendarViewMode; label: string }[] = [
  { mode: 'day', label: 'Zi' },
  { mode: 'week', label: 'Săptămână' },
  { mode: 'month', label: 'Lună' },
]

export function CalendarToolbar({
  viewMode,
  onViewModeChange,
  periodLabel,
  onPrev,
  onNext,
  onToday,
}: CalendarToolbarProps) {
  return (
    <div className="zs-cal-toolbar">
      <div className="zs-cal-toolbar__views" role="tablist" aria-label="Mod calendar">
        {VIEW_OPTIONS.map(({ mode, label }) => (
          <button
            key={mode}
            type="button"
            role="tab"
            aria-selected={viewMode === mode}
            className={clsx('zs-cal-view-btn', viewMode === mode && 'zs-cal-view-btn--active')}
            onClick={() => onViewModeChange(mode)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="zs-cal-toolbar__nav">
        <button type="button" className="zs-icon-button" aria-label="Perioada anterioară" onClick={onPrev}>
          ‹
        </button>
        <h2 className="zs-cal-toolbar__title">{periodLabel}</h2>
        <button type="button" className="zs-icon-button" aria-label="Perioada următoare" onClick={onNext}>
          ›
        </button>
        <button type="button" className="zs-cal-today" onClick={onToday}>
          Astăzi
        </button>
      </div>
    </div>
  )
}
