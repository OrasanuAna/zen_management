import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { TASK_STATUS_OPTIONS } from '@/features/tasks/constants/labels'
import {
  createTask,
  updateTask,
} from '@/features/tasks/services/tasksService'
import {
  parseDatetimeLocalToTimestamp,
  timestampToDatetimeLocal,
} from '@/features/tasks/utils/taskDates'
import { taskFormSchema, type TaskFormValues } from '@/features/tasks/validation/taskSchemas'
import type { Employee, Task } from '@/shared/types/entities'
import { TaskStatus } from '@/shared/types/entities'
import { Alert } from '@/shared/components/ui/Alert'
import { Button } from '@/shared/components/ui/Button'
import { Card } from '@/shared/components/ui/Card'
import { Input } from '@/shared/components/ui/Input'
import { Select } from '@/shared/components/ui/Select'
import { Textarea } from '@/shared/components/ui/Textarea'

const defaultCreateValues: TaskFormValues = {
  title: '',
  description: '',
  dueAt: '',
  assignedToEmployeeId: '',
  status: TaskStatus.PENDING,
}

type TaskFormProps = {
  mode: 'create' | 'edit'
  taskId?: string
  organizationId: string
  userId: string
  initialValues?: TaskFormValues
  employees: Employee[]
  onSuccess: () => void
  onCancel: () => void
}

export function TaskForm({
  mode,
  taskId,
  organizationId,
  userId,
  initialValues,
  employees,
  onSuccess,
  onCancel,
}: TaskFormProps) {
  const [formError, setFormError] = useState<string | null>(null)

  const assigneeOptions = useMemo(() => {
    const active = employees.filter((e) => e.isActive)
    return [
      { value: '', label: '— Niciun angajat repartizat —' },
      ...active.map((e) => ({ value: e.id, label: e.fullName })),
    ]
  }, [employees])

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: defaultCreateValues,
  })

  useEffect(() => {
    reset(initialValues ?? defaultCreateValues)
  }, [initialValues, reset])

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null)
    const dueAt = parseDatetimeLocalToTimestamp(values.dueAt)
    const description = values.description?.trim() || undefined
    const assign = values.assignedToEmployeeId?.trim() || undefined
    try {
      if (mode === 'create') {
        await createTask({
          organizationId,
          title: values.title,
          description,
          dueAt,
          assignedToEmployeeId: assign,
          createdBy: userId,
        })
      } else if (taskId) {
        await updateTask(taskId, {
          title: values.title,
          description,
          dueAt,
          status: values.status,
          assignedToEmployeeId: assign,
        })
      }
      onSuccess()
    } catch {
      setFormError('Salvarea a eșuat. Verifică regulile Firestore pentru colecția tasks.')
    }
  })

  return (
    <Card
      title={mode === 'create' ? 'Sarcină nouă' : 'Editare sarcină'}
      subtitle="Titlu, termen, repartizare și status"
      actions={
        <Button type="button" variant="ghost" onClick={onCancel}>
          Renunță
        </Button>
      }
    >
      {formError ? (
        <Alert variant="error" title="Eroare">
          {formError}
        </Alert>
      ) : null}

      <form className="zs-stack zs-stack--md" onSubmit={onSubmit} noValidate>
        <Input
          label="Titlu"
          placeholder="ex. Verificare stoc bar"
          error={errors.title?.message}
          {...register('title')}
        />
        <Textarea
          label="Descriere (opțional)"
          placeholder="Detalii pentru echipă…"
          error={errors.description?.message}
          {...register('description')}
        />
        <Input
          label="Termen limită (opțional)"
          type="datetime-local"
          hint="Lasă gol dacă nu există un termen fix."
          error={errors.dueAt?.message}
          {...register('dueAt')}
        />
        <Select
          label="Repartizat la"
          options={assigneeOptions}
          error={errors.assignedToEmployeeId?.message}
          {...register('assignedToEmployeeId')}
        />
        {mode === 'edit' ? (
          <Select
            label="Status"
            options={TASK_STATUS_OPTIONS}
            error={errors.status?.message}
            {...register('status')}
          />
        ) : (
          <input type="hidden" {...register('status')} />
        )}
        <div className="zs-profile-form__actions">
          <Button type="submit" loading={isSubmitting}>
            {mode === 'create' ? 'Adaugă sarcina' : 'Salvează modificările'}
          </Button>
        </div>
      </form>
    </Card>
  )
}

export function taskToFormValues(task: Task): TaskFormValues {
  return {
    title: task.title,
    description: task.description ?? '',
    dueAt: timestampToDatetimeLocal(task.dueAt),
    assignedToEmployeeId: task.assignedToEmployeeId ?? '',
    status: task.status,
  }
}
