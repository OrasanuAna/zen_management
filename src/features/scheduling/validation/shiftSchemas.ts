import { z } from 'zod'
import { RestaurantZone as RZ } from '@/shared/types/entities'
import { combineDateAndTime, parseTimeToParts, resolveShiftEnd } from '@/features/scheduling/utils/shiftTimes'

const timeMsg = 'Format HH:mm (ex. 09:30).'

export const shiftFormSchema = z
  .object({
    employeeId: z.string().min(1, 'Alege angajatul.'),
    dateKey: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Dată invalidă.'),
    startTime: z
      .string()
      .min(1, timeMsg)
      .refine((s) => parseTimeToParts(s) != null, timeMsg),
    endTime: z
      .string()
      .min(1, timeMsg)
      .refine((s) => parseTimeToParts(s) != null, timeMsg),
    zone: z.union([z.literal(''), z.enum([RZ.DINING, RZ.BAR, RZ.TERRACE, RZ.KITCHEN])]),
    notes: z.string().max(500, 'Nota este prea lungă.').optional(),
  })
  .superRefine((val, ctx) => {
    const start = combineDateAndTime(val.dateKey, val.startTime)
    const end = start ? resolveShiftEnd(start, val.dateKey, val.endTime) : null
    if (!start || !end) {
      ctx.addIssue({ code: 'custom', message: 'Dată sau oră invalidă.', path: ['dateKey'] })
      return
    }
    const maxMs = 24 * 60 * 60 * 1000
    if (end.getTime() - start.getTime() > maxMs) {
      ctx.addIssue({
        code: 'custom',
        message: 'Schimbul nu poate depăși 24 de ore.',
        path: ['endTime'],
      })
    }
  })

export type ShiftFormValues = z.infer<typeof shiftFormSchema>

export function formValuesToShiftRange(values: ShiftFormValues): { start: Date; end: Date } | null {
  const start = combineDateAndTime(values.dateKey, values.startTime)
  if (!start) return null
  const end = resolveShiftEnd(start, values.dateKey, values.endTime)
  if (!end || end.getTime() <= start.getTime()) return null
  const maxMs = 24 * 60 * 60 * 1000
  if (end.getTime() - start.getTime() > maxMs) return null
  return { start, end }
}
