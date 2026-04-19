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
  Timestamp,
  type Unsubscribe,
} from 'firebase/firestore'
import { getFirebaseDb } from '@/config/firebase'
import type { Task, TaskStatus } from '@/shared/types/entities'
import { TaskStatus as TS } from '@/shared/types/entities'

const STATUS_SET = new Set<string>(Object.values(TS))

function mapDoc(id: string, data: Record<string, unknown>): Task {
  const status = STATUS_SET.has(String(data.status)) ? (data.status as TaskStatus) : TS.PENDING
  return {
    id,
    organizationId: String(data.organizationId ?? ''),
    title: String(data.title ?? ''),
    description: data.description != null && String(data.description) !== '' ? String(data.description) : undefined,
    dueAt: (data.dueAt as Task['dueAt']) ?? null,
    status,
    completedAt: (data.completedAt as Task['completedAt']) ?? null,
    assignedToEmployeeId:
      data.assignedToEmployeeId != null && String(data.assignedToEmployeeId) !== ''
        ? String(data.assignedToEmployeeId)
        : undefined,
    createdBy: String(data.createdBy ?? ''),
    createdAt: (data.createdAt as Task['createdAt']) ?? null,
    updatedAt: (data.updatedAt as Task['updatedAt']) ?? null,
  }
}

export function subscribeTasks(
  organizationId: string,
  onNext: (tasks: Task[]) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  const db = getFirebaseDb()
  if (!db) {
    onNext([])
    return () => {}
  }
  const q = query(collection(db, 'tasks'), where('organizationId', '==', organizationId))
  return onSnapshot(
    q,
    (snap) => {
      const list: Task[] = []
      snap.forEach((d) => {
        list.push(mapDoc(d.id, d.data() as Record<string, unknown>))
      })
      list.sort((a, b) => {
        const ad = a.dueAt?.toMillis() ?? Number.MAX_SAFE_INTEGER
        const bd = b.dueAt?.toMillis() ?? Number.MAX_SAFE_INTEGER
        if (ad !== bd) return ad - bd
        return a.title.localeCompare(b.title, 'ro', { sensitivity: 'base' })
      })
      onNext(list)
    },
    (err) => {
      onError?.(err instanceof Error ? err : new Error(String(err)))
    },
  )
}

export async function getTaskById(id: string): Promise<Task | null> {
  const db = getFirebaseDb()
  if (!db) return null
  const ref = doc(db, 'tasks', id)
  const snap = await getDoc(ref)
  if (!snap.exists()) return null
  return mapDoc(snap.id, snap.data() as Record<string, unknown>)
}

export type CreateTaskInput = {
  organizationId: string
  title: string
  description?: string
  dueAt: Timestamp | null
  assignedToEmployeeId?: string
  createdBy: string
}

export async function createTask(input: CreateTaskInput): Promise<string> {
  const db = getFirebaseDb()
  if (!db) throw new Error('Firestore nu este disponibil.')
  const payload: Record<string, unknown> = {
    organizationId: input.organizationId,
    title: input.title.trim(),
    status: TS.PENDING,
    completedAt: null,
    createdBy: input.createdBy,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }
  const desc = input.description?.trim()
  if (desc) payload.description = desc
  if (input.dueAt) payload.dueAt = input.dueAt
  else payload.dueAt = null
  const assign = input.assignedToEmployeeId?.trim()
  if (assign) payload.assignedToEmployeeId = assign
  const ref = await addDoc(collection(db, 'tasks'), payload)
  return ref.id
}

export type UpdateTaskInput = {
  title: string
  description?: string
  dueAt: Timestamp | null
  status: TaskStatus
  assignedToEmployeeId?: string
}

export async function updateTask(id: string, input: UpdateTaskInput): Promise<void> {
  const db = getFirebaseDb()
  if (!db) throw new Error('Firestore nu este disponibil.')
  const ref = doc(db, 'tasks', id)
  const payload: Record<string, unknown> = {
    title: input.title.trim(),
    status: input.status,
    updatedAt: serverTimestamp(),
  }
  const desc = input.description?.trim()
  payload.description = desc ? desc : deleteField()
  payload.dueAt = input.dueAt ?? null
  const assign = input.assignedToEmployeeId?.trim()
  payload.assignedToEmployeeId = assign ? assign : deleteField()

  if (input.status === TS.COMPLETED) {
    payload.completedAt = serverTimestamp()
  } else {
    payload.completedAt = deleteField()
  }

  await updateDoc(ref, payload)
}

export async function setTaskCompleted(id: string, completed: boolean): Promise<void> {
  const db = getFirebaseDb()
  if (!db) throw new Error('Firestore nu este disponibil.')
  const ref = doc(db, 'tasks', id)
  await updateDoc(ref, {
    status: completed ? TS.COMPLETED : TS.PENDING,
    completedAt: completed ? serverTimestamp() : deleteField(),
    updatedAt: serverTimestamp(),
  })
}

export async function deleteTask(id: string): Promise<void> {
  const db = getFirebaseDb()
  if (!db) throw new Error('Firestore nu este disponibil.')
  await deleteDoc(doc(db, 'tasks', id))
}
