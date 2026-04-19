import { useEffect, useState } from 'react'
import type { Employee } from '@/shared/types/entities'
import { subscribeEmployees } from '@/features/employees/services/employeesService'

type UseEmployeesResult = {
  employees: Employee[]
  loading: boolean
  error: string | null
}

export function useEmployees(organizationId: string | undefined): UseEmployeesResult {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!organizationId) {
      setEmployees([])
      setLoading(false)
      setError(null)
      return
    }

    setLoading(true)
    setError(null)

    const unsub = subscribeEmployees(
      organizationId,
      (list) => {
        setEmployees(list)
        setLoading(false)
      },
      (err) => {
        setError(err.message)
        setLoading(false)
      },
    )

    return () => unsub()
  }, [organizationId])

  return { employees, loading, error }
}
