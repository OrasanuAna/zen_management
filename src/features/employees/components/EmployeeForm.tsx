import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'
import { useEffect, useState } from 'react'
import {
  EMPLOYEE_ROLE_OPTIONS,
  RESTAURANT_ZONE_OPTIONS,
} from '@/features/employees/constants/labels'
import {
  employeeFormSchema,
  type EmployeeFormValues,
} from '@/features/employees/validation/employeeSchemas'
import { createEmployee, updateEmployee } from '@/features/employees/services/employeesService'
import { EmployeeRole, RestaurantZone } from '@/shared/types/entities'
import { Alert } from '@/shared/components/ui/Alert'
import { Button } from '@/shared/components/ui/Button'
import { Card } from '@/shared/components/ui/Card'
import { Input } from '@/shared/components/ui/Input'
import { Select } from '@/shared/components/ui/Select'

const defaultCreateValues: EmployeeFormValues = {
  fullName: '',
  email: '',
  phone: '',
  role: EmployeeRole.WAITER,
  zone: RestaurantZone.DINING,
  isActive: true,
}

type EmployeeFormProps = {
  mode: 'create' | 'edit'
  employeeId?: string
  organizationId: string
  userId: string
  initialValues?: EmployeeFormValues
  onSuccess: () => void
  onCancel: () => void
}

export function EmployeeForm({
  mode,
  employeeId,
  organizationId,
  userId,
  initialValues,
  onSuccess,
  onCancel,
}: EmployeeFormProps) {
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeFormSchema),
    defaultValues: defaultCreateValues,
  })

  useEffect(() => {
    reset(initialValues ?? defaultCreateValues)
  }, [initialValues, reset])

  const [formError, setFormError] = useState<string | null>(null)

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null)
    const email = values.email.trim() || undefined
    const phone = values.phone.trim() || undefined
    try {
      if (mode === 'create') {
        await createEmployee({
          organizationId,
          fullName: values.fullName,
          email,
          phone,
          role: values.role,
          zone: values.zone,
          isActive: values.isActive,
          createdBy: userId,
        })
      } else if (employeeId) {
        await updateEmployee(employeeId, {
          fullName: values.fullName,
          email,
          phone,
          role: values.role,
          zone: values.zone,
          isActive: values.isActive,
        })
      }
      onSuccess()
    } catch {
      setFormError('Salvarea a eșuat. Verifică conexiunea și regulile Firestore pentru colecția employees.')
    }
  })

  return (
    <Card
      title={mode === 'create' ? 'Angajat nou' : 'Editare angajat'}
      subtitle="Completează datele operaționale"
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
          label="Nume complet"
          autoComplete="name"
          placeholder="ex. Ion Popescu"
          error={errors.fullName?.message}
          {...register('fullName')}
        />
        <Input
          label="E-mail (opțional)"
          type="email"
          autoComplete="email"
          placeholder="nume@exemplu.ro"
          error={errors.email?.message}
          {...register('email')}
        />
        <Input
          label="Telefon (opțional)"
          type="tel"
          autoComplete="tel"
          error={errors.phone?.message}
          {...register('phone')}
        />
        <Select
          label="Rol"
          options={EMPLOYEE_ROLE_OPTIONS}
          error={errors.role?.message}
          {...register('role')}
        />
        <Select
          label="Zonă restaurant"
          options={RESTAURANT_ZONE_OPTIONS}
          error={errors.zone?.message}
          {...register('zone')}
        />
        <div className="zs-checkbox-field">
          <Controller
            name="isActive"
            control={control}
            render={({ field }) => (
              <label className="zs-checkbox-label">
                <input
                  type="checkbox"
                  className="zs-checkbox"
                  checked={field.value}
                  onChange={(e) => field.onChange(e.target.checked)}
                  onBlur={field.onBlur}
                  ref={field.ref}
                />
                <span>Angajat activ (apare în liste și poate fi repartizat)</span>
              </label>
            )}
          />
        </div>
        <div className="zs-profile-form__actions">
          <Button type="submit" loading={isSubmitting}>
            {mode === 'create' ? 'Adaugă angajat' : 'Salvează modificările'}
          </Button>
        </div>
      </form>
    </Card>
  )
}
