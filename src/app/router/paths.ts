export const paths = {
  dashboard: '/',
  login: '/autentificare',
  register: '/inregistrare',
  forgotPassword: '/parola-uitata',
  tasks: '/sarcini',
  tasksNew: '/sarcini/nou',
  calendar: '/calendar',
  employees: '/angajati',
  employeesNew: '/angajati/nou',
  scheduling: '/program',
  opening: '/deschidere',
  closing: '/inchidere',
  statistics: '/statistici',
  reports: '/rapoarte',
  profile: '/profil',
  account: '/cont',
} as const

export type AppPath = (typeof paths)[keyof typeof paths]

export function pathEmployeeEdit(id: string): string {
  return `${paths.employees}/${encodeURIComponent(id)}`
}

export function pathTaskEdit(id: string): string {
  return `${paths.tasks}/${encodeURIComponent(id)}`
}
