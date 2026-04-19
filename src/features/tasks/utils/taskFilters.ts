import { endOfDay, startOfDay } from 'date-fns'
import type { Task } from '@/shared/types/entities'

export type TaskTimeFilter = 'all' | 'past' | 'today' | 'future' | 'nodue'

export function filterTasksByTime(tasks: Task[], filter: TaskTimeFilter): Task[] {
  const now = new Date()
  const dayStart = startOfDay(now)
  const dayEnd = endOfDay(now)

  return tasks.filter((t) => {
    const due = t.dueAt?.toDate() ?? null
    switch (filter) {
      case 'all':
        return true
      case 'nodue':
        return due === null
      case 'past':
        return due !== null && due < dayStart
      case 'today':
        return due !== null && due >= dayStart && due <= dayEnd
      case 'future':
        return due !== null && due > dayEnd
      default:
        return true
    }
  })
}
