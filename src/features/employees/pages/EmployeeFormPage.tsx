import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { paths } from '@/app/router/paths'
import { useAuth } from '@/app/providers/AuthProvider'
import { EmployeeForm } from '@/features/employees/components/EmployeeForm'
import { getEmployeeById } from '@/features/employees/services/employeesService'
import type { EmployeeFormValues } from '@/features/employees/validation/employeeSchemas'
import type { Employee } from '@/shared/types/entities'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { Alert } from '@/shared/components/ui/Alert'
import { Spinner } from '@/shared/components/ui/Spinner'

function employeeToFormValues(e: Employee): EmployeeFormValues {
  return {
    fullName: e.fullName,
    email: e.email ?? '',
    phone: e.phone ?? '',
    role: e.role,
    zone: e.zone,
    isActive: e.isActive,
  }
}

export function EmployeeFormPage() {
  const { employeeId } = useParams<{ employeeId?: string }>()
  const navigate = useNavigate()
  const { profile, firebaseUser } = useAuth()
  const isCreate = !employeeId

  const [employee, setEmployee] = useState<Employee | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [loading, setLoading] = useState(!isCreate)

  const orgId = profile?.organizationId
  const uid = firebaseUser?.uid

  useEffect(() => {
    if (isCreate || !employeeId || !orgId) {
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)
    setLoadError(null)

    void (async () => {
      try {
        const data = await getEmployeeById(employeeId)
        if (cancelled) return
        if (!data) {
          setLoadError('Angajatul nu a fost găsit.')
          setEmployee(null)
        } else if (data.organizationId !== orgId) {
          setLoadError('Nu ai acces la acest angajat.')
          setEmployee(null)
        } else {
          setEmployee(data)
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
  }, [employeeId, isCreate, orgId])

  const initialValues = useMemo(() => (employee ? employeeToFormValues(employee) : undefined), [employee])

  const goBack = () => {
    navigate(paths.employees)
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
        <Spinner label="Se încarcă angajatul…" />
      </div>
    )
  }

  if (!isCreate && loadError) {
    return (
      <>
        <PageHeader title="Angajat" description={loadError} />
        <Alert variant="error" title="Eroare">
          {loadError}
        </Alert>
        <Link to={paths.employees}>Înapoi la listă</Link>
      </>
    )
  }

  return (
    <>
      <PageHeader
        title={isCreate ? 'Angajat nou' : 'Editare angajat'}
        description={
          isCreate
            ? 'Adaugă un membru al echipei pentru planificare și rapoarte.'
            : `Modifică datele pentru ${employee?.fullName ?? 'angajat'}.`
        }
      />
      <EmployeeForm
        mode={isCreate ? 'create' : 'edit'}
        employeeId={employeeId}
        organizationId={orgId}
        userId={uid}
        initialValues={initialValues}
        onSuccess={() => navigate(paths.employees)}
        onCancel={goBack}
      />
    </>
  )
}
