import { format } from 'date-fns'
import { ro } from 'date-fns/locale'
import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { paths, pathTaskEdit } from '@/app/router/paths'
import { useAuth } from '@/app/providers/AuthProvider'
import { useEmployees } from '@/features/employees/hooks/useEmployees'
import {
  procedureStatusForDateKey,
  recentTasksByActivity,
  shiftsStartingFromToday,
  tasksDueTodayList,
  tasksDueTodayStats,
  todayDateKey,
} from '@/features/dashboard/utils/dashboardMetrics'
import { useProcedureRunsList } from '@/features/procedures/hooks/useProcedureRunsList'
import { useShifts } from '@/features/scheduling/hooks/useShifts'
import { useTasks } from '@/features/tasks/hooks/useTasks'
import { TASK_STATUS_LABELS } from '@/features/tasks/constants/labels'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { Alert } from '@/shared/components/ui/Alert'
import { Card } from '@/shared/components/ui/Card'
import { Spinner } from '@/shared/components/ui/Spinner'

function formatTaskDueLabel(task: { dueAt: { toDate: () => Date } | null }): string {
  if (!task.dueAt) return 'Fără termen'
  try {
    return format(task.dueAt.toDate(), 'HH:mm', { locale: ro })
  } catch {
    return '—'
  }
}

