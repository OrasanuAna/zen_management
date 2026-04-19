import { addDays } from 'date-fns'
import { parseDateKey } from '@/features/calendar/utils/dateKeys'

const TIME_RE = /^([01]?\d|2[0-3]):([0-5]\d)$/

export function parseTimeToParts(time: string): { h: number; m: number } | null {
  const m = TIME_RE.exec(time.trim())
  if (!m) return null
  return { h: Number(m[1]), m: Number(m[2]) }
}

export function combineDateAndTime(dateKey: string, timeHHmm: string): Date | null {
  const base = parseDateKey(dateKey)
  const parts = parseTimeToParts(timeHHmm)
  if (!base || !parts) return null
  const d = new Date(base)
  d.setHours(parts.h, parts.m, 0, 0)
  return d
}

/** Dacă ora de sfârșit nu e după început în aceeași zi, se consideră a doua zi (schimb de noapte). */
export function resolveShiftEnd(start: Date, dateKey: string, endTimeHHmm: string): Date | null {
  const endSameDay = combineDateAndTime(dateKey, endTimeHHmm)
  if (!endSameDay) return null
  if (endSameDay.getTime() > start.getTime()) return endSameDay
  return addDays(endSameDay, 1)
}
