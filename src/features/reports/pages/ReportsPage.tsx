import { format } from 'date-fns'
import { ro } from 'date-fns/locale'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { paths } from '@/app/router/paths'
import { useAuth } from '@/app/providers/AuthProvider'
import { dateToKey } from '@/features/calendar/utils/dateKeys'
import { EMPLOYEE_ROLE_LABELS, RESTAURANT_ZONE_LABELS } from '@/features/employees/constants/labels'
import { useEmployees } from '@/features/employees/hooks/useEmployees'
import { useProcedureRunsList } from '@/features/procedures/hooks/useProcedureRunsList'
import { parseReportDateRange } from '@/features/reports/utils/parseReportDateRange'
import {
  buildProceduresCsv,
  buildShiftsCsv,
  buildTasksCsv,
  downloadCsv,
} from '@/features/reports/utils/reportCsv'
import {
  currentMonthRange,
  last30DaysRange,
  previousMonthRange,
} from '@/features/reports/utils/reportRangePresets'
import { useShifts } from '@/features/scheduling/hooks/useShifts'
import {
  procedureRunsInDateRange,
  shiftStatsInDateRange,
  shiftsInDateRange,
  summarizeProcedureRunsList,
  taskCountsByStatus,
  tasksByAssigneeFromList,
  tasksInDateRange,
} from '@/features/statistics/utils/aggregateStatistics'
import { useTasks } from '@/features/tasks/hooks/useTasks'
import { TASK_STATUS_LABELS } from '@/features/tasks/constants/labels'
import type { Shift } from '@/shared/types/entities'
import { ProcedureType, TaskStatus } from '@/shared/types/entities'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { Alert } from '@/shared/components/ui/Alert'
import { Button } from '@/shared/components/ui/Button'
import { Input } from '@/shared/components/ui/Input'
import { Spinner } from '@/shared/components/ui/Spinner'

const PROC_LABEL: Record<string, string> = {
  [ProcedureType.OPENING]: 'Deschidere',
  [ProcedureType.CLOSING]: 'Închidere',
}

function shiftHoursDisplay(s: Pick<Shift, 'startAt' | 'endAt'>): number | string {
  if (!s.startAt || !s.endAt) return '—'
  const ms = s.endAt.toMillis() - s.startAt.toMillis()
  if (ms <= 0) return '—'
  return Math.round((ms / (1000 * 60 * 60)) * 10) / 10
}

