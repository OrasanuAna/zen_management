import { paths } from '@/app/router/paths'

export type NavItem = {
  label: string
  to: string
  icon: 'home' | 'tasks' | 'calendar' | 'users' | 'clock' | 'sun' | 'moon' | 'chart' | 'file' | 'user' | 'settings'
}

export const mainNavItems: NavItem[] = [
  { label: 'Panou de control', to: paths.dashboard, icon: 'home' },
  { label: 'Sarcini', to: paths.tasks, icon: 'tasks' },
  { label: 'Calendar', to: paths.calendar, icon: 'calendar' },
  { label: 'Angajați', to: paths.employees, icon: 'users' },
  { label: 'Program', to: paths.scheduling, icon: 'clock' },
  { label: 'Deschidere', to: paths.opening, icon: 'sun' },
  { label: 'Închidere', to: paths.closing, icon: 'moon' },
  { label: 'Statistici', to: paths.statistics, icon: 'chart' },
  { label: 'Rapoarte', to: paths.reports, icon: 'file' },
]

export const accountNavItems: NavItem[] = [
  { label: 'Profil', to: paths.profile, icon: 'user' },
  { label: 'Cont', to: paths.account, icon: 'settings' },
]
