import { Timestamp } from 'firebase/firestore'

/** Valoare pentru input `datetime-local` din Timestamp (ora locală). */
export function timestampToDatetimeLocal(ts: Timestamp | null): string {
  if (!ts) return ''
  const d = ts.toDate()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/** Parsează string din `datetime-local`; gol → fără termen. */
export function parseDatetimeLocalToTimestamp(value: string): Timestamp | null {
  const trimmed = value.trim()
  if (!trimmed) return null
  const d = new Date(trimmed)
  if (Number.isNaN(d.getTime())) return null
  return Timestamp.fromDate(d)
}
