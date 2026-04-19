import {
  collection,
  deleteField,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  type Unsubscribe,
} from 'firebase/firestore'
import { getFirebaseDb } from '@/config/firebase'
import type { ProcedureItemState, ProcedureRun, ProcedureType } from '@/shared/types/entities'
import { ProcedureType as PT } from '@/shared/types/entities'

const TYPE_SET = new Set<string>(Object.values(PT))

export function procedureRunDocId(organizationId: string, type: ProcedureType, dateKey: string): string {
  return `${organizationId}__${type}__${dateKey}`
}

function parseItemsState(raw: unknown): Record<string, ProcedureItemState> {
  if (raw == null || typeof raw !== 'object') return {}
  const out: Record<string, ProcedureItemState> = {}
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (v != null && typeof v === 'object' && 'done' in v) {
      const done = Boolean((v as { done?: boolean }).done)
      const noteRaw = (v as { note?: unknown }).note
      const note =
        noteRaw != null && String(noteRaw).trim() !== '' ? String(noteRaw).trim() : undefined
      out[k] = note ? { done, note } : { done }
    }
  }
  return out
}

function mapDoc(id: string, data: Record<string, unknown>): ProcedureRun {
  const type = TYPE_SET.has(String(data.type)) ? (data.type as ProcedureType) : PT.OPENING
  return {
    id,
    organizationId: String(data.organizationId ?? ''),
    type,
    dateKey: String(data.dateKey ?? ''),
    startedBy: String(data.startedBy ?? ''),
    completedAt: (data.completedAt as ProcedureRun['completedAt']) ?? null,
    itemsState: parseItemsState(data.itemsState),
    observations:
      data.observations != null && String(data.observations).trim() !== ''
        ? String(data.observations).trim()
        : undefined,
    createdAt: (data.createdAt as ProcedureRun['createdAt']) ?? null,
    updatedAt: (data.updatedAt as ProcedureRun['updatedAt']) ?? null,
  }
}

export async function ensureProcedureRun(
  organizationId: string,
  type: ProcedureType,
  dateKey: string,
  startedBy: string,
  initialItemsState: Record<string, ProcedureItemState>,
): Promise<void> {
  const db = getFirebaseDb()
  if (!db) return
  const id = procedureRunDocId(organizationId, type, dateKey)
  const ref = doc(db, 'procedureRuns', id)
  const snap = await getDoc(ref)
  if (snap.exists()) return
  await setDoc(ref, {
    organizationId,
    type,
    dateKey,
    startedBy,
    completedAt: null,
    itemsState: initialItemsState,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
}

export function subscribeProcedureRun(
  organizationId: string,
  type: ProcedureType,
  dateKey: string,
  onNext: (run: ProcedureRun | null) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  const db = getFirebaseDb()
  if (!db) {
    onNext(null)
    return () => {}
  }
  const id = procedureRunDocId(organizationId, type, dateKey)
  const ref = doc(db, 'procedureRuns', id)
  return onSnapshot(
    ref,
    (snap) => {
      if (!snap.exists()) {
        onNext(null)
        return
      }
      onNext(mapDoc(snap.id, snap.data() as Record<string, unknown>))
    },
    (err) => {
      onError?.(err instanceof Error ? err : new Error(String(err)))
    },
  )
}

export async function updateProcedureRunItems(
  organizationId: string,
  type: ProcedureType,
  dateKey: string,
  itemsState: Record<string, ProcedureItemState>,
): Promise<void> {
  const db = getFirebaseDb()
  if (!db) throw new Error('Firestore nu este disponibil.')
  const ref = doc(db, 'procedureRuns', procedureRunDocId(organizationId, type, dateKey))
  await updateDoc(ref, {
    itemsState,
    updatedAt: serverTimestamp(),
  })
}

export async function updateProcedureObservations(
  organizationId: string,
  type: ProcedureType,
  dateKey: string,
  observations: string | undefined,
): Promise<void> {
  const db = getFirebaseDb()
  if (!db) throw new Error('Firestore nu este disponibil.')
  const ref = doc(db, 'procedureRuns', procedureRunDocId(organizationId, type, dateKey))
  const o = observations?.trim()
  await updateDoc(ref, {
    observations: o ? o : deleteField(),
    updatedAt: serverTimestamp(),
  })
}

export async function setProcedureRunCompleted(
  organizationId: string,
  type: ProcedureType,
  dateKey: string,
  completed: boolean,
): Promise<void> {
  const db = getFirebaseDb()
  if (!db) throw new Error('Firestore nu este disponibil.')
  const ref = doc(db, 'procedureRuns', procedureRunDocId(organizationId, type, dateKey))
  await updateDoc(ref, {
    completedAt: completed ? serverTimestamp() : null,
    updatedAt: serverTimestamp(),
  })
}

/** Toate înregistrările de procedură pentru organizație (ex. statistici). */
export function subscribeProcedureRunsForOrganization(
  organizationId: string,
  onNext: (runs: ProcedureRun[]) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  const db = getFirebaseDb()
  if (!db) {
    onNext([])
    return () => {}
  }
  const q = query(collection(db, 'procedureRuns'), where('organizationId', '==', organizationId))
  return onSnapshot(
    q,
    (snap) => {
      const list: ProcedureRun[] = []
      snap.forEach((d) => {
        list.push(mapDoc(d.id, d.data() as Record<string, unknown>))
      })
      list.sort((a, b) => {
        if (a.dateKey !== b.dateKey) return b.dateKey.localeCompare(a.dateKey)
        if (a.type !== b.type) return a.type.localeCompare(b.type)
        return a.id.localeCompare(b.id)
      })
      onNext(list)
    },
    (err) => {
      onError?.(err instanceof Error ? err : new Error(String(err)))
    },
  )
}
