import type { TaskStatus } from '@/shared/types/entities'
import { TaskStatus as TS } from '@/shared/types/entities'

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  [TS.PENDING]: 'În așteptare',
  [TS.COMPLETED]: 'Finalizată',
  [TS.CANCELLED]: 'Anulată',
}

export const TASK_STATUS_OPTIONS = (Object.values(TS) as TaskStatus[]).map((value) => ({
  value,
  label: TASK_STATUS_LABELS[value],
}))

export const TASK_TIME_FILTER_LABELS = {
  all: 'Toate',
  past: 'Trecute',
  today: 'Astăzi',
  future: 'Viitoare',
  nodue: 'Fără termen',
} as const
