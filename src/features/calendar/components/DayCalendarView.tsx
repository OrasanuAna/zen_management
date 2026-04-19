import { format, isSameDay } from 'date-fns'
import { ro } from 'date-fns/locale'
import { Link } from 'react-router-dom'
import { paths, pathTaskEdit } from '@/app/router/paths'
import type { TaskBuckets } from '@/features/calendar/utils/taskBuckets'
import { getTasksForDay } from '@/features/calendar/utils/taskBuckets'
import { TASK_STATUS_LABELS } from '@/features/tasks/constants/labels'
import { TaskStatus } from '@/shared/types/entities'
import { Card } from '@/shared/components/ui/Card'

type DayCalendarViewProps = {
  cursor: Date
  buckets: TaskBuckets
}

export function DayCalendarView({ cursor, buckets }: DayCalendarViewProps) {
  const list = getTasksForDay(buckets, cursor)
  const today = new Date()
  const isToday = isSameDay(cursor, today)

  return (
    <div className="zs-cal-day">
      <Card
        title={format(cursor, 'EEEE, d MMMM yyyy', { locale: ro })}
        subtitle={isToday ? 'Astăzi' : 'Sarcini cu termen în această zi'}
      >
        {list.length === 0 ? (
          <p className="zs-muted">Nu există sarcini programate pentru această dată.</p>
        ) : (
          <ul className="zs-cal-day__list">
            {list.map((t) => (
              <li key={t.id} className="zs-cal-day__item">
                <div className="zs-cal-day__time">
                  {t.dueAt ? format(t.dueAt.toDate(), 'HH:mm') : '—'}
                </div>
                <div className="zs-cal-day__body">
                  <Link to={pathTaskEdit(t.id)} className="zs-cal-day__title">
                    {t.title}
                  </Link>
                  {t.description ? <p className="zs-cal-day__desc zs-muted">{t.description}</p> : null}
                  <span
                    className={
                      t.status === TaskStatus.COMPLETED
                        ? 'zs-badge zs-badge--success'
                        : t.status === TaskStatus.CANCELLED
                          ? 'zs-badge zs-badge--muted'
                          : 'zs-badge zs-badge--pending'
                    }
                  >
                    {TASK_STATUS_LABELS[t.status]}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
        <p className="zs-cal-day__footer">
          <Link className="zs-link" to={paths.tasksNew}>
            + Adaugă sarcină cu termen
          </Link>
        </p>
      </Card>
    </div>
  )
}