export function DashboardPage() {
  const { profile } = useAuth()
  const orgId = profile?.organizationId

  const { tasks, loading: tasksLoading, error: tasksError } = useTasks(orgId)
  const { employees, loading: empLoading, error: empError } = useEmployees(orgId)
  const { shifts, loading: shiftsLoading, error: shiftsError } = useShifts(orgId)
  const { runs, loading: runsLoading, error: runsError } = useProcedureRunsList(orgId)

  const todayStats = useMemo(() => tasksDueTodayStats(tasks), [tasks])
  const agendaTasks = useMemo(() => tasksDueTodayList(tasks).slice(0, 8), [tasks])
  const recentTasks = useMemo(() => recentTasksByActivity(tasks, 6), [tasks])
  const todayShifts = useMemo(() => shiftsStartingFromToday(shifts, 5), [shifts])
  const procToday = useMemo(
    () => procedureStatusForDateKey(runs, todayDateKey()),
    [runs],
  )

  const activeEmployees = useMemo(() => employees.filter((e) => e.isActive).length, [employees])

  const nameById = useMemo(() => new Map(employees.map((e) => [e.id, e.fullName])), [employees])

  const loading = tasksLoading || empLoading || shiftsLoading || runsLoading
  const error = tasksError ?? empError ?? shiftsError ?? runsError

  return (
    <>
      <PageHeader
        title="Panou de control"
        description="Rezumat pentru ziua curentă — sarcini, echipă, program și proceduri."
        actions={
          <Link to={paths.tasks} className="zs-button zs-button--secondary">
            Toate sarcinile
          </Link>
        }
      />

      {!profile ? (
        <Alert variant="warning" title="Profil indisponibil">
          <p>
            Autentificarea funcționează, dar profilul din Firestore nu a putut fi încărcat. Verifică
            regulile pentru colecția <code>users</code>.
          </p>
        </Alert>
      ) : null}

      {!orgId ? (
        <Alert variant="warning" title="Organizație necunoscută">
          Lipsește <code>organizationId</code> din profil.
        </Alert>
      ) : null}

      {error ? (
        <Alert variant="error" title="Nu am putut încărca toate datele">
          {error}
        </Alert>
      ) : null}

      {loading ? (
        <div className="zs-dashboard-loading">
          <Spinner label="Se încarcă panoul de control…" />
        </div>
      ) : (
        <>
          <div className="zs-kpi-grid">
            <Card title="Sarcini cu termen astăzi" subtitle="în așteptare / finalizate">
              <p className="zs-kpi__value">
                {todayStats.total === 0
                  ? '0'
                  : `${todayStats.pending} / ${todayStats.completed}`}
              </p>
              <p className="zs-muted zs-dashboard-kpi-hint">
                {todayStats.total === 0
                  ? 'Nicio sarcină cu termen azi.'
                  : `${todayStats.pending} în așteptare · ${todayStats.completed} finalizate${
                      todayStats.cancelled > 0 ? ` · ${todayStats.cancelled} anulate` : ''
                    }`}
              </p>
            </Card>
            <Card title="Angajați" subtitle="activi din total">
              <p className="zs-kpi__value">
                {employees.length === 0 ? '0' : `${activeEmployees} / ${employees.length}`}
              </p>
              <p className="zs-muted zs-dashboard-kpi-hint">
                {employees.length === 0
                  ? 'Adaugă angajați în modulul Angajați.'
                  : `${activeEmployees} activi · ${employees.length - activeEmployees} inactivi`}
              </p>
            </Card>
            <Card title="Proceduri azi" subtitle="deschidere · închidere">
              <p className="zs-kpi__value">
                {(() => {
                  const exp =
                    (procToday.hasOpening ? 1 : 0) + (procToday.hasClosing ? 1 : 0)
                  if (exp === 0) return '—'
                  const done =
                    (procToday.openingDone ? 1 : 0) + (procToday.closingDone ? 1 : 0)
                  return `${done}/${exp}`
                })()}
              </p>
              <p className="zs-muted zs-dashboard-kpi-hint">
                <span className="zs-dashboard-proc-pill">
                  Deschidere: {procToday.hasOpening ? (procToday.openingDone ? 'finalizată' : 'în curs') : 'neîncepută'}
                </span>
                <span className="zs-dashboard-proc-pill">
                  Închidere: {procToday.hasClosing ? (procToday.closingDone ? 'finalizată' : 'în curs') : 'neîncepută'}
                </span>
              </p>
            </Card>
          </div>

          <div className="zs-stack zs-stack--lg">
            <Card title="Agenda zilei" subtitle="Sarcini cu termen astăzi">
              {agendaTasks.length === 0 ? (
                <p className="zs-muted">Nicio sarcină cu termen pentru astăzi.</p>
              ) : (
                <ul className="zs-dashboard-list">
                  {agendaTasks.map((t) => (
                    <li key={t.id} className="zs-dashboard-list__item">
                      <div className="zs-dashboard-list__main">
                        <p className="zs-dashboard-list__title">
                          <Link to={pathTaskEdit(t.id)} className="zs-link">
                            {t.title}
                          </Link>
                        </p>
                        <p className="zs-dashboard-list__meta">
                          {TASK_STATUS_LABELS[t.status]}
                          {t.assignedToEmployeeId
                            ? ` · ${nameById.get(t.assignedToEmployeeId) ?? '—'}`
                            : ''}
                        </p>
                      </div>
                      <span className="zs-dashboard-list__side">{formatTaskDueLabel(t)}</span>
                    </li>
                  ))}
                </ul>
              )}
              <div className="zs-dashboard-links">
                <Link to={paths.tasks}>Deschide modulul Sarcini</Link>
                <Link to={paths.tasksNew}>Sarcină nouă</Link>
              </div>
            </Card>

            <Card title="Activitate recentă" subtitle="Ultimele actualizări și schimburi">
              {recentTasks.length === 0 && todayShifts.length === 0 ? (
                <p className="zs-muted">Încă nu există suficientă activitate în date.</p>
              ) : (
                <>
                  {recentTasks.length > 0 ? (
                    <>
                      <p className="zs-dashboard-section-label">Sarcini (recent actualizate)</p>
                      <ul className="zs-dashboard-list">
                        {recentTasks.map((t) => (
                          <li key={t.id} className="zs-dashboard-list__item">
                            <div className="zs-dashboard-list__main">
                              <p className="zs-dashboard-list__title">
                                <Link to={pathTaskEdit(t.id)} className="zs-link">
                                  {t.title}
                                </Link>
                              </p>
                              <p className="zs-dashboard-list__meta">{TASK_STATUS_LABELS[t.status]}</p>
                            </div>
                            <span className="zs-dashboard-list__side">
                              {t.updatedAt
                                ? format(t.updatedAt.toDate(), 'd MMM, HH:mm', { locale: ro })
                                : '—'}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </>
                  ) : null}
                  {todayShifts.length > 0 ? (
                    <>
                      <p
                        className={`zs-dashboard-section-label ${recentTasks.length > 0 ? 'zs-dashboard-section-label--spaced' : ''}`}
                      >
                        Schimburi (începând de astăzi)
                      </p>
                      <ul className="zs-dashboard-list">
                        {todayShifts.map((s) => (
                          <li key={s.id} className="zs-dashboard-list__item">
                            <div className="zs-dashboard-list__main">
                              <p className="zs-dashboard-list__title">
                                {nameById.get(s.employeeId) ?? 'Angajat'}
                              </p>
                              <p className="zs-dashboard-list__meta">
                                {s.startAt && s.endAt
                                  ? `${format(s.startAt.toDate(), 'HH:mm')} – ${format(s.endAt.toDate(), 'HH:mm')}`
                                  : '—'}
                              </p>
                            </div>
                            <span className="zs-dashboard-list__side">
                              {s.startAt
                                ? format(s.startAt.toDate(), 'd MMM', { locale: ro })
                                : ''}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </>
                  ) : null}
                </>
              )}
              <div className="zs-dashboard-links">
                <Link to={paths.scheduling}>Program</Link>
                <Link to={paths.opening}>Deschidere</Link>
                <Link to={paths.closing}>Închidere</Link>
                <Link to={paths.statistics}>Statistici</Link>
              </div>
            </Card>
          </div>
        </>
      )}
    </>
  )
}
