import { endOfDay, isAfter, isBefore, parseISO, startOfDay, subDays } from 'date-fns'
import { checklistForType } from '@/features/procedures/constants/checklists'
import { EMPLOYEE_ROLE_LABELS, RESTAURANT_ZONE_LABELS } from '@/features/employees/constants/labels'
import type {
  Employee,
  EmployeeRole,
  ProcedureRun,
  RestaurantZone,
  Shift,
  Task,
} from '@/shared/types/entities'
import { ProcedureType, TaskStatus } from '@/shared/types/entities'

export type StatsPeriod = '7d' | '30d' | 'all'

export function periodToSince(period: StatsPeriod, now: Date = new Date()): Date | null {
  if (period === 'all') return null
  const days = period === '7d' ? 7 : 30
  return startOfDay(subDays(now, days))
}

export function taskCountsByStatus(tasks: Task[]): Record<TaskStatus, number> {
  const init: Record<TaskStatus, number> = {
    [TaskStatus.PENDING]: 0,
    [TaskStatus.COMPLETED]: 0,
    [TaskStatus.CANCELLED]: 0,
  }
  for (const t of tasks) {
    init[t.status] += 1
  }
  return init
}

export function tasksInPeriod(tasks: Task[], since: Date | null, now: Date = new Date()): Task[] {
  if (!since) return tasks
  return tasksInDateRange(tasks, since, now)
}

/** Filtrare după activitate (completedAt → updatedAt → createdAt) în [rangeStart, rangeEnd]. */
export function tasksInDateRange(tasks: Task[], rangeStart: Date, rangeEnd: Date): Task[] {
  const start = startOfDay(rangeStart)
  const end = endOfDay(rangeEnd)
  return tasks.filter((t) => {
    const ref = t.completedAt ?? t.updatedAt ?? t.createdAt
    if (!ref) return false
    const d = ref.toDate()
    return !isBefore(d, start) && !isAfter(d, end)
  })
}

export type AssigneeTaskRow = {
  employeeId: string
  name: string
  total: number
  completed: number
}

export function tasksByAssigneeFromList(filtered: Task[], employees: Employee[]): AssigneeTaskRow[] {
  const withAssignee = filtered.filter((t) => t.assignedToEmployeeId)
  const byId = new Map<string, { total: number; completed: number }>()
  for (const t of withAssignee) {
    const id = t.assignedToEmployeeId as string
    const cur = byId.get(id) ?? { total: 0, completed: 0 }
    cur.total += 1
    if (t.status === TaskStatus.COMPLETED) cur.completed += 1
    byId.set(id, cur)
  }
  const nameById = new Map(employees.map((e) => [e.id, e.fullName]))
  const rows: AssigneeTaskRow[] = []
  for (const [employeeId, v] of byId) {
    rows.push({
      employeeId,
      name: nameById.get(employeeId) ?? 'Angajat',
      total: v.total,
      completed: v.completed,
    })
  }
  rows.sort((a, b) => b.total - a.total)
  return rows
}

export function tasksByAssignee(
  tasks: Task[],
  employees: Employee[],
  since: Date | null,
  now?: Date,
): AssigneeTaskRow[] {
  const filtered = tasksInPeriod(tasks, since, now)
  return tasksByAssigneeFromList(filtered, employees)
}

export function countEmployeesByRole(employees: Employee[]): { role: EmployeeRole; count: number; label: string }[] {
  const m = new Map<EmployeeRole, number>()
  for (const e of employees) {
    m.set(e.role, (m.get(e.role) ?? 0) + 1)
  }
  return (Array.from(m.entries()) as [EmployeeRole, number][])
    .map(([role, count]) => ({ role, count, label: EMPLOYEE_ROLE_LABELS[role] }))
    .sort((a, b) => b.count - a.count)
}

export function countEmployeesByZone(employees: Employee[]): {
  zone: RestaurantZone
  count: number
  label: string
}[] {
  const m = new Map<RestaurantZone, number>()
  for (const e of employees) {
    m.set(e.zone, (m.get(e.zone) ?? 0) + 1)
  }
  return (Array.from(m.entries()) as [RestaurantZone, number][])
    .map(([zone, count]) => ({ zone, count, label: RESTAURANT_ZONE_LABELS[zone] }))
    .sort((a, b) => b.count - a.count)
}

export type ShiftEmployeeRow = {
  employeeId: string
  name: string
  shiftCount: number
  hoursApprox: number
}

export function shiftsInDateRange(shifts: Shift[], rangeStart: Date, rangeEnd: Date): Shift[] {
  const start = startOfDay(rangeStart)
  const end = endOfDay(rangeEnd)
  return shifts.filter((s) => {
    if (!s.startAt) return false
    const st = s.startAt.toDate()
    return !isBefore(st, start) && !isAfter(st, end)
  })
}

