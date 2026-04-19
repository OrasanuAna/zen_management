import { endOfDay, isAfter, parseISO, startOfDay } from 'date-fns'

export type ParsedReportRange = {
  from: Date
  to: Date
  swapped: boolean
  parseError: boolean
}

export function parseReportDateRange(
  fromStr: string,
  toStr: string,
  fallback: { from: Date; to: Date },
): ParsedReportRange {
  try {
    const rawFrom = startOfDay(parseISO(fromStr.trim()))
    const rawTo = endOfDay(parseISO(toStr.trim()))
    if (Number.isNaN(rawFrom.getTime()) || Number.isNaN(rawTo.getTime())) {
      return { from: fallback.from, to: fallback.to, swapped: false, parseError: true }
    }
    if (isAfter(rawFrom, rawTo)) {
      return {
        from: startOfDay(parseISO(toStr.trim())),
        to: endOfDay(parseISO(fromStr.trim())),
        swapped: true,
        parseError: false,
      }
    }
    return { from: rawFrom, to: rawTo, swapped: false, parseError: false }
  } catch {
    return { from: fallback.from, to: fallback.to, swapped: false, parseError: true }
  }
}
