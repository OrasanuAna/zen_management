import type { Timestamp } from 'firebase/firestore'

export const UserRole = {
  MANAGER: 'manager',
  ADMIN: 'admin',
} as const

export type UserRole = (typeof UserRole)[keyof typeof UserRole]

export type AppUser = {
  uid: string
  email: string
  displayName: string
  phone?: string
  role: UserRole
  organizationId: string
  createdAt: Timestamp | null
  updatedAt: Timestamp | null
}

export const EmployeeRole = {
  WAITER: 'ospatar',
  HOST: 'host',
  BARTENDER: 'barman',
  CHEF: 'bucatar',
  MANAGER: 'manager',
} as const

export type EmployeeRole = (typeof EmployeeRole)[keyof typeof EmployeeRole]

export const RestaurantZone = {
  DINING: 'salon',
  BAR: 'bar',
  TERRACE: 'terasa',
  KITCHEN: 'bucatarie',
} as const

export type RestaurantZone = (typeof RestaurantZone)[keyof typeof RestaurantZone]

export type Employee = {
  id: string
  organizationId: string
  fullName: string
  email?: string
  phone?: string
  role: EmployeeRole
  zone: RestaurantZone
  isActive: boolean
  createdBy: string
  createdAt: Timestamp | null
  updatedAt: Timestamp | null
}

export const TaskStatus = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const

export type TaskStatus = (typeof TaskStatus)[keyof typeof TaskStatus]

export type Task = {
  id: string
  organizationId: string
  title: string
  description?: string
  dueAt: Timestamp | null
  status: TaskStatus
  completedAt: Timestamp | null
  assignedToEmployeeId?: string
  createdBy: string
  createdAt: Timestamp | null
  updatedAt: Timestamp | null
}

export type Shift = {
  id: string
  organizationId: string
  employeeId: string
  startAt: Timestamp | null
  endAt: Timestamp | null
  zone?: RestaurantZone
  notes?: string
  createdBy: string
  createdAt: Timestamp | null
  updatedAt: Timestamp | null
}

export const ProcedureType = {
  OPENING: 'opening',
  CLOSING: 'closing',
} as const

export type ProcedureType = (typeof ProcedureType)[keyof typeof ProcedureType]

export type ProcedureItemState = {
  done: boolean
  note?: string
}

export type ProcedureRun = {
  id: string
  organizationId: string
  type: ProcedureType
  dateKey: string
  startedBy: string
  completedAt: Timestamp | null
  itemsState: Record<string, ProcedureItemState>
  observations?: string
  createdAt: Timestamp | null
  updatedAt: Timestamp | null
}