export function shiftStatsInDateRange(
  shifts: Shift[],
  employees: Employee[],
  rangeStart: Date,
  rangeEnd: Date,
): { rows: ShiftEmployeeRow[]; totalHours: number; totalShifts: number } {
  const filtered = shiftsInDateRange(shifts, rangeStart, rangeEnd)

  const nameById = new Map(employees.map((e) => [e.id, e.fullName]))
  const byEmp = new Map<string, { count: number; hours: number }>()

  for (const s of filtered) {
    const h = shiftDurationHours(s)
    const cur = byEmp.get(s.employeeId) ?? { count: 0, hours: 0 }
    cur.count += 1
    cur.hours += h
    byEmp.set(s.employeeId, cur)
  }

  const rows: ShiftEmployeeRow[] = []
  for (const [employeeId, v] of byEmp) {
    rows.push({
      employeeId,
      name: nameById.get(employeeId) ?? 'Angajat',
      shiftCount: v.count,
      hoursApprox: Math.round(v.hours * 10) / 10,
    })
  }
  rows.sort((a, b) => b.hoursApprox - a.hoursApprox)

  const totalHours = rows.reduce((s, r) => s + r.hoursApprox, 0)
  return { rows, totalHours: Math.round(totalHours * 10) / 10, totalShifts: filtered.length }
}

export function shiftStatsInPeriod(
  shifts: Shift[],
  employees: Employee[],
  since: Date | null,
  now: Date = new Date(),
): { rows: ShiftEmployeeRow[]; totalHours: number; totalShifts: number } {
  if (!since) {
    const end = endOfDay(now)
    const start = new Date(0)
    return shiftStatsInDateRange(shifts, employees, start, end)
  }
  return shiftStatsInDateRange(shifts, employees, since, now)
}

function shiftDurationHours(s: Shift): number {
  if (!s.startAt || !s.endAt) return 0
  const ms = s.endAt.toMillis() - s.startAt.toMillis()
  if (ms <= 0) return 0
  return ms / (1000 * 60 * 60)
}

function parseDateKeyBounds(dateKey: string): { start: Date; end: Date } | null {
  try {
    const d = parseISO(`${dateKey}T12:00:00`)
    if (Number.isNaN(d.getTime())) return null
    return { start: startOfDay(d), end: endOfDay(d) }
  } catch {
    return null
  }
}

export function procedureRunsInDateRange(
  runs: ProcedureRun[],
  rangeStart: Date,
  rangeEnd: Date,
): ProcedureRun[] {
  const start = startOfDay(rangeStart)
  const end = endOfDay(rangeEnd)
  return runs.filter((r) => {
    const b = parseDateKeyBounds(r.dateKey)
    if (!b) return false
    return !isBefore(b.end, start) && !isAfter(b.start, end)
  })
}

export function procedureRunsInPeriod(
  runs: ProcedureRun[],
  since: Date | null,
  now: Date = new Date(),
): ProcedureRun[] {
  const end = endOfDay(now)
  if (!since) {
    const start = new Date(0)
    return procedureRunsInDateRange(runs, start, end)
  }
  return procedureRunsInDateRange(runs, since, end)
}

export type ProcedureSummary = {
  openingFinalized: number
  closingFinalized: number
  openingOpen: number
  closingOpen: number
  avgOpeningChecklistPct: number | null
  avgClosingChecklistPct: number | null
}

export function summarizeProcedureRunsList(list: ProcedureRun[]): ProcedureSummary {
  let openingFinalized = 0
  let closingFinalized = 0
  let openingOpen = 0
  let closingOpen = 0
  let openingPctSum = 0
  let openingPctN = 0
  let closingPctSum = 0
  let closingPctN = 0

  const openingLen = checklistForType(ProcedureType.OPENING).length
  const closingLen = checklistForType(ProcedureType.CLOSING).length

  for (const r of list) {
    const finalized = r.completedAt != null
    const len = r.type === ProcedureType.CLOSING ? closingLen : openingLen
    const done = len > 0 ? Object.values(r.itemsState).filter((x) => x.done).length / len : 0

    if (r.type === ProcedureType.CLOSING) {
      if (finalized) {
        closingFinalized += 1
        closingPctSum += done
        closingPctN += 1
      } else {
        closingOpen += 1
      }
    } else {
      if (finalized) {
        openingFinalized += 1
        openingPctSum += done
        openingPctN += 1
      } else {
        openingOpen += 1
      }
    }
  }

  return {
    openingFinalized,
    closingFinalized,
    openingOpen,
    closingOpen,
    avgOpeningChecklistPct: openingPctN > 0 ? Math.round((openingPctSum / openingPctN) * 100) : null,
    avgClosingChecklistPct: closingPctN > 0 ? Math.round((closingPctSum / closingPctN) * 100) : null,
  }
}

export function summarizeProcedures(runs: ProcedureRun[], since: Date | null, now?: Date): ProcedureSummary {
  return summarizeProcedureRunsList(procedureRunsInPeriod(runs, since, now))
}
