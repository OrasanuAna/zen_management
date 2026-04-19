import type { Task } from '@/shared/types/entities'
import { dateToKey } from '@/features/calendar/utils/dateKeys'

export type TaskBuckets = {
  byDay: Map<string, Task[]>
  withoutDue: Task[]
}

export function bucketTasksByDueDate(tasks: Task[]): TaskBuckets {
  const byDay = new Map<string, Task[]>()
  const withoutDue: Task[] = []

  for (const t of tasks) {
    if (!t.dueAt) {
      withoutDue.push(t)
      continue
    }
    const key = dateToKey(t.dueAt.toDate())
    const list = byDay.get(key) ?? []
    list.push(t)
    byDay.set(key, list)
  }

  for (const [, list] of byDay) {
    list.sort((a, b) => {
      const ta = a.dueAt?.toMillis() ?? 0
      const tb = b.dueAt?.toMillis() ?? 0
      return ta - tb
    })
  }

  withoutDue.sort((a, b) => a.title.localeCompare(b.title, 'ro', { sensitivity: 'base' }))

  return { byDay, withoutDue }
}

export function getTasksForDay(buckets: TaskBuckets, day: Date): Task[] {
  return buckets.byDay.get(dateToKey(day)) ?? []
}
