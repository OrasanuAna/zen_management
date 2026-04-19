import { Navigate, Route, Routes } from 'react-router-dom'
import { paths } from '@/app/router/paths'
import { AuthLayout } from '@/layouts/AuthLayout'
import { MainLayout } from '@/layouts/MainLayout'
import { ForgotPasswordPage } from '@/features/auth/pages/ForgotPasswordPage'
import { LoginPage } from '@/features/auth/pages/LoginPage'
import { RegisterPage } from '@/features/auth/pages/RegisterPage'
import { DashboardPage } from '@/features/dashboard/pages/DashboardPage'
import { TaskFormPage } from '@/features/tasks/pages/TaskFormPage'
import { TasksPage } from '@/features/tasks/pages/TasksPage'
import { CalendarPage } from '@/features/calendar/pages/CalendarPage'
import { EmployeeFormPage } from '@/features/employees/pages/EmployeeFormPage'
import { EmployeesPage } from '@/features/employees/pages/EmployeesPage'
import { SchedulingPage } from '@/features/scheduling/pages/SchedulingPage'
import { OpeningProcedurePage } from '@/features/procedures/pages/OpeningProcedurePage'
import { ClosingProcedurePage } from '@/features/procedures/pages/ClosingProcedurePage'
import { StatisticsPage } from '@/features/statistics/pages/StatisticsPage'
import { ReportsPage } from '@/features/reports/pages/ReportsPage'
import { ProfilePage } from '@/features/profile/pages/ProfilePage'
import { AccountSettingsPage } from '@/features/profile/pages/AccountSettingsPage'
import { GuestRoute } from '@/shared/components/auth/GuestRoute'
import { ProtectedRoute } from '@/shared/components/auth/ProtectedRoute'

function stripLeadingSlash(p: string): string {
  return p.startsWith('/') ? p.slice(1) : p
}

export function AppRouter() {
  return (
    <Routes>
      <Route element={<GuestRoute />}>
        <Route element={<AuthLayout />}>
          <Route path={stripLeadingSlash(paths.login)} element={<LoginPage />} />
          <Route path={stripLeadingSlash(paths.register)} element={<RegisterPage />} />
          <Route path={stripLeadingSlash(paths.forgotPassword)} element={<ForgotPasswordPage />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path={stripLeadingSlash(paths.tasks)} element={<TasksPage />} />
          <Route path={`${stripLeadingSlash(paths.tasks)}/nou`} element={<TaskFormPage />} />
          <Route path={`${stripLeadingSlash(paths.tasks)}/:taskId`} element={<TaskFormPage />} />
          <Route path={stripLeadingSlash(paths.calendar)} element={<CalendarPage />} />
          <Route path={stripLeadingSlash(paths.employees)} element={<EmployeesPage />} />
          <Route path={`${stripLeadingSlash(paths.employees)}/nou`} element={<EmployeeFormPage />} />
          <Route path={`${stripLeadingSlash(paths.employees)}/:employeeId`} element={<EmployeeFormPage />} />
          <Route path={stripLeadingSlash(paths.scheduling)} element={<SchedulingPage />} />
          <Route path={stripLeadingSlash(paths.opening)} element={<OpeningProcedurePage />} />
          <Route path={stripLeadingSlash(paths.closing)} element={<ClosingProcedurePage />} />
          <Route path={stripLeadingSlash(paths.statistics)} element={<StatisticsPage />} />
          <Route path={stripLeadingSlash(paths.reports)} element={<ReportsPage />} />
          <Route path={stripLeadingSlash(paths.profile)} element={<ProfilePage />} />
          <Route path={stripLeadingSlash(paths.account)} element={<AccountSettingsPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to={paths.dashboard} replace />} />
    </Routes>
  )
}
