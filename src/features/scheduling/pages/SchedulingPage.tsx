import { addWeeks, endOfWeek, format, startOfWeek, subWeeks } from 'date-fns'
import { ro } from 'date-fns/locale'
import { useCallback, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { paths } from '@/app/router/paths'
import { useAuth } from '@/app/providers/AuthProvider'
import { useEmployees } from '@/features/employees/hooks/useEmployees'
import { SchedulingWeekGrid } from '@/features/scheduling/components/SchedulingWeekGrid'
import { ShiftFormDialog } from '@/features/scheduling/components/ShiftFormDialog'
import { useShifts } from '@/features/scheduling/hooks/useShifts'
import { deleteShift } from '@/features/scheduling/services/shiftsService'
import { shiftsForWeek } from '@/features/scheduling/utils/shiftBuckets'
import type { Shift } from '@/shared/types/entities'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { Alert } from '@/shared/components/ui/Alert'
import { Modal } from '@/shared/components/ui/Modal'
import { Spinner } from '@/shared/components/ui/Spinner'

function weekLabel(cursor: Date): string {
  const start = startOfWeek(cursor, { weekStartsOn: 1 })
  const end = endOfWeek(cursor, { weekStartsOn: 1 })
  return `${format(start, 'd MMM', { locale: ro })} – ${format(end, 'd MMM yyyy', { locale: ro })}`
}

export function SchedulingPage() {
  const { profile, firebaseUser } = useAuth()
  const orgId = profile?.organizationId
  const userId = firebaseUser?.uid ?? ''
  const { employees, loading: employeesLoading, error: employeesError } = useEmployees(orgId)
  const { shifts, loading: shiftsLoading, error: shiftsError } = useShifts(orgId)

  const [cursor, setCursor] = useState(() => new Date())
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create')
  const [dialogDay, setDialogDay] = useState(() => new Date())
  const [editingShift, setEditingShift] = useState<Shift | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Shift | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const weekShifts = useMemo(() => shiftsForWeek(shifts, cursor), [shifts, cursor])

  const employeeNameById = useMemo(() => {
    const m: Record<string, string> = {}
    for (const e of employees) {
      m[e.id] = e.fullName
    }
    return m
  }, [employees])

  const openCreate = useCallback((day: Date) => {
    setDialogMode('create')
    setEditingShift(null)
    setDialogDay(day)
    setDialogOpen(true)
  }, [])

  const openEdit = useCallback((shift: Shift) => {
    setDialogMode('edit')
    setEditingShift(shift)
    setDialogDay(shift.startAt?.toDate() ?? new Date())
    setDialogOpen(true)
  }, [])

  const loading = employeesLoading || shiftsLoading
  const error = employeesError ?? shiftsError

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleteError(null)
    setDeleteLoading(true)
    try {
      await deleteShift(deleteTarget.id)
      setDeleteTarget(null)
    } catch {
      setDeleteError('Ștergerea a eșuat. Verifică regulile Firestore.')
    } finally {
      setDeleteLoading(false)
    }
  }

  if (!orgId || !userId) {
    return (
      <Alert variant="warning" title="Organizație necunoscută">
        Nu există <code>organizationId</code> sau sesiune activă. Reautentifică-te sau completează profilul.
      </Alert>
    )
  }

  const period = weekLabel(cursor)

  return (
    <>
      <PageHeader
        title="Program / schimburi"
        description="Planificare săptămânală — început și sfârșit, zonă opțională, legat de angajați."
      />

      {error ? (
        <Alert variant="error" title="Nu am putut încărca datele">
          {error}
        </Alert>
      ) : null}

      <div className="zs-schedule-toolbar">
        <div className="zs-schedule-toolbar__nav">
          <button
            type="button"
            className="zs-icon-button"
            aria-label="Săptămâna anterioară"
            onClick={() => setCursor((c) => subWeeks(c, 1))}
          >
            ‹
          </button>
          <h2 className="zs-schedule-toolbar__title">{period}</h2>
          <button
            type="button"
            className="zs-icon-button"
            aria-label="Săptămâna următoare"
            onClick={() => setCursor((c) => addWeeks(c, 1))}
          >
            ›
          </button>
          <button type="button" className="zs-schedule-toolbar__today" onClick={() => setCursor(new Date())}>
            Săptămâna curentă
          </button>
        </div>
      </div>

      {loading ? (
        <div className="zs-employees-loading">
          <Spinner label="Se încarcă programul…" />
        </div>
      ) : (
        <SchedulingWeekGrid
          cursor={cursor}
          shifts={weekShifts}
          employeeNameById={employeeNameById}
          onAddShift={openCreate}
          onEditShift={openEdit}
          onDeleteShift={(s) => {
            setDeleteError(null)
            setDeleteTarget(s)
          }}
        />
      )}

      <p className="zs-muted zs-schedule-hint">
        <Link to={paths.calendar}>Calendarul</Link> arată sarcinile cu termen; schimburile rămân gestionate aici.
      </p>

      <ShiftFormDialog
        open={dialogOpen}
        mode={dialogMode}
        shift={editingShift}
        initialDay={dialogDay}
        employees={employees}
        organizationId={orgId}
        userId={userId}
        onClose={() => setDialogOpen(false)}
        onSaved={() => {}}
      />

      <Modal
        open={Boolean(deleteTarget)}
        title="Ștergere schimb"
        confirmLabel="Șterge"
        cancelLabel="Anulează"
        variant="danger"
        loading={deleteLoading}
        onClose={() => !deleteLoading && setDeleteTarget(null)}
        onConfirm={() => void handleDelete()}
      >
        <p>Sigur vrei să ștergi acest schimb? Acțiunea nu poate fi anulată.</p>
        {deleteError ? (
          <p className="zs-error zs-modal-error" role="alert">
            {deleteError}
          </p>
        ) : null}
      </Modal>
    </>
  )
}
