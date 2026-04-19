import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  checklistForType,
  initialItemsState,
} from '@/features/procedures/constants/checklists'
import {
  ensureProcedureRun,
  subscribeProcedureRun,
} from '@/features/procedures/services/proceduresService'
import type { ProcedureItemState, ProcedureRun, ProcedureType } from '@/shared/types/entities'

type UseProcedureRunResult = {
  run: ProcedureRun | null
  loading: boolean
  error: string | null
  mergedItemsState: Record<string, ProcedureItemState>
  refreshEnsure: () => Promise<void>
}

function mergeWithChecklist(
  stored: Record<string, ProcedureItemState>,
  checklistIds: string[],
): Record<string, ProcedureItemState> {
  const next: Record<string, ProcedureItemState> = {}
  for (const id of checklistIds) {
    const s = stored[id]
    next[id] = s ? { ...s, done: Boolean(s.done) } : { done: false }
  }
  return next
}

export function useProcedureRun(
  organizationId: string | undefined,
  userId: string | undefined,
  type: ProcedureType,
  dateKey: string,
): UseProcedureRunResult {
  const [run, setRun] = useState<ProcedureRun | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [ensureTick, setEnsureTick] = useState(0)

  const checklist = useMemo(() => checklistForType(type), [type])
  const checklistIds = useMemo(() => checklist.map((c) => c.id), [checklist])

  const refreshEnsure = useCallback(async () => {
    setEnsureTick((t) => t + 1)
  }, [])

  useEffect(() => {
    if (!organizationId || !userId) {
      setRun(null)
      setLoading(false)
      setError(null)
      return
    }

    let cancelled = false
    let unsub: (() => void) | undefined

    setLoading(true)
    setError(null)

    const initial = initialItemsState(checklist) as Record<string, ProcedureItemState>

    void (async () => {
      try {
        await ensureProcedureRun(organizationId, type, dateKey, userId, initial)
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Nu am putut inițializa procedura.')
          setLoading(false)
        }
        return
      }
      if (cancelled) return

      unsub = subscribeProcedureRun(
        organizationId,
        type,
        dateKey,
        (next) => {
          if (!cancelled) {
            setRun(next)
            setLoading(false)
          }
        },
        (err) => {
          if (!cancelled) {
            setError(err.message)
            setLoading(false)
          }
        },
      )
      if (cancelled) {
        unsub()
      }
    })()

    return () => {
      cancelled = true
      unsub?.()
    }
  }, [organizationId, userId, type, dateKey, ensureTick, checklist])

  const mergedItemsState = useMemo(() => {
    if (!run) return mergeWithChecklist({}, checklistIds)
    return mergeWithChecklist(run.itemsState, checklistIds)
  }, [run, checklistIds])

  return { run, loading, error, mergedItemsState, refreshEnsure }
}
