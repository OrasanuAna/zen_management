import { useEffect, useState } from 'react'
import { subscribeProcedureRunsForOrganization } from '@/features/procedures/services/proceduresService'
import type { ProcedureRun } from '@/shared/types/entities'

type Result = {
  runs: ProcedureRun[]
  loading: boolean
  error: string | null
}

export function useProcedureRunsList(organizationId: string | undefined): Result {
  const [runs, setRuns] = useState<ProcedureRun[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!organizationId) {
      setRuns([])
      setLoading(false)
      setError(null)
      return
    }

    setLoading(true)
    setError(null)

    const unsub = subscribeProcedureRunsForOrganization(
      organizationId,
      (list) => {
        setRuns(list)
        setLoading(false)
      },
      (err) => {
        setError(err.message)
        setLoading(false)
      },
    )

    return () => unsub()
  }, [organizationId])

  return { runs, loading, error }
}
