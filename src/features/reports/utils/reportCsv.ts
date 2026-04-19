import { format } from 'date-fns'
import { ro } from 'date-fns/locale'
import { TASK_STATUS_LABELS } from '@/features/tasks/constants/labels'
import type { Employee, ProcedureRun, Shift, Task } from '@/shared/types/entities'
import { ProcedureType } from '@/shared/types/entities'

function csvCell(v: string | number | undefined | null): string {
  const s = v == null ? '' : String(v)
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

function row(cells: (string | number | undefined | null)[]): string {
  return cells.map(csvCell).join(';') + '\r\n'
}

const PROC_LABEL: Record<string, string> = {
  [ProcedureType.OPENING]: 'Deschidere',
  [ProcedureType.CLOSING]: 'Închidere',
}

export function buildTasksCsv(tasks: Task[], employees: Employee[]): string {
  const nameById = new Map(employees.map((e) => [e.id, e.fullName]))
  let out = row(['Titlu', 'Status', 'Termen', 'Alocat', 'Ultima activitate'])
  const sorted = [...tasks].sort((a, b) => a.title.localeCompare(b.title, 'ro'))
  for (const t of sorted) {
    const ref = t.completedAt ?? t.updatedAt ?? t.createdAt
    out += row([
      t.title,
      TASK_STATUS_LABELS[t.status],
      t.dueAt ? format(t.dueAt.toDate(), 'yyyy-MM-dd HH:mm', { locale: ro }) : '',
      t.assignedToEmployeeId ? nameById.get(t.assignedToEmployeeId) ?? '' : '',
      ref ? format(ref.toDate(), 'yyyy-MM-dd HH:mm', { locale: ro }) : '',
    ])
  }
  return out
}

export function buildShiftsCsv(shifts: Shift[], employees: Employee[]): string {
  const nameById = new Map(employees.map((e) => [e.id, e.fullName]))
  let out = row(['Angajat', 'Început', 'Sfârșit', 'Durată ore'])
  const sorted = [...shifts].sort((a, b) => {
    const am = a.startAt?.toMillis() ?? 0
    const bm = b.startAt?.toMillis() ?? 0
    return am - bm
  })
  for (const s of sorted) {
    const h =
      s.startAt && s.endAt
        ? Math.round(((s.endAt.toMillis() - s.startAt.toMillis()) / (1000 * 60 * 60)) * 10) / 10
        : ''
    out += row([
      nameById.get(s.employeeId) ?? s.employeeId,
      s.startAt ? format(s.startAt.toDate(), 'yyyy-MM-dd HH:mm', { locale: ro }) : '',
      s.endAt ? format(s.endAt.toDate(), 'yyyy-MM-dd HH:mm', { locale: ro }) : '',
      h,
    ])
  }
  return out
}

export function buildProceduresCsv(runs: ProcedureRun[]): string {
  let out = row(['Tip', 'Zi', 'Finalizat', 'Data finalizării', 'Observații'])
  const sorted = [...runs].sort((a, b) => {
    if (a.dateKey !== b.dateKey) return b.dateKey.localeCompare(a.dateKey)
    return a.type.localeCompare(b.type)
  })
  for (const r of sorted) {
    out += row([
      PROC_LABEL[r.type] ?? r.type,
      r.dateKey,
      r.completedAt ? 'Da' : 'Nu',
      r.completedAt ? format(r.completedAt.toDate(), 'yyyy-MM-dd HH:mm', { locale: ro }) : '',
      r.observations ?? '',
    ])
  }
  return out
}

export function downloadCsv(filename: string, csvBody: string): void {
  const BOM = '\uFEFF'
  const blob = new Blob([BOM + csvBody], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.rel = 'noopener'
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
