import {
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  startOfMonth,
  startOfWeek,
} from 'date-fns'

const WEEK_STARTS_ON = 1 as const

/** Toate zilele afișate în grila lunii (inclusiv zile din luni adiacente). */
export function getMonthGridDates(monthAnchor: Date): Date[] {
  const start = startOfWeek(startOfMonth(monthAnchor), { weekStartsOn: WEEK_STARTS_ON })
  const end = endOfWeek(endOfMonth(monthAnchor), { weekStartsOn: WEEK_STARTS_ON })
  return eachDayOfInterval({ start, end })
}
