import {
  addDays,
  addMonths,
  addWeeks,
  format,
  subDays,
  subMonths,
  subWeeks,
  endOfWeek,
  startOfWeek,
} from 'date-fns'
import { ro } from 'date-fns/locale'
import { useCallback, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { pathTaskEdit, paths } from '@/app/router/paths'
import { useAuth } from '@/app/providers/AuthProvider'
import { CalendarToolbar } from '@/features/calendar/components/CalendarToolbar'
import { DayCalendarView } from '@/features/calendar/components/DayCalendarView'
import { MonthCalendarView } from '@/features/calendar/components/MonthCalendarView'
import { WeekCalendarView } from '@/features/calendar/components/WeekCalendarView'
import type { CalendarViewMode } from '@/features/calendar/types'
import { bucketTasksByDueDate } from '@/features/calendar/utils/taskBuckets'
import { useEmployees } from '@/features/employees/hooks/useEmployees'
import { useShifts } from '@/features/scheduling/hooks/useShifts'
import { shiftsForWeek } from '@/features/scheduling/utils/shiftBuckets'
import { useTasks } from '@/features/tasks/hooks/useTasks'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { Alert } from '@/shared/components/ui/Alert'
import { Card } from '@/shared/components/ui/Card'
import { Spinner } from '@/shared/components/ui/Spinner'
function periodLabel(view: CalendarViewMode, cursor: Date): string {
  if (view === 'month') {
    return format(cursor, 'LLLL yyyy', { locale: ro })
  }
  if (view === 'week') {
    const start = startOfWeek(cursor, { weekStartsOn: 1 })
    const end = endOfWeek(cursor, { weekStartsOn: 1 })
    return `${format(start, 'd MMM', { locale: ro })} – ${format(end, 'd MMM yyyy', { locale: ro })}`
  }
  return format(cursor, 'EEEE, d MMMM yyyy', { locale: ro })
}

function shiftCursor(view: CalendarViewMode, cursor: Date, dir: -1 | 1): Date {
  if (view === 'month') return dir === 1 ? addMonths(cursor, 1) : subMonths(cursor, 1)
  if (view === 'week') return dir === 1 ? addWeeks(cursor, 1) : subWeeks(cursor, 1)
  return dir === 1 ? addDays(cursor, 1) : subDays(cursor, 1)
}

export function CalendarPage() {
  const { profile } = useAuth()
  const orgId = profile?.organizationId
  const { tasks, loading, error } = useTasks(orgId)
  const { employees } = useEmployees(orgId)
  const { shifts: allShifts } = useShifts(orgId)

  const [cursor, setCursor] = useState(() => new Date())
  const [viewMode, setViewMode] = useState<CalendarViewMode>('month')

  const buckets = useMemo(() => bucketTasksByDueDate(tasks), [tasks])

  const weekShifts = useMemo(() => shiftsForWeek(allShifts, cursor), [allShifts, cursor])

  const shiftEmployeeNames = useMemo(() => {
    const m: Record<string, string> = {}
    for (const e of employees) {
      m[e.id] = e.fullName
    }
    return m
  }, [employees])

  const title = useMemo(() => periodLabel(viewMode, cursor), [viewMode, cursor])

  const handleSelectDay = useCallback((day: Date) => {
    setCursor(day)
    setViewMode('day')
  }, [])

  const handleToday = useCallback(() => {
    setCursor(new Date())
  }, [])

  if (!orgId) {
    return (
      <Alert variant="warning" title="Organizație necunoscută">
        Lipsește <code>organizationId</code> din profil.
      </Alert>
    )
  }

  return (
    <>
      <PageHeader
        title="Calendar"
        description="Sarcini cu termen — zi, săptămână sau lună. În modul Săptămână vezi și schimburile din Program."
      />

      {error ? (
        <Alert variant="error" title="Nu am putut încărca sarcinile">
          {error}
        </Alert>
      ) : null}

      <CalendarToolbar
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        periodLabel={title}
        onPrev={() => setCursor((c) => shiftCursor(viewMode, c, -1))}
        onNext={() => setCursor((c) => shiftCursor(viewMode, c, 1))}
        onToday={handleToday}
      />

      {loading ? (
        <div className="zs-employees-loading">
          <Spinner label="Se încarcă datele calendarului…" />
        </div>
      ) : (
        <>
          {viewMode === 'month' ? (
            <MonthCalendarView cursor={cursor} buckets={buckets} onSelectDay={handleSelectDay} />
          ) : null}
          {viewMode === 'week' ? (
            <WeekCalendarView
              cursor={cursor}
              buckets={buckets}
              onSelectDay={handleSelectDay}
              shifts={weekShifts}
              shiftEmployeeNames={shiftEmployeeNames}
            />
          ) : null}
          {viewMode === 'day' ? <DayCalendarView cursor={cursor} buckets={buckets} /> : null}

          {buckets.withoutDue.length > 0 ? (
            <Card
              className="zs-cal-no-due"
              title="Sarcini fără termen"
              subtitle="Nu apar pe grilă — poți seta un termen la editare."
            >
              <ul className="zs-cal-no-due__list">
                {buckets.withoutDue.map((t) => (
                  <li key={t.id}>
                    <Link to={pathTaskEdit(t.id)} className="zs-link zs-cal-no-due__link">
                      {t.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}

          <p className="zs-muted zs-cal-hint">
            <Link to={paths.tasks}>Lista completă sarcini</Link>
            {' · '}
            <Link to={paths.tasksNew}>Sarcină nouă</Link>
          </p>
        </>
      )}
    </>
  )
}
