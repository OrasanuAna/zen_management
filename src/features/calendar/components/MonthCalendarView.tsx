import { addDays, format, isSameDay, isSameMonth } from 'date-fns'
import { ro } from 'date-fns/locale'
import { Link } from 'react-router-dom'
import { pathTaskEdit } from '@/app/router/paths'
import type { TaskBuckets } from '@/features/calendar/utils/taskBuckets'
import { dateToKey } from '@/features/calendar/utils/dateKeys'
import { getMonthGridDates } from '@/features/calendar/utils/monthGrid'
import { TaskStatus } from '@/shared/types/entities'

type MonthCalendarViewProps = {
  cursor: Date
  buckets: TaskBuckets
  onSelectDay: (day: Date) => void
}

/** Luni 1 ian 2024 = zi de început de săptămână (luni). */
const WEEK_LABEL_ANCHOR = new Date(2024, 0, 1)
const WEEKDAYS = Array.from({ length: 7 }, (_, i) =>
  format(addDays(WEEK_LABEL_ANCHOR, i), 'EEE', { locale: ro }),
)

export function MonthCalendarView({ cursor, buckets, onSelectDay }: MonthCalendarViewProps) {
  const monthAnchor = new Date(cursor.getFullYear(), cursor.getMonth(), 1)
  const cells = getMonthGridDates(monthAnchor)
  const today = new Date()

  return (
    <div className="zs-cal-month">
      <div className="zs-cal-month__weekdays" role="row">
        {WEEKDAYS.map((label) => (
          <div key={label} className="zs-cal-month__weekday" role="columnheader">
            {label}
          </div>
        ))}
      </div>
      <div className="zs-cal-month__grid" role="grid">
        {cells.map((day) => {
          const key = dateToKey(day)
          const dayTasks = buckets.byDay.get(key) ?? []
          const inMonth = isSameMonth(day, monthAnchor)
          const isToday = isSameDay(day, today)
          const preview = dayTasks.slice(0, 2)

          return (
            <button
              key={key}
              type="button"
              className={`zs-cal-cell ${!inMonth ? 'zs-cal-cell--outside' : ''} ${isToday ? 'zs-cal-cell--today' : ''}`}
              onClick={() => onSelectDay(day)}
            >
              <span className="zs-cal-cell__num">{format(day, 'd')}</span>
              <ul className="zs-cal-cell__tasks">
                {preview.map((t) => (
                  <li key={t.id}>
                    <Link
                      to={pathTaskEdit(t.id)}
                      className="zs-cal-task-link"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span
                        className={
                          t.status === TaskStatus.COMPLETED
                            ? 'zs-cal-dot zs-cal-dot--done'
                            : t.status === TaskStatus.CANCELLED
                              ? 'zs-cal-dot zs-cal-dot--off'
                              : 'zs-cal-dot'
                        }
                        aria-hidden
                      />
                      <span className="zs-cal-task-title">{t.title}</span>
                    </Link>
                  </li>
                ))}
                {dayTasks.length > 2 ? (
                  <li className="zs-cal-cell__more">+{dayTasks.length - 2} sarcini</li>
                ) : null}
              </ul>
            </button>
          )
        })}
      </div>
    </div>
  )
}
