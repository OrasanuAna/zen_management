import {
  addDoc,
  collection,
  deleteDoc,
  deleteField,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  Timestamp,
  where,
  type Unsubscribe,
} from 'firebase/firestore'
import { getFirebaseDb } from '@/config/firebase'
import type { RestaurantZone, Shift } from '@/shared/types/entities'
import { RestaurantZone as RZ } from '@/shared/types/entities'

const ZONE_SET = new Set<string>(Object.values(RZ))

function mapDoc(id: string, data: Record<string, unknown>): Shift {
  const zoneRaw = data.zone
  const zone =
    zoneRaw != null && String(zoneRaw) !== '' && ZONE_SET.has(String(zoneRaw))
      ? (zoneRaw as RestaurantZone)
      : undefined
  return {
    id,
    organizationId: String(data.organizationId ?? ''),
    employeeId: String(data.employeeId ?? ''),
    startAt: (data.startAt as Shift['startAt']) ?? null,
    endAt: (data.endAt as Shift['endAt']) ?? null,
    zone,
    notes: data.notes != null && String(data.notes) !== '' ? String(data.notes) : undefined,
    createdBy: String(data.createdBy ?? ''),
    createdAt: (data.createdAt as Shift['createdAt']) ?? null,
    updatedAt: (data.updatedAt as Shift['updatedAt']) ?? null,
  }
}

export function subscribeShifts(
  organizationId: string,
  onNext: (shifts: Shift[]) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  const db = getFirebaseDb()
  if (!db) {
    onNext([])
    return () => {}
  }
  const q = query(collection(db, 'shifts'), where('organizationId', '==', organizationId))
  return onSnapshot(
    q,
    (snap) => {
      const list: Shift[] = []
      snap.forEach((d) => {
        list.push(mapDoc(d.id, d.data() as Record<string, unknown>))
      })
      list.sort((a, b) => {
        const am = a.startAt?.toMillis() ?? 0
        const bm = b.startAt?.toMillis() ?? 0
        if (am !== bm) return am - bm
        return a.id.localeCompare(b.id)
      })
      onNext(list)
    },
    (err) => {
      onError?.(err instanceof Error ? err : new Error(String(err)))
    },
  )
}

export type CreateShiftInput = {
  organizationId: string
  employeeId: string
  startAt: Date
  endAt: Date
  zone?: RestaurantZone
  notes?: string
  createdBy: string
}

export async function createShift(input: CreateShiftInput): Promise<string> {
  const db = getFirebaseDb()
  if (!db) throw new Error('Firestore nu este disponibil.')
  const payload: Record<string, unknown> = {
    organizationId: input.organizationId,
    employeeId: input.employeeId,
    startAt: Timestamp.fromDate(input.startAt),
    endAt: Timestamp.fromDate(input.endAt),
    createdBy: input.createdBy,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }
  const n = input.notes?.trim()
  if (n) payload.notes = n
  if (input.zone) payload.zone = input.zone
  const ref = await addDoc(collection(db, 'shifts'), payload)
  return ref.id
}

export async function updateShift(
  id: string,
  input: {
    employeeId: string
    startAt: Date
    endAt: Date
    zone?: RestaurantZone
    notes?: string
  },
): Promise<void> {
  const db = getFirebaseDb()
  if (!db) throw new Error('Firestore nu este disponibil.')
  const ref = doc(db, 'shifts', id)
  const payload: Record<string, unknown> = {
    employeeId: input.employeeId,
    startAt: Timestamp.fromDate(input.startAt),
    endAt: Timestamp.fromDate(input.endAt),
    updatedAt: serverTimestamp(),
  }
  const n = input.notes?.trim()
  payload.notes = n ? n : deleteField()
  payload.zone = input.zone ? input.zone : deleteField()
  await updateDoc(ref, payload)
}

export async function deleteShift(id: string): Promise<void> {
  const db = getFirebaseDb()
  if (!db) throw new Error('Firestore nu este disponibil.')
  await deleteDoc(doc(db, 'shifts', id))
}
