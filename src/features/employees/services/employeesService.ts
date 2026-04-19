import {
  addDoc,
  collection,
  deleteDoc,
  deleteField,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
  type Unsubscribe,
} from 'firebase/firestore'
import { getFirebaseDb } from '@/config/firebase'
import type { Employee, EmployeeRole, RestaurantZone } from '@/shared/types/entities'
import { EmployeeRole as ER, RestaurantZone as RZ } from '@/shared/types/entities'

const ROLE_SET = new Set<string>(Object.values(ER))
const ZONE_SET = new Set<string>(Object.values(RZ))

function mapDoc(id: string, data: Record<string, unknown>): Employee {
  const role = ROLE_SET.has(String(data.role))
    ? (data.role as EmployeeRole)
    : ER.WAITER
  const zone = ZONE_SET.has(String(data.zone))
    ? (data.zone as RestaurantZone)
    : RZ.DINING
  return {
    id,
    organizationId: String(data.organizationId ?? ''),
    fullName: String(data.fullName ?? ''),
    email: data.email != null && String(data.email) !== '' ? String(data.email) : undefined,
    phone: data.phone != null && String(data.phone) !== '' ? String(data.phone) : undefined,
    role,
    zone,
    isActive: data.isActive !== false,
    createdBy: String(data.createdBy ?? ''),
    createdAt: (data.createdAt as Employee['createdAt']) ?? null,
    updatedAt: (data.updatedAt as Employee['updatedAt']) ?? null,
  }
}

export function subscribeEmployees(
  organizationId: string,
  onNext: (employees: Employee[]) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  const db = getFirebaseDb()
  if (!db) {
    onNext([])
    return () => {}
  }
  const q = query(collection(db, 'employees'), where('organizationId', '==', organizationId))
  return onSnapshot(
    q,
    (snap) => {
      const list: Employee[] = []
      snap.forEach((d) => {
        list.push(mapDoc(d.id, d.data() as Record<string, unknown>))
      })
      list.sort((a, b) => a.fullName.localeCompare(b.fullName, 'ro', { sensitivity: 'base' }))
      onNext(list)
    },
    (err) => {
      onError?.(err instanceof Error ? err : new Error(String(err)))
    },
  )
}

export async function getEmployeeById(id: string): Promise<Employee | null> {
  const db = getFirebaseDb()
  if (!db) return null
  const ref = doc(db, 'employees', id)
  const snap = await getDoc(ref)
  if (!snap.exists()) return null
  return mapDoc(snap.id, snap.data() as Record<string, unknown>)
}

export type CreateEmployeeInput = {
  organizationId: string
  fullName: string
  email?: string
  phone?: string
  role: EmployeeRole
  zone: RestaurantZone
  isActive: boolean
  createdBy: string
}

export async function createEmployee(input: CreateEmployeeInput): Promise<string> {
  const db = getFirebaseDb()
  if (!db) throw new Error('Firestore nu este disponibil.')
  const payload: Record<string, unknown> = {
    organizationId: input.organizationId,
    fullName: input.fullName.trim(),
    role: input.role,
    zone: input.zone,
    isActive: input.isActive,
    createdBy: input.createdBy,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }
  const em = input.email?.trim()
  const ph = input.phone?.trim()
  if (em) payload.email = em
  if (ph) payload.phone = ph
  const ref = await addDoc(collection(db, 'employees'), payload)
  return ref.id
}

export async function updateEmployee(
  id: string,
  input: {
    fullName: string
    email?: string
    phone?: string
    role: EmployeeRole
    zone: RestaurantZone
    isActive: boolean
  },
): Promise<void> {
  const db = getFirebaseDb()
  if (!db) throw new Error('Firestore nu este disponibil.')
  const ref = doc(db, 'employees', id)
  const payload: Record<string, unknown> = {
    fullName: input.fullName.trim(),
    role: input.role,
    zone: input.zone,
    isActive: input.isActive,
    updatedAt: serverTimestamp(),
  }
  const em = input.email?.trim()
  const ph = input.phone?.trim()
  payload.email = em ? em : deleteField()
  payload.phone = ph ? ph : deleteField()
  await updateDoc(ref, payload)
}

export async function deleteEmployee(id: string): Promise<void> {
  const db = getFirebaseDb()
  if (!db) throw new Error('Firestore nu este disponibil.')
  await deleteDoc(doc(db, 'employees', id))
}
