import {
  endOfDay,
  endOfMonth,
  startOfDay,
  startOfMonth,
  subDays,
  subMonths,
} from 'date-fns'

export type ReportRange = { from: Date; to: Date }

export function last30DaysRange(now: Date = new Date()): ReportRange {
  return { from: startOfDay(subDays(now, 29)), to: endOfDay(now) }
}

export function currentMonthRange(now: Date = new Date()): ReportRange {
  return { from: startOfMonth(now), to: endOfDay(now) }
}

export function previousMonthRange(now: Date = new Date()): ReportRange {
  const prev = subMonths(now, 1)
  return { from: startOfMonth(prev), to: endOfMonth(prev) }
}
