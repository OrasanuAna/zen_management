import { eachDayOfInterval, endOfWeek, format, isSameDay, startOfWeek } from 'date-fns'
import { ro } from 'date-fns/locale'
import { getShiftsForDay } from '@/features/scheduling/utils/shiftBuckets'
import { RESTAURANT_ZONE_LABELS } from '@/features/employees/constants/labels'
import { IconTrash } from '@/shared/components/ui/ActionIcons'
import type { Shift } from '@/shared/types/entities'

type SchedulingWeekGridProps = {
  cursor: Date
  shifts: Shift[]
  employeeNameById: Record<string, string>
  onAddShift: (day: Date) => void
  onEditShift: (shift: Shift) => void
  onDeleteShift: (shift: Shift) => void
}

export function SchedulingWeekGrid({
  cursor,
  shifts,
  employeeNameById,
  onAddShift,
  onEditShift,
  onDeleteShift,
}: SchedulingWeekGridProps) {
  const start = startOfWeek(cursor, { weekStartsOn: 1 })
  const end = endOfWeek(cursor, { weekStartsOn: 1 })
  const days = eachDayOfInterval({ start, end })
  const today = new Date()

  return (
    <div className="zs-schedule-week">
      {days.map((day) => {
        const list = getShiftsForDay(shifts, day)
        const isToday = isSameDay(day, today)

        return (
          <section
            key={day.toISOString()}
            className={`zs-schedule-week__col ${isToday ? 'zs-schedule-week__col--today' : ''}`}
          >
            <div className="zs-schedule-week__head">
              <div className="zs-schedule-week__head-text">
                <span className="zs-schedule-week__dow">{format(day, 'EEE', { locale: ro })}</span>
                <span className="zs-schedule-week__dom">{format(day, 'd MMM', { locale: ro })}</span>
              </div>
              <button
                type="button"
                className="zs-schedule-week__add"
                onClick={() => onAddShift(day)}
                aria-label={`Adaugă schimb pentru ${format(day, 'd MMMM', { locale: ro })}`}
              >
                + Schimb
              </button>
            </div>
            <ul className="zs-schedule-week__list">
              {list.length === 0 ? (
                <li className="zs-schedule-week__empty">Niciun schimb</li>
              ) : (
                list.map((s) => {
                  const name = employeeNameById[s.employeeId] ?? 'Angajat necunoscut'
                  const startLabel = s.startAt ? format(s.startAt.toDate(), 'HH:mm') : '—'
                  const endLabel = s.endAt ? format(s.endAt.toDate(), 'HH:mm') : '—'
                  const zoneLabel = s.zone ? RESTAURANT_ZONE_LABELS[s.zone] : null

                  return (
                    <li key={s.id} className="zs-schedule-week__item">
                      <button
                        type="button"
                        className="zs-schedule-week__shift"
                        onClick={() => onEditShift(s)}
                      >
                        <span className="zs-schedule-week__time">
                          {startLabel} – {endLabel}
                        </span>
                        <span className="zs-schedule-week__name">{name}</span>
                        {zoneLabel ? (
                          <span className="zs-schedule-week__zone">{zoneLabel}</span>
                        ) : null}
                        {s.notes ? (
                          <span className="zs-schedule-week__notes zs-muted">{s.notes}</span>
                        ) : null}
                      </button>
                      <button
                        type="button"
                        className="zs-schedule-week__delete"
                        aria-label={`Șterge schimbul ${name}`}
                        title="Șterge"
                        onClick={() => onDeleteShift(s)}
                      >
                        <IconTrash width={18} height={18} />
                      </button>
                    </li>
                  )
                })
              )}
            </ul>
          </section>
        )
      })}
    </div>
  )
}
