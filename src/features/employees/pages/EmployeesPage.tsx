import { useState } from 'react'
import { Link } from 'react-router-dom'
import { paths, pathEmployeeEdit } from '@/app/router/paths'
import { useAuth } from '@/app/providers/AuthProvider'
import {
  EMPLOYEE_ROLE_LABELS,
  RESTAURANT_ZONE_LABELS,
} from '@/features/employees/constants/labels'
import { useEmployees } from '@/features/employees/hooks/useEmployees'
import { deleteEmployee } from '@/features/employees/services/employeesService'
import type { Employee } from '@/shared/types/entities'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { IconPencil, IconTrash } from '@/shared/components/ui/ActionIcons'
import { Alert } from '@/shared/components/ui/Alert'
import { Card } from '@/shared/components/ui/Card'
import { Modal } from '@/shared/components/ui/Modal'
import { Spinner } from '@/shared/components/ui/Spinner'

export function EmployeesPage() {
  const { profile } = useAuth()
  const orgId = profile?.organizationId
  const { employees, loading, error } = useEmployees(orgId)

  const [deleteTarget, setDeleteTarget] = useState<Employee | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleteError(null)
    setDeleteLoading(true)
    try {
      await deleteEmployee(deleteTarget.id)
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
        Nu există <code>organizationId</code> în profil. Completează profilul sau contactează
        administratorul.
      </Alert>
    )
  }

  return (
    <>
      <PageHeader
        title="Angajați"
        description="Echipa operațională — roluri, zone și status."
        actions={
          <Link to={paths.employeesNew} className="zs-button">
            Adaugă angajat
          </Link>
        }
      />

      {error ? (
        <Alert variant="error" title="Nu am putut încărca lista">
          {error}
        </Alert>
      ) : null}

      {loading ? (
        <div className="zs-employees-loading">
          <Spinner label="Se încarcă angajații…" />
        </div>
      ) : employees.length === 0 ? (
        <Card title="Niciun angajat" subtitle="Începe prin a adăuga primul membru al echipei">
          <p className="zs-muted">Lista se actualizează automat din Firestore.</p>
          <Link to={paths.employeesNew} className="zs-button">
            Adaugă primul angajat
          </Link>
        </Card>
      ) : (
        <>
          <div className="zs-table-wrap" role="region" aria-label="Listă angajați">
            <table className="zs-table">
              <thead>
                <tr>
                  <th>Nume</th>
                  <th>Rol</th>
                  <th>Zonă</th>
                  <th>Contact</th>
                  <th>Status</th>
                  <th className="zs-table__actions">Acțiuni</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((e) => (
                  <tr key={e.id}>
                    <td className="zs-table__strong">{e.fullName}</td>
                    <td>{EMPLOYEE_ROLE_LABELS[e.role]}</td>
                    <td>{RESTAURANT_ZONE_LABELS[e.zone]}</td>
                    <td className="zs-table__muted">
                      {[e.email, e.phone].filter(Boolean).join(' · ') || '—'}
                    </td>
                    <td>
                      <span className={e.isActive ? 'zs-badge zs-badge--success' : 'zs-badge zs-badge--muted'}>
                        {e.isActive ? 'Activ' : 'Inactiv'}
                      </span>
                    </td>
                    <td className="zs-table__actions">
                      <div className="zs-icon-action-row zs-table__action-row">
                        <Link
                          className="zs-icon-action"
                          to={pathEmployeeEdit(e.id)}
                          aria-label={`Editează angajatul ${e.fullName}`}
                          title="Editează"
                        >
                          <IconPencil />
                        </Link>
                        <button
                          type="button"
                          className="zs-icon-action zs-icon-action--danger"
                          aria-label={`Șterge angajatul ${e.fullName}`}
                          title="Șterge"
                          onClick={() => {
                            setDeleteError(null)
                            setDeleteTarget(e)
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

          <ul className="zs-employee-cards" aria-label="Listă angajați (mobil)">
            {employees.map((e) => (
              <li key={e.id} className="zs-employee-card">
                <div className="zs-employee-card__head">
                  <strong>{e.fullName}</strong>
                  <span className={e.isActive ? 'zs-badge zs-badge--success' : 'zs-badge zs-badge--muted'}>
                    {e.isActive ? 'Activ' : 'Inactiv'}
                  </span>
                </div>
                <p className="zs-employee-card__meta">
                  {EMPLOYEE_ROLE_LABELS[e.role]} · {RESTAURANT_ZONE_LABELS[e.zone]}
                </p>
                <p className="zs-employee-card__contact zs-muted">
                  {[e.email, e.phone].filter(Boolean).join(' · ') || 'Fără contact'}
                </p>
                <div className="zs-employee-card__actions zs-icon-action-row">
                  <Link
                    className="zs-icon-action"
                    to={pathEmployeeEdit(e.id)}
                    aria-label={`Editează: ${e.fullName}`}
                    title="Editează"
                  >
                    <IconPencil />
                  </Link>
                  <button
                    type="button"
                    className="zs-icon-action zs-icon-action--danger"
                    aria-label={`Șterge: ${e.fullName}`}
                    title="Șterge"
                    onClick={() => {
                      setDeleteError(null)
                      setDeleteTarget(e)
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
        title="Ștergere angajat"
        confirmLabel="Șterge definitiv"
        cancelLabel="Anulează"
        variant="danger"
        loading={deleteLoading}
        onClose={() => !deleteLoading && setDeleteTarget(null)}
        onConfirm={() => void handleDelete()}
      >
        <p>
          Sigur vrei să ștergi pe <strong>{deleteTarget?.fullName}</strong>? Acțiunea nu poate fi anulată.
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
