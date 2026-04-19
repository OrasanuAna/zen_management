import { format } from 'date-fns'
import { ro } from 'date-fns/locale'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { paths, pathTaskEdit } from '@/app/router/paths'
import { useAuth } from '@/app/providers/AuthProvider'
import { useEmployees } from '@/features/employees/hooks/useEmployees'
import { TASK_STATUS_LABELS, TASK_TIME_FILTER_LABELS } from '@/features/tasks/constants/labels'
import { useTasks } from '@/features/tasks/hooks/useTasks'
import { deleteTask, setTaskCompleted } from '@/features/tasks/services/tasksService'
import { filterTasksByTime, type TaskTimeFilter } from '@/features/tasks/utils/taskFilters'
import type { Task } from '@/shared/types/entities'
import { TaskStatus } from '@/shared/types/entities'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import {
  IconCheckCircle,
  IconCircle,
  IconPencil,
  IconTrash,
} from '@/shared/components/ui/ActionIcons'
import { Alert } from '@/shared/components/ui/Alert'
import { Card } from '@/shared/components/ui/Card'
import { Modal } from '@/shared/components/ui/Modal'
import { Spinner } from '@/shared/components/ui/Spinner'

function formatDue(task: Task): string {
  if (!task.dueAt) return 'Fără termen'
  try {
    return format(task.dueAt.toDate(), 'd MMM yyyy, HH:mm', { locale: ro })
  } catch {
    return '—'
  }
}

const TIME_FILTERS: TaskTimeFilter[] = ['all', 'past', 'today', 'future', 'nodue']

