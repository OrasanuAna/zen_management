import { useEffect, useState } from 'react'
import type { Shift } from '@/shared/types/entities'
import { subscribeShifts } from '@/features/scheduling/services/shiftsService'

type UseShiftsResult = {
  shifts: Shift[]
  loading: boolean
  error: string | null
}

export function useShifts(organizationId: string | undefined): UseShiftsResult {
  const [shifts, setShifts] = useState<Shift[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!organizationId) {
      setShifts([])
      setLoading(false)
      setError(null)
      return
    }

    setLoading(true)
    setError(null)

    const unsub = subscribeShifts(
      organizationId,
      (list) => {
        setShifts(list)
        setLoading(false)
      },
      (err) => {
        setError(err.message)
        setLoading(false)
      },
    )

    return () => unsub()
  }, [organizationId])

  return { shifts, loading, error }
}
