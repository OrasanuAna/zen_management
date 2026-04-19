import { dateToKey } from '@/features/calendar/utils/dateKeys'
import { filterTasksByTime } from '@/features/tasks/utils/taskFilters'
import type { ProcedureRun, Shift, Task } from '@/shared/types/entities'
import { ProcedureType, TaskStatus } from '@/shared/types/entities'

export function tasksDueTodayStats(tasks: Task[]) {
  const today = filterTasksByTime(tasks, 'today')
  return {
    total: today.length,
    pending: today.filter((t) => t.status === TaskStatus.PENDING).length,
    completed: today.filter((t) => t.status === TaskStatus.COMPLETED).length,
    cancelled: today.filter((t) => t.status === TaskStatus.CANCELLED).length,
  }
}

export function tasksDueTodayList(tasks: Task[]): Task[] {
  return filterTasksByTime(tasks, 'today')
}

export function procedureStatusForDateKey(runs: ProcedureRun[], dateKey: string) {
  const opening = runs.find((r) => r.dateKey === dateKey && r.type === ProcedureType.OPENING)
  const closing = runs.find((r) => r.dateKey === dateKey && r.type === ProcedureType.CLOSING)
  return {
    openingDone: opening?.completedAt != null,
    closingDone: closing?.completedAt != null,
    hasOpening: Boolean(opening),
    hasClosing: Boolean(closing),
  }
}

export function recentTasksByActivity(tasks: Task[], limit: number): Task[] {
  return [...tasks]
    .sort((a, b) => {
      const am = (a.updatedAt ?? a.createdAt)?.toMillis() ?? 0
      const bm = (b.updatedAt ?? b.createdAt)?.toMillis() ?? 0
      return bm - am
    })
    .slice(0, limit)
}

/** Schimburi cu început de astăzi înainte (inclusiv trecut în aceeași zi), sortate cronologic. */
export function shiftsStartingFromToday(shifts: Shift[], limit: number, now: Date = new Date()): Shift[] {
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  return [...shifts]
    .filter((s) => {
      if (!s.startAt) return false
      return s.startAt.toMillis() >= startOfToday
    })
    .sort((a, b) => (a.startAt?.toMillis() ?? 0) - (b.startAt?.toMillis() ?? 0))
    .slice(0, limit)
}

export function todayDateKey(now: Date = new Date()): string {
  return dateToKey(now)
}
