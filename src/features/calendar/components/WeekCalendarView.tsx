import { eachDayOfInterval, endOfWeek, format, isSameDay, startOfWeek } from 'date-fns'
import { ro } from 'date-fns/locale'
import { Link } from 'react-router-dom'
import { pathTaskEdit, paths } from '@/app/router/paths'
import { getShiftsForDay } from '@/features/scheduling/utils/shiftBuckets'
import type { TaskBuckets } from '@/features/calendar/utils/taskBuckets'
import { getTasksForDay } from '@/features/calendar/utils/taskBuckets'
import { TASK_STATUS_LABELS } from '@/features/tasks/constants/labels'
import type { Shift } from '@/shared/types/entities'
import { TaskStatus } from '@/shared/types/entities'

type WeekCalendarViewProps = {
  cursor: Date
  buckets: TaskBuckets
  onSelectDay: (day: Date) => void
  shifts?: Shift[]
  shiftEmployeeNames?: Record<string, string>
}

export function WeekCalendarView({
  cursor,
  buckets,
  onSelectDay,
  shifts = [],
  shiftEmployeeNames = {},
}: WeekCalendarViewProps) {
  const start = startOfWeek(cursor, { weekStartsOn: 1 })
  const end = endOfWeek(cursor, { weekStartsOn: 1 })
  const days = eachDayOfInterval({ start, end })
  const today = new Date()

  return (
    <div className="zs-cal-week">
      {days.map((day) => {
        const list = getTasksForDay(buckets, day)
        const shiftList = getShiftsForDay(shifts, day)
        const isToday = isSameDay(day, today)

        return (
          <section
            key={day.toISOString()}
            className={`zs-cal-week__col ${isToday ? 'zs-cal-week__col--today' : ''}`}
          >
            <button type="button" className="zs-cal-week__head" onClick={() => onSelectDay(day)}>
              <span className="zs-cal-week__dow">{format(day, 'EEE', { locale: ro })}</span>
              <span className="zs-cal-week__dom">{format(day, 'd MMM', { locale: ro })}</span>
            </button>
            <ul className="zs-cal-week__list">
              {list.length === 0 ? (
                <li className="zs-cal-week__empty">Fără sarcini</li>
              ) : (
                list.map((t) => (
                  <li key={t.id}>
                    <Link to={pathTaskEdit(t.id)} className="zs-cal-week__task">
                      <span className="zs-cal-week__time">
                        {t.dueAt ? format(t.dueAt.toDate(), 'HH:mm') : '—'}
                      </span>
                      <span className="zs-cal-week__task-title">{t.title}</span>
                      <span
                        className={
                          t.status === TaskStatus.COMPLETED
                            ? 'zs-badge zs-badge--success zs-cal-week__badge'
                            : t.status === TaskStatus.CANCELLED
                              ? 'zs-badge zs-badge--muted zs-cal-week__badge'
                              : 'zs-badge zs-badge--pending zs-cal-week__badge'
                        }
                      >
                        {TASK_STATUS_LABELS[t.status]}
                      </span>
                    </Link>
                  </li>
                ))
              )}
            </ul>
            {shiftList.length > 0 ? (
              <div className="zs-cal-week__shifts">
                <p className="zs-cal-week__shifts-label">
                  <Link to={paths.scheduling} className="zs-cal-week__shifts-link">
                    Schimburi
                  </Link>
                </p>
                <ul className="zs-cal-week__shift-list">
                  {shiftList.map((s) => {
                    const name = shiftEmployeeNames[s.employeeId] ?? 'Echipă'
                    const a = s.startAt ? format(s.startAt.toDate(), 'HH:mm') : '—'
                    const b = s.endAt ? format(s.endAt.toDate(), 'HH:mm') : '—'
                    return (
                      <li key={s.id} className="zs-cal-week__shift-row">
                        <span className="zs-cal-week__time">
                          {a}–{b}
                        </span>
                        <span className="zs-cal-week__shift-name">{name}</span>
                      </li>
                    )
                  })}
                </ul>
              </div>
            ) : null}
          </section>
        )
      })}
    </div>
  )
}