export function ReportsPage() {
  const { profile } = useAuth()
  const orgId = profile?.organizationId

  const defaultR = last30DaysRange()
  const [dateFromStr, setDateFromStr] = useState(() => dateToKey(defaultR.from))
  const [dateToStr, setDateToStr] = useState(() => dateToKey(defaultR.to))

  const { tasks, loading: tasksLoading, error: tasksError } = useTasks(orgId)
  const { employees, loading: empLoading, error: empError } = useEmployees(orgId)
  const { shifts, loading: shiftsLoading, error: shiftsError } = useShifts(orgId)
  const { runs, loading: runsLoading, error: runsError } = useProcedureRunsList(orgId)

  const parsedRange = useMemo(() => {
    const fallback = last30DaysRange()
    return parseReportDateRange(dateFromStr, dateToStr, fallback)
  }, [dateFromStr, dateToStr])

  const { from: rangeFrom, to: rangeTo, swapped, parseError } = parsedRange

  const tasksScoped = useMemo(() => tasksInDateRange(tasks, rangeFrom, rangeTo), [tasks, rangeFrom, rangeTo])
  const statusCounts = useMemo(() => taskCountsByStatus(tasksScoped), [tasksScoped])
  const assigneeRows = useMemo(
    () => tasksByAssigneeFromList(tasksScoped, employees),
    [tasksScoped, employees],
  )
  const procList = useMemo(
    () => procedureRunsInDateRange(runs, rangeFrom, rangeTo),
    [runs, rangeFrom, rangeTo],
  )
  const procSummary = useMemo(() => summarizeProcedureRunsList(procList), [procList])
  const shiftAgg = useMemo(
    () => shiftStatsInDateRange(shifts, employees, rangeFrom, rangeTo),
    [shifts, employees, rangeFrom, rangeTo],
  )
  const shiftsScoped = useMemo(
    () => shiftsInDateRange(shifts, rangeFrom, rangeTo),
    [shifts, rangeFrom, rangeTo],
  )

  const employeesSorted = useMemo(
    () => [...employees].sort((a, b) => a.fullName.localeCompare(b.fullName, 'ro')),
    [employees],
  )

  const tasksSorted = useMemo(
    () => [...tasksScoped].sort((a, b) => a.title.localeCompare(b.title, 'ro')),
    [tasksScoped],
  )

  const shiftsSorted = useMemo(() => {
    return [...shiftsScoped].sort((a, b) => {
      const am = a.startAt?.toMillis() ?? 0
      const bm = b.startAt?.toMillis() ?? 0
      return am - bm
    })
  }, [shiftsScoped])

  const procSorted = useMemo(() => {
    return [...procList].sort((a, b) => {
      if (a.dateKey !== b.dateKey) return b.dateKey.localeCompare(a.dateKey)
      return a.type.localeCompare(b.type)
    })
  }, [procList])

  const loading = tasksLoading || empLoading || shiftsLoading || runsLoading
  const error = tasksError ?? empError ?? shiftsError ?? runsError

  const nameById = useMemo(() => new Map(employees.map((e) => [e.id, e.fullName])), [employees])

  const rangeLabel = `${format(rangeFrom, 'd MMM yyyy', { locale: ro })} – ${format(rangeTo, 'd MMM yyyy', { locale: ro })}`
  const generatedAt = format(new Date(), "d MMM yyyy, HH:mm", { locale: ro })
  const csvSlug = `${dateFromStr}_${dateToStr}`

  const applyPreset = (r: { from: Date; to: Date }) => {
    setDateFromStr(dateToKey(r.from))
    setDateToStr(dateToKey(r.to))
  }

  if (!orgId) {
    return (
      <Alert variant="warning" title="Organizație necunoscută">
        Nu există <code>organizationId</code> în profil.
      </Alert>
    )
  }

  return (
    <>
      <PageHeader
        title="Rapoarte"
        description="Interval personalizat, tabele pentru tipărire / PDF din browser și export CSV."
      />

      <div className="zs-report-toolbar zs-report-no-print">
        <div className="zs-report-toolbar__dates">
          <div className="zs-report-toolbar__date-field">
            <Input label="De la" type="date" value={dateFromStr} onChange={(e) => setDateFromStr(e.target.value)} />
          </div>
          <div className="zs-report-toolbar__date-field">
            <Input label="Până la" type="date" value={dateToStr} onChange={(e) => setDateToStr(e.target.value)} />
          </div>
        </div>
        <div className="zs-report-presets">
          <button type="button" className="zs-report-preset" onClick={() => applyPreset(last30DaysRange())}>
            Ultimele 30 zile
          </button>
          <button type="button" className="zs-report-preset" onClick={() => applyPreset(currentMonthRange())}>
            Luna curentă
          </button>
          <button type="button" className="zs-report-preset" onClick={() => applyPreset(previousMonthRange())}>
            Luna trecută
          </button>
        </div>
        <div className="zs-report-actions">
          <Button type="button" variant="primary" onClick={() => window.print()}>
            Printează / PDF
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => downloadCsv(`raport-sarcini-${csvSlug}.csv`, buildTasksCsv(tasksScoped, employees))}
          >
            CSV sarcini
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => downloadCsv(`raport-schimburi-${csvSlug}.csv`, buildShiftsCsv(shiftsScoped, employees))}
          >
            CSV schimburi
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => downloadCsv(`raport-proceduri-${csvSlug}.csv`, buildProceduresCsv(procList))}
          >
            CSV proceduri
          </Button>
        </div>
      </div>

      {parseError ? (
        <Alert variant="warning" title="Date invalide">
          Am folosit ultimele 30 zile ca interval de rezervă. Verifică formatele AAAA-LL-ZZ.
        </Alert>
      ) : null}
      {swapped ? (
        <Alert variant="info" title="Interval corectat">
          Data de început era după sfârșit — am inversat automat pentru raport.
        </Alert>
      ) : null}

      {error ? (
        <Alert variant="error" title="Nu am putut încărca datele">
          {error}
        </Alert>
      ) : null}

      {loading ? (
        <div className="zs-employees-loading">
          <Spinner label="Se pregătește raportul…" />
        </div>
      ) : (
        <>
          <article className="zs-report-document" id="zs-report-document">
            <h1 className="zs-report-doc-title">Raport operațional Zen Sushi</h1>
            <p className="zs-report-doc-meta">
              Organizație: <strong>{orgId}</strong>
              <br />
              Perioadă: <strong>{rangeLabel}</strong>
              <br />
              Generat: {generatedAt}
              {profile?.displayName ? (
                <>
                  <br />
                  Utilizator: {profile.displayName}
                </>
              ) : null}
            </p>

            <section className="zs-report-section">
              <h2 className="zs-report-section__title">Rezumat sarcini</h2>
              <div className="zs-report-kpis">
                <span>Total în interval: {tasksScoped.length}</span>
                <span>
                  {TASK_STATUS_LABELS[TaskStatus.COMPLETED]}: {statusCounts[TaskStatus.COMPLETED]}
                </span>
                <span>
                  {TASK_STATUS_LABELS[TaskStatus.PENDING]}: {statusCounts[TaskStatus.PENDING]}
                </span>
                <span>
                  {TASK_STATUS_LABELS[TaskStatus.CANCELLED]}: {statusCounts[TaskStatus.CANCELLED]}
                </span>
              </div>
              {assigneeRows.length > 0 ? (
                <div className="zs-report-table-wrap">
                  <table className="zs-report-table">
                    <thead>
                      <tr>
                        <th>Angajat</th>
                        <th className="zs-report-table__num">Sarcini</th>
                        <th className="zs-report-table__num">Finalizate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {assigneeRows.map((r) => (
                        <tr key={r.employeeId}>
                          <td>{r.name}</td>
                          <td className="zs-report-table__num">{r.total}</td>
                          <td className="zs-report-table__num">{r.completed}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="zs-muted">Nicio sarcină cu activitate în interval (sau fără alocări).</p>
              )}
            </section>

            <section className="zs-report-section">
              <h2 className="zs-report-section__title">Detaliu sarcini</h2>
              {tasksSorted.length === 0 ? (
                <p className="zs-muted">Nu există sarcini în interval.</p>
              ) : (
                <div className="zs-report-table-wrap">
                  <table className="zs-report-table">
                    <thead>
                      <tr>
                        <th>Titlu</th>
                        <th>Status</th>
                        <th>Termen</th>
                        <th>Alocat</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tasksSorted.map((t) => (
                        <tr key={t.id}>
                          <td title={t.title}>{t.title.length > 80 ? `${t.title.slice(0, 77)}…` : t.title}</td>
                          <td>{TASK_STATUS_LABELS[t.status]}</td>
                          <td>
                            {t.dueAt ? format(t.dueAt.toDate(), 'dd.MM.yyyy HH:mm', { locale: ro }) : '—'}
                          </td>
                          <td>
                            {t.assignedToEmployeeId
                              ? nameById.get(t.assignedToEmployeeId) ?? '—'
                              : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            <section className="zs-report-section">
              <h2 className="zs-report-section__title">Program (schimburi)</h2>
              <div className="zs-report-kpis">
                <span>Schimburi: {shiftAgg.totalShifts}</span>
                <span>Ore estimate: {shiftAgg.totalHours}</span>
              </div>
              {shiftsSorted.length === 0 ? (
                <p className="zs-muted">Niciun schimb cu început în interval.</p>
              ) : (
                <div className="zs-report-table-wrap">
                  <table className="zs-report-table">
                    <thead>
                      <tr>
                        <th>Angajat</th>
                        <th>Început</th>
                        <th>Sfârșit</th>
                        <th className="zs-report-table__num">Ore</th>
                      </tr>
                    </thead>
                    <tbody>
                      {shiftsSorted.map((s) => (
                        <tr key={s.id}>
                          <td>{nameById.get(s.employeeId) ?? s.employeeId}</td>
                          <td>
                            {s.startAt ? format(s.startAt.toDate(), 'dd.MM.yyyy HH:mm', { locale: ro }) : '—'}
                          </td>
                          <td>
                            {s.endAt ? format(s.endAt.toDate(), 'dd.MM.yyyy HH:mm', { locale: ro }) : '—'}
                          </td>
                          <td className="zs-report-table__num">{shiftHoursDisplay(s)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            <section className="zs-report-section">
              <h2 className="zs-report-section__title">Proceduri deschidere / închidere</h2>
              <div className="zs-report-kpis">
                <span>Deschideri finalizate: {procSummary.openingFinalized}</span>
                <span>Închideri finalizate: {procSummary.closingFinalized}</span>
                <span>Deschideri în curs: {procSummary.openingOpen}</span>
                <span>Închideri în curs: {procSummary.closingOpen}</span>
              </div>
              {procSorted.length === 0 ? (
                <p className="zs-muted">Nicio înregistrare de procedură pentru zilele din interval.</p>
              ) : (
                <div className="zs-report-table-wrap">
                  <table className="zs-report-table">
                    <thead>
                      <tr>
                        <th>Tip</th>
                        <th>Zi</th>
                        <th>Finalizat</th>
                        <th>La data</th>
                      </tr>
                    </thead>
                    <tbody>
                      {procSorted.map((r) => (
                        <tr key={r.id}>
                          <td>{PROC_LABEL[r.type] ?? r.type}</td>
                          <td>{r.dateKey}</td>
                          <td>{r.completedAt ? 'Da' : 'Nu'}</td>
                          <td>
                            {r.completedAt
                              ? format(r.completedAt.toDate(), 'dd.MM.yyyy HH:mm', { locale: ro })
                              : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            <section className="zs-report-section">
              <h2 className="zs-report-section__title">Echipă (stare curentă)</h2>
              {employeesSorted.length === 0 ? (
                <p className="zs-muted">Niciun angajat înregistrat.</p>
              ) : (
                <div className="zs-report-table-wrap">
                  <table className="zs-report-table">
                    <thead>
                      <tr>
                        <th>Nume</th>
                        <th>Rol</th>
                        <th>Zonă</th>
                        <th>Activ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {employeesSorted.map((e) => (
                        <tr key={e.id}>
                          <td>{e.fullName}</td>
                          <td>{EMPLOYEE_ROLE_LABELS[e.role]}</td>
                          <td>{RESTAURANT_ZONE_LABELS[e.zone]}</td>
                          <td>{e.isActive ? 'Da' : 'Nu'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </article>

          <p className="zs-muted zs-report-hint zs-report-no-print">
            Pentru grafice interactive folosește modulul{' '}
            <Link to={paths.statistics}>Statistici</Link>. La print, alege „Salvează ca PDF” în dialogul
            imprimantei dacă e disponibil.
          </p>
        </>
      )}
    </>
  )
}
