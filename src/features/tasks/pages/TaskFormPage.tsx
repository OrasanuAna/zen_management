import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { paths } from '@/app/router/paths'
import { useAuth } from '@/app/providers/AuthProvider'
import { useEmployees } from '@/features/employees/hooks/useEmployees'
import { TaskForm, taskToFormValues } from '@/features/tasks/components/TaskForm'
import { getTaskById } from '@/features/tasks/services/tasksService'
import type { Task } from '@/shared/types/entities'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { Alert } from '@/shared/components/ui/Alert'
import { Spinner } from '@/shared/components/ui/Spinner'

export function TaskFormPage() {
  const { taskId } = useParams<{ taskId?: string }>()
  const navigate = useNavigate()
  const { profile, firebaseUser } = useAuth()
  const isCreate = !taskId

  const orgId = profile?.organizationId
  const uid = firebaseUser?.uid
  const { employees } = useEmployees(orgId)

  const [task, setTask] = useState<Task | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [loading, setLoading] = useState(!isCreate)

  useEffect(() => {
    if (isCreate || !taskId || !orgId) {
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)
    setLoadError(null)

    void (async () => {
      try {
        const data = await getTaskById(taskId)
        if (cancelled) return
        if (!data) {
          setLoadError('Sarcina nu a fost găsită.')
          setTask(null)
        } else if (data.organizationId !== orgId) {
          setLoadError('Nu ai acces la această sarcină.')
          setTask(null)
        } else {
          setTask(data)
        }
      } catch {
        if (!cancelled) setLoadError('Nu am putut încărca datele.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [taskId, isCreate, orgId])

  const initialValues = useMemo(() => (task ? taskToFormValues(task) : undefined), [task])

  const goBack = () => {
    navigate(paths.tasks)
  }

  if (!orgId || !uid) {
    return (
      <Alert variant="warning" title="Profil incomplet">
        Nu putem determina organizația. Reîncarcă pagina sau completează profilul.
      </Alert>
    )
  }

  if (!isCreate && loading) {
    return (
      <div className="zs-route-loading">
        <Spinner label="Se încarcă sarcina…" />
      </div>
    )
  }

  if (!isCreate && loadError) {
    return (
      <>
        <PageHeader title="Sarcină" description={loadError} />
        <Alert variant="error" title="Eroare">
          {loadError}
        </Alert>
        <Link to={paths.tasks}>Înapoi la listă</Link>
      </>
    )
  }

  return (
    <>
      <PageHeader
        title={isCreate ? 'Sarcină nouă' : 'Editare sarcină'}
        description={
          isCreate
            ? 'Definește o activitate operațională cu termen și repartizare opțională.'
            : `Modifică: ${task?.title ?? 'sarcină'}.`
        }
      />
      <TaskForm
        mode={isCreate ? 'create' : 'edit'}
        taskId={taskId}
        organizationId={orgId}
        userId={uid}
        initialValues={initialValues}
        employees={employees}
        onSuccess={() => navigate(paths.tasks)}
        onCancel={goBack}
      />
    </>
  )
}
