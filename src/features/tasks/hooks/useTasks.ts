import { useEffect, useState } from 'react'
import type { Task } from '@/shared/types/entities'
import { subscribeTasks } from '@/features/tasks/services/tasksService'

type UseTasksResult = {
  tasks: Task[]
  loading: boolean
  error: string | null
}

export function useTasks(organizationId: string | undefined): UseTasksResult {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!organizationId) {
      setTasks([])
      setLoading(false)
      setError(null)
      return
    }

    setLoading(true)
    setError(null)

    const unsub = subscribeTasks(
      organizationId,
      (list) => {
        setTasks(list)
        setLoading(false)
      },
      (err) => {
        setError(err.message)
        setLoading(false)
      },
    )

    return () => unsub()
  }, [organizationId])

  return { tasks, loading, error }
}
