import clsx from "clsx";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { paths } from "@/app/router/paths";
import { useAuth } from "@/app/providers/AuthProvider";
import { useEmployees } from "@/features/employees/hooks/useEmployees";
import { useProcedureRunsList } from "@/features/procedures/hooks/useProcedureRunsList";
import { useShifts } from "@/features/scheduling/hooks/useShifts";
import { StatBar } from "@/features/statistics/components/StatBar";
import {
  countEmployeesByRole,
  countEmployeesByZone,
  periodToSince,
  shiftStatsInPeriod,
  summarizeProcedures,
  taskCountsByStatus,
  tasksByAssignee,
  tasksInPeriod,
  type StatsPeriod,
} from "@/features/statistics/utils/aggregateStatistics";
import { useTasks } from "@/features/tasks/hooks/useTasks";
import { TASK_STATUS_LABELS } from "@/features/tasks/constants/labels";
import { TaskStatus } from "@/shared/types/entities";
import { PageHeader } from "@/shared/components/layout/PageHeader";
import { Alert } from "@/shared/components/ui/Alert";
import { Card } from "@/shared/components/ui/Card";
import { Spinner } from "@/shared/components/ui/Spinner";

const PERIOD_OPTIONS: { id: StatsPeriod; label: string }[] = [
  { id: "7d", label: "Ultimele 7 zile" },
  { id: "30d", label: "Ultimele 30 zile" },
  { id: "all", label: "Tot istoricul" },
];

