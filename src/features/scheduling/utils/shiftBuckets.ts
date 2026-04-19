import { endOfDay, endOfWeek, isSameDay, startOfDay, startOfWeek } from 'date-fns'
import type { Shift } from '@/shared/types/entities'

export function getShiftsForDay(shifts: Shift[], day: Date): Shift[] {
  return shifts.filter((s) => {
    if (!s.startAt) return false
    return isSameDay(s.startAt.toDate(), day)
  })
}

/** Schimburi cu început în intervalul săptămânii (luni–duminică, locale), după ziua de început. */
export function shiftsForWeek(shifts: Shift[], cursor: Date): Shift[] {
  const ws = startOfDay(startOfWeek(cursor, { weekStartsOn: 1 })).getTime()
  const we = endOfDay(endOfWeek(cursor, { weekStartsOn: 1 })).getTime()
  return shifts.filter((s) => {
    if (!s.startAt) return false
    const t = s.startAt.toDate().getTime()
    return t >= ws && t <= we
  })
}
