import { format } from 'date-fns'
import { ro } from 'date-fns/locale'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from '@/app/providers/AuthProvider'
import { dateToKey } from '@/features/calendar/utils/dateKeys'
import { checklistForType } from '@/features/procedures/constants/checklists'
import { useProcedureRun } from '@/features/procedures/hooks/useProcedureRun'
import {
  setProcedureRunCompleted,
  updateProcedureObservations,
  updateProcedureRunItems,
} from '@/features/procedures/services/proceduresService'
import type { ProcedureItemState, ProcedureType } from '@/shared/types/entities'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import {
  IconCheckCircle,
  IconRefresh,
  IconSave,
  IconUnlock,
} from '@/shared/components/ui/ActionIcons'
import { Alert } from '@/shared/components/ui/Alert'
import { Button } from '@/shared/components/ui/Button'
import { Card } from '@/shared/components/ui/Card'
import { Input } from '@/shared/components/ui/Input'
import { Spinner } from '@/shared/components/ui/Spinner'
import { Textarea } from '@/shared/components/ui/Textarea'

type ProcedureRunScreenProps = {
  type: ProcedureType
  title: string
  description: string
}

export function ProcedureRunScreen({ type, title, description }: ProcedureRunScreenProps) {
  const { profile, firebaseUser } = useAuth()
  const orgId = profile?.organizationId
  const userId = firebaseUser?.uid

  const [dateKey, setDateKey] = useState(() => dateToKey(new Date()))
  const [observations, setObservations] = useState('')
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [finalizeError, setFinalizeError] = useState<string | null>(null)

  const { run, loading, error, mergedItemsState, refreshEnsure } = useProcedureRun(
    orgId,
    userId,
    type,
    dateKey,
  )

  const checklist = useMemo(() => checklistForType(type), [type])

  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({})
  const notesInitKey = useRef('')

  useEffect(() => {
    setObservations(run?.observations ?? '')
  }, [run?.observations, dateKey])

  useEffect(() => {
    notesInitKey.current = ''
  }, [dateKey, type])

  useEffect(() => {
    if (loading || !run) return
    const k = `${type}-${dateKey}`
    if (notesInitKey.current === k) return
    notesInitKey.current = k
    const next: Record<string, string> = {}
    for (const c of checklist) {
      next[c.id] = mergedItemsState[c.id]?.note ?? ''
    }
    setNoteDrafts(next)
  }, [loading, run, type, dateKey, checklist, mergedItemsState])

  const doneCount = useMemo(
    () => checklist.filter((c) => mergedItemsState[c.id]?.done).length,
    [checklist, mergedItemsState],
  )
  const total = checklist.length
  const allDone = total > 0 && doneCount === total
  const isCompleted = Boolean(run?.completedAt)

  const persistItems = useCallback(
    async (next: Record<string, ProcedureItemState>) => {
      if (!orgId) return
      setSaveError(null)
      setSaving(true)
      try {
        await updateProcedureRunItems(orgId, type, dateKey, next)
      } catch {
        setSaveError('Salvarea nu a reușit. Verifică conexiunea și regulile Firestore.')
      } finally {
        setSaving(false)
      }
    },
    [orgId, type, dateKey],
  )

  const toggleItem = (id: string) => {
    if (isCompleted) return
    const cur = mergedItemsState[id] ?? { done: false }
    const next = {
      ...mergedItemsState,
      [id]: { ...cur, done: !cur.done },
    }
    void persistItems(next)
  }

  const onNoteBlur = (id: string) => {
    if (isCompleted) return
    const note = noteDrafts[id] ?? ''
    const cur = mergedItemsState[id] ?? { done: false }
    const trimmed = note.trim()
    const prevNote = cur.note?.trim() ?? ''
    if (trimmed === prevNote) return
    const next = {
      ...mergedItemsState,
      [id]: {
        ...cur,
        note: trimmed || undefined,
      },
    }
    void persistItems(next)
  }

  const saveObservations = async () => {
    if (!orgId) return
    setSaveError(null)
    setSaving(true)
    try {
      await updateProcedureObservations(orgId, type, dateKey, observations.trim() || undefined)
    } catch {
      setSaveError('Salvarea observațiilor a eșuat.')
    } finally {
      setSaving(false)
    }
  }

  const finalize = async () => {
    if (!orgId) return
    setFinalizeError(null)
    setSaving(true)
    try {
      await updateProcedureObservations(orgId, type, dateKey, observations.trim() || undefined)
      await setProcedureRunCompleted(orgId, type, dateKey, true)
    } catch {
      setFinalizeError('Finalizarea a eșuat.')
    } finally {
      setSaving(false)
    }
  }

  const reopen = async () => {
    if (!orgId) return
    setFinalizeError(null)
    setSaving(true)
    try {
      await setProcedureRunCompleted(orgId, type, dateKey, false)
    } catch {
      setFinalizeError('Nu am putut redeschide procedura.')
    } finally {
      setSaving(false)
    }
  }

  if (!orgId || !userId) {
    return (
      <Alert variant="warning" title="Organizație necunoscută">
        Nu există <code>organizationId</code> sau sesiune activă.
      </Alert>
    )
  }

  const dateLabel = format(
    new Date(dateKey + 'T12:00:00'),
    'EEEE, d MMMM yyyy',
    { locale: ro },
  )

  return (
    <>
      <PageHeader title={title} description={description} />

      <div className="zs-proc-toolbar">
        <Input
          label="Ziua procedurii"
          type="date"
          value={dateKey}
          onChange={(e) => setDateKey(e.target.value)}
        />
        <p className="zs-muted zs-proc-toolbar__hint">{dateLabel}</p>
      </div>

      {error ? (
        <Alert variant="error" title="Nu am putut încărca procedura">
          {error}
        </Alert>
      ) : null}

      {saveError ? (
        <Alert variant="error" title="Eroare la salvare">
          {saveError}
        </Alert>
      ) : null}

      {finalizeError ? (
        <Alert variant="error" title="Eroare">
          {finalizeError}
        </Alert>
      ) : null}

      {loading ? (
        <div className="zs-employees-loading">
          <Spinner label="Se încarcă checklist-ul…" />
        </div>
      ) : (
        <>
          {isCompleted && run?.completedAt ? (
            <Alert variant="success" title="Procedură finalizată">
              Înregistrată la{' '}
              {format(run.completedAt.toDate(), 'd MMM yyyy, HH:mm', { locale: ro })}. Poți modifica din
              nou dacă este nevoie.
            </Alert>
          ) : null}

          {!allDone && !isCompleted ? (
            <Alert variant="warning" title="Checklist incomplet">
              {doneCount}/{total} puncte bifate. Poți finaliza oricum dacă situația o cere, dar ideal
              este să parcurgi toate punctele.
            </Alert>
          ) : null}

          <Card
            className="zs-proc-card"
            title="Checklist"
            subtitle={`${doneCount} / ${total} bifate`}
          >
            <ul className="zs-proc-list">
              {checklist.map((item) => {
                const st = mergedItemsState[item.id] ?? { done: false }
                return (
                  <li key={item.id} className="zs-proc-item">
                    <label className={`zs-proc-row ${isCompleted ? 'zs-proc-row--locked' : ''}`}>
                      <input
                        type="checkbox"
                        className="zs-proc-check"
                        checked={st.done}
                        disabled={isCompleted || saving}
                        onChange={() => toggleItem(item.id)}
                      />
                      <span className="zs-proc-label">{item.label}</span>
                    </label>
                    <Input
                      label="Notiță"
                      className="zs-proc-note"
                      value={noteDrafts[item.id] ?? ''}
                      disabled={isCompleted || saving}
                      onChange={(e) =>
                        setNoteDrafts((prev) => ({ ...prev, [item.id]: e.target.value }))
                      }
                      onBlur={() => onNoteBlur(item.id)}
                    />
                  </li>
                )
              })}
            </ul>
          </Card>

          <Card className="zs-proc-card" title="Observații generale" subtitle="Situații speciale, lipsuri, predare schimb">
            <Textarea
              label="Observații"
              rows={4}
              value={observations}
              disabled={isCompleted}
              onChange={(e) => setObservations(e.target.value)}
            />
            {!isCompleted ? (
              <div className="zs-proc-actions">
                <Button
                  type="button"
                  variant="secondary"
                  className="zs-button--icon-only"
                  loading={saving}
                  aria-label="Salvează observațiile"
                  title="Salvează observațiile"
                  onClick={() => void saveObservations()}
                >
                  <IconSave />
                </Button>
              </div>
            ) : null}
          </Card>

          <div className="zs-proc-footer-actions">
            {!isCompleted ? (
              <Button
                type="button"
                variant="primary"
                className="zs-button--icon-only"
                loading={saving}
                aria-label="Finalizează procedura"
                title="Finalizează procedura"
                onClick={() => void finalize()}
              >
                <IconCheckCircle />
              </Button>
            ) : (
              <Button
                type="button"
                variant="secondary"
                className="zs-button--icon-only"
                loading={saving}
                aria-label="Modifică din nou (revocă finalizarea)"
                title="Revocă finalizarea"
                onClick={() => void reopen()}
              >
                <IconUnlock />
              </Button>
            )}
            <Button
              type="button"
              variant="secondary"
              className="zs-button--icon-only"
              disabled={saving}
              aria-label="Reîncarcă din Firestore"
              title="Reîncarcă din Firestore"
              onClick={() => {
                notesInitKey.current = ''
                void refreshEnsure()
              }}
            >
              <IconRefresh />
            </Button>
          </div>
        </>
      )}
    </>
  )
}