export function TasksPage() {
  const { profile } = useAuth()
  const orgId = profile?.organizationId
  const { tasks, loading, error } = useTasks(orgId)
  const { employees } = useEmployees(orgId)

  const [timeFilter, setTimeFilter] = useState<TaskTimeFilter>('all')
  const [deleteTarget, setDeleteTarget] = useState<Task | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [toggleId, setToggleId] = useState<string | null>(null)

  const nameById = useMemo(() => {
    const m = new Map<string, string>()
    for (const e of employees) {
      m.set(e.id, e.fullName)
    }
    return m
  }, [employees])

  const filtered = useMemo(() => filterTasksByTime(tasks, timeFilter), [tasks, timeFilter])

  const handleToggleComplete = async (task: Task) => {
    if (task.status === TaskStatus.CANCELLED) return
    setToggleId(task.id)
    try {
      const next = task.status !== TaskStatus.COMPLETED
      await setTaskCompleted(task.id, next)
    } catch {
      /* snapshot va reveni sau utilizatorul reîncearcă */
    } finally {
      setToggleId(null)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleteError(null)
    setDeleteLoading(true)
    try {
      await deleteTask(deleteTarget.id)
      setDeleteTarget(null)
    } catch {
      setDeleteError('Ștergerea a eșuat. Verifică regulile Firestore.')
    } finally {
      setDeleteLoading(false)
    }
  }

  if (!orgId) {
    return (
      <Alert variant="warning" title="Organizație necunoscută">
        Lipsește <code>organizationId</code> din profil.
      </Alert>
    )
  }

  return (
    <>
      <PageHeader
        title="Sarcini"
        description="Activități operaționale — termene, status și repartizare."
        actions={
          <Link to={paths.tasksNew} className="zs-button">
            Adaugă sarcină
          </Link>
        }
      />

      <div className="zs-task-filters" role="tablist" aria-label="Filtru temporal">
        {TIME_FILTERS.map((key) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={timeFilter === key}
            className={`zs-filter-pill ${timeFilter === key ? 'zs-filter-pill--active' : ''}`}
            onClick={() => setTimeFilter(key)}
          >
            {TASK_TIME_FILTER_LABELS[key]}
          </button>
        ))}
      </div>

      {error ? (
        <Alert variant="error" title="Nu am putut încărca sarcinile">
          {error}
        </Alert>
      ) : null}

      {loading ? (
        <div className="zs-employees-loading">
          <Spinner label="Se încarcă sarcinile…" />
        </div>
      ) : filtered.length === 0 ? (
        <Card title="Nicio sarcină" subtitle="Nu există elemente pentru filtrul selectat.">
          <p className="zs-muted">Schimbă filtrul sau adaugă o sarcină nouă.</p>
          <Link to={paths.tasksNew} className="zs-button">
            Adaugă sarcină
          </Link>
        </Card>
      ) : (
        <>
          <div className="zs-table-wrap" role="region" aria-label="Listă sarcini">
            <table className="zs-table">
              <thead>
                <tr>
                  <th>Sarcină</th>
                  <th>Termen</th>
                  <th>Repartizat</th>
                  <th>Status</th>
                  <th className="zs-table__actions">Acțiuni</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((t) => (
                  <tr key={t.id}>
                    <td>
                      <div className="zs-table__strong">{t.title}</div>
                      {t.description ? (
                        <div className="zs-task-desc zs-muted">{t.description}</div>
                      ) : null}
                    </td>
                    <td className="zs-table__muted">{formatDue(t)}</td>
                    <td className="zs-table__muted">
                      {t.assignedToEmployeeId
                        ? (nameById.get(t.assignedToEmployeeId) ?? '—')
                        : '—'}
                    </td>
                    <td>
                      <span
                        className={
                          t.status === TaskStatus.COMPLETED
                            ? 'zs-badge zs-badge--success'
                            : t.status === TaskStatus.CANCELLED
                              ? 'zs-badge zs-badge--muted'
                              : 'zs-badge zs-badge--pending'
                        }
                      >
                        {TASK_STATUS_LABELS[t.status]}
                      </span>
                    </td>
                    <td className="zs-table__actions">
                      <div className="zs-icon-action-row zs-table__action-row--tasks">
                        {t.status !== TaskStatus.CANCELLED ? (
                          <button
                            type="button"
                            className={`zs-icon-action ${t.status === TaskStatus.COMPLETED ? 'zs-icon-action--muted' : 'zs-icon-action--success'}`}
                            disabled={toggleId === t.id}
                            aria-label={
                              t.status === TaskStatus.COMPLETED
                                ? 'Marchează nefinalizată'
                                : 'Marchează finalizată'
                            }
                            title={
                              t.status === TaskStatus.COMPLETED
                                ? 'Marchează nefinalizată'
                                : 'Marchează finalizată'
                            }
                            onClick={() => void handleToggleComplete(t)}
                          >
                            {t.status === TaskStatus.COMPLETED ? <IconCircle /> : <IconCheckCircle />}
                          </button>
                        ) : null}
                        <Link
                          className="zs-icon-action"
                          to={pathTaskEdit(t.id)}
                          aria-label={`Editează sarcina: ${t.title}`}
                          title="Editează"
                        >
                          <IconPencil />
                        </Link>
                        <button
                          type="button"
                          className="zs-icon-action zs-icon-action--danger"
                          aria-label={`Șterge sarcina: ${t.title}`}
                          title="Șterge"
                          onClick={() => {
                            setDeleteError(null)
                            setDeleteTarget(t)
                          }}
                        >
                          <IconTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ul className="zs-task-cards" aria-label="Listă sarcini (mobil)">
            {filtered.map((t) => (
              <li key={t.id} className="zs-task-card">
                <div className="zs-task-card__head">
                  <strong>{t.title}</strong>
                  <span
                    className={
                      t.status === TaskStatus.COMPLETED
                        ? 'zs-badge zs-badge--success'
                        : t.status === TaskStatus.CANCELLED
                          ? 'zs-badge zs-badge--muted'
                          : 'zs-badge zs-badge--pending'
                    }
                  >
                    {TASK_STATUS_LABELS[t.status]}
                  </span>
                </div>
                {t.description ? <p className="zs-task-card__desc zs-muted">{t.description}</p> : null}
                <p className="zs-task-card__meta">
                  {formatDue(t)}
                  {t.assignedToEmployeeId ? (
                    <>
                      {' · '}
                      {nameById.get(t.assignedToEmployeeId) ?? '—'}
                    </>
                  ) : null}
                </p>
                <div className="zs-task-card__actions zs-icon-action-row">
                  {t.status !== TaskStatus.CANCELLED ? (
                    <button
                      type="button"
                      className={`zs-icon-action ${t.status === TaskStatus.COMPLETED ? 'zs-icon-action--muted' : 'zs-icon-action--success'}`}
                      disabled={toggleId === t.id}
                      aria-label={
                        t.status === TaskStatus.COMPLETED
                          ? 'Marchează nefinalizată'
                          : 'Marchează finalizată'
                      }
                      title={
                        t.status === TaskStatus.COMPLETED
                          ? 'Marchează nefinalizată'
                          : 'Marchează finalizată'
                      }
                      onClick={() => void handleToggleComplete(t)}
                    >
                      {t.status === TaskStatus.COMPLETED ? <IconCircle /> : <IconCheckCircle />}
                    </button>
                  ) : null}
                  <Link
                    className="zs-icon-action"
                    to={pathTaskEdit(t.id)}
                    aria-label={`Editează: ${t.title}`}
                    title="Editează"
                  >
                    <IconPencil />
                  </Link>
                  <button
                    type="button"
                    className="zs-icon-action zs-icon-action--danger"
                    aria-label={`Șterge: ${t.title}`}
                    title="Șterge"
                    onClick={() => {
                      setDeleteError(null)
                      setDeleteTarget(t)
                    }}
                  >
                    <IconTrash />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}

      <Modal
        open={Boolean(deleteTarget)}
        title="Ștergere sarcină"
        confirmLabel="Șterge definitiv"
        cancelLabel="Anulează"
        variant="danger"
        loading={deleteLoading}
        onClose={() => !deleteLoading && setDeleteTarget(null)}
        onConfirm={() => void handleDelete()}
      >
        <p>
          Sigur vrei să ștergi sarcina <strong>{deleteTarget?.title}</strong>?
        </p>
        {deleteError ? (
          <p className="zs-error zs-modal-error" role="alert">
            {deleteError}
          </p>
        ) : null}
      </Modal>
    </>
  )
}