export function StatisticsPage() {
  const { profile } = useAuth();
  const orgId = profile?.organizationId;
  const [period, setPeriod] = useState<StatsPeriod>("30d");

  const { tasks, loading: tasksLoading, error: tasksError } = useTasks(orgId);
  const {
    employees,
    loading: empLoading,
    error: empError,
  } = useEmployees(orgId);
  const {
    shifts,
    loading: shiftsLoading,
    error: shiftsError,
  } = useShifts(orgId);
  const {
    runs,
    loading: runsLoading,
    error: runsError,
  } = useProcedureRunsList(orgId);

  const since = useMemo(() => periodToSince(period), [period]);

  const tasksScoped = useMemo(
    () => tasksInPeriod(tasks, since),
    [tasks, since],
  );
  const statusCounts = useMemo(
    () => taskCountsByStatus(tasksScoped),
    [tasksScoped],
  );
  const assigneeRows = useMemo(
    () => tasksByAssignee(tasks, employees, since),
    [tasks, employees, since],
  );
  const roleRows = useMemo(() => countEmployeesByRole(employees), [employees]);
  const zoneRows = useMemo(() => countEmployeesByZone(employees), [employees]);
  const shiftAgg = useMemo(
    () => shiftStatsInPeriod(shifts, employees, since),
    [shifts, employees, since],
  );
  const procSummary = useMemo(
    () => summarizeProcedures(runs, since),
    [runs, since],
  );

  const loading = tasksLoading || empLoading || shiftsLoading || runsLoading;
  const error = tasksError ?? empError ?? shiftsError ?? runsError;

  const taskTotal = tasksScoped.length;
  const maxStatus = Math.max(
    statusCounts[TaskStatus.PENDING],
    statusCounts[TaskStatus.COMPLETED],
    statusCounts[TaskStatus.CANCELLED],
    1,
  );
  const maxAssignee = Math.max(...assigneeRows.map((r) => r.total), 1);
  const empTotal = employees.length;
  const maxRole = Math.max(...roleRows.map((r) => r.count), 1);
  const maxZone = Math.max(...zoneRows.map((r) => r.count), 1);
  const maxShiftHours = Math.max(...shiftAgg.rows.map((r) => r.hoursApprox), 1);

  const activeEmp = employees.filter((e) => e.isActive).length;

  if (!orgId) {
    return (
      <Alert variant="warning" title="Organizație necunoscută">
        Nu există <code>organizationId</code> în profil.
      </Alert>
    );
  }

  return (
    <>
      <PageHeader
        title="Statistici"
        description="Rezumate din sarcini, angajați, program și proceduri — filtrate pe perioadă."
      />

      <div
        className="zs-stat-period"
        role="tablist"
        aria-label="Perioadă statistici"
      >
        {PERIOD_OPTIONS.map((o) => (
          <button
            key={o.id}
            type="button"
            role="tab"
            aria-selected={period === o.id}
            className={clsx(
              "zs-stat-period__btn",
              period === o.id && "zs-stat-period__btn--active",
            )}
            onClick={() => setPeriod(o.id)}
          >
            {o.label}
          </button>
        ))}
      </div>

      {error ? (
        <Alert variant="error" title="Nu am putut încărca toate datele">
          {error}
        </Alert>
      ) : null}

      {loading ? (
        <div className="zs-employees-loading">
          <Spinner label="Se calculează statisticile…" />
        </div>
      ) : (
        <>
          <h2 className="zs-stat-section-title">Sarcini</h2>
          <div className="zs-stat-kpis">
            <div className="zs-stat-kpi">
              <p className="zs-stat-kpi__value">{taskTotal}</p>
              <p className="zs-stat-kpi__label">
                sarcini în perioadă (după activitate)
              </p>
            </div>
            <div className="zs-stat-kpi">
              <p className="zs-stat-kpi__value">
                {statusCounts[TaskStatus.COMPLETED]}
              </p>
              <p className="zs-stat-kpi__label">finalizate</p>
            </div>
            <div className="zs-stat-kpi">
              <p className="zs-stat-kpi__value">
                {statusCounts[TaskStatus.PENDING]}
              </p>
              <p className="zs-stat-kpi__label">în așteptare</p>
            </div>
            <div className="zs-stat-kpi">
              <p className="zs-stat-kpi__value">
                {statusCounts[TaskStatus.CANCELLED]}
              </p>
              <p className="zs-stat-kpi__label">anulate</p>
            </div>
          </div>
          <div className="zs-stat-grid">
            <Card title="Distribuție status" subtitle="În perioada selectată">
              <StatBar
                label={TASK_STATUS_LABELS[TaskStatus.PENDING]}
                value={statusCounts[TaskStatus.PENDING]}
                max={maxStatus}
              />
              <StatBar
                label={TASK_STATUS_LABELS[TaskStatus.COMPLETED]}
                value={statusCounts[TaskStatus.COMPLETED]}
                max={maxStatus}
                variant="accent"
              />
              <StatBar
                label={TASK_STATUS_LABELS[TaskStatus.CANCELLED]}
                value={statusCounts[TaskStatus.CANCELLED]}
                max={maxStatus}
                variant="muted"
              />
            </Card>
            <Card title="Sarcini alocate" subtitle="După angajat (în perioadă)">
              {assigneeRows.length === 0 ? (
                <p className="zs-stat-empty">
                  Nicio sarcină alocată în perioadă.
                </p>
              ) : (
                assigneeRows
                  .slice(0, 10)
                  .map((r) => (
                    <StatBar
                      key={r.employeeId}
                      label={`${r.name} (${r.completed}/${r.total} finalizate)`}
                      value={r.total}
                      max={maxAssignee}
                    />
                  ))
              )}
            </Card>
          </div>

          <h2 className="zs-stat-section-title">Angajați</h2>
          <div className="zs-stat-kpis">
            <div className="zs-stat-kpi">
              <p className="zs-stat-kpi__value">{empTotal}</p>
              <p className="zs-stat-kpi__label">total înregistrați</p>
            </div>
            <div className="zs-stat-kpi">
              <p className="zs-stat-kpi__value">{activeEmp}</p>
              <p className="zs-stat-kpi__label">activi</p>
            </div>
            <div className="zs-stat-kpi">
              <p className="zs-stat-kpi__value">{empTotal - activeEmp}</p>
              <p className="zs-stat-kpi__label">inactivi</p>
            </div>
          </div>
          <div className="zs-stat-grid">
            <Card title="După rol" subtitle="Efectiv curent">
              {roleRows.length === 0 ? (
                <p className="zs-stat-empty">Niciun angajat.</p>
              ) : (
                roleRows.map((r) => (
                  <StatBar
                    key={r.role}
                    label={r.label}
                    value={r.count}
                    max={maxRole}
                  />
                ))
              )}
            </Card>
            <Card title="După zonă" subtitle="Efectiv curent">
              {zoneRows.length === 0 ? (
                <p className="zs-stat-empty">Niciun angajat.</p>
              ) : (
                zoneRows.map((r) => (
                  <StatBar
                    key={r.zone}
                    label={r.label}
                    value={r.count}
                    max={maxZone}
                  />
                ))
              )}
            </Card>
          </div>

          <h2 className="zs-stat-section-title">Program (schimburi)</h2>
          <div className="zs-stat-kpis">
            <div className="zs-stat-kpi">
              <p className="zs-stat-kpi__value">{shiftAgg.totalShifts}</p>
              <p className="zs-stat-kpi__label">
                schimburi (început în perioadă)
              </p>
            </div>
            <div className="zs-stat-kpi">
              <p className="zs-stat-kpi__value">{shiftAgg.totalHours}</p>
              <p className="zs-stat-kpi__label">ore estimate (sumă durate)</p>
            </div>
          </div>
          <Card title="Ore pe angajat" subtitle="În perioada selectată">
            {shiftAgg.rows.length === 0 ? (
              <p className="zs-stat-empty">Niciun schimb în perioadă.</p>
            ) : (
              shiftAgg.rows
                .slice(0, 12)
                .map((r) => (
                  <StatBar
                    key={r.employeeId}
                    label={`${r.name} · ${r.shiftCount} schimburi`}
                    value={r.hoursApprox}
                    max={maxShiftHours}
                  />
                ))
            )}
          </Card>

          <h2 className="zs-stat-section-title" style={{ marginTop: "2rem" }}>
            Proceduri
          </h2>
          <div className="zs-stat-kpis">
            <div className="zs-stat-kpi">
              <p className="zs-stat-kpi__value">
                {procSummary.openingFinalized}
              </p>
              <p className="zs-stat-kpi__label">deschideri finalizate</p>
            </div>
            <div className="zs-stat-kpi">
              <p className="zs-stat-kpi__value">
                {procSummary.closingFinalized}
              </p>
              <p className="zs-stat-kpi__label">închideri finalizate</p>
            </div>
            <div className="zs-stat-kpi">
              <p className="zs-stat-kpi__value">{procSummary.openingOpen}</p>
              <p className="zs-stat-kpi__label">
                deschideri în curs / nefinalizate
              </p>
            </div>
            <div className="zs-stat-kpi">
              <p className="zs-stat-kpi__value">{procSummary.closingOpen}</p>
              <p className="zs-stat-kpi__label">
                închideri în curs / nefinalizate
              </p>
            </div>
          </div>
          <div className="zs-stat-grid">
            <Card
              title="Calitate checklist"
              subtitle="Medie puncte bifate la proceduri finalizate (în perioadă)"
            >
              <p className="zs-muted zs-stat-proc-pct">
                Deschidere:{" "}
                <strong>
                  {procSummary.avgOpeningChecklistPct != null
                    ? `${procSummary.avgOpeningChecklistPct}%`
                    : "—"}
                </strong>
                <br />
                Închidere:{" "}
                <strong>
                  {procSummary.avgClosingChecklistPct != null
                    ? `${procSummary.avgClosingChecklistPct}%`
                    : "—"}
                </strong>
              </p>
            </Card>
          </div>

          <p className="zs-muted zs-stat-hint">
            <Link to={paths.tasks}>Sarcini</Link>
            {" · "}
            <Link to={paths.employees}>Angajați</Link>
            {" · "}
            <Link to={paths.scheduling}>Program</Link>
            {" · "}
            <Link to={paths.opening}>Deschidere</Link>
            {" · "}
            <Link to={paths.closing}>Închidere</Link>
          </p>
        </>
      )}
    </>
  );
}
