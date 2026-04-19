import { deleteField, doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore'
import type { User } from 'firebase/auth'
import { getFirebaseDb } from '@/config/firebase'
import { DEFAULT_ORGANIZATION_ID } from '@/config/organization'
import type { AppUser } from '@/shared/types/entities'
import { UserRole } from '@/shared/types/entities'

function toAppUser(uid: string, data: Record<string, unknown>): AppUser {
  return {
    uid,
    email: String(data.email ?? ''),
    displayName: String(data.displayName ?? ''),
    phone: data.phone != null ? String(data.phone) : undefined,
    role: (data.role === UserRole.ADMIN ? UserRole.ADMIN : UserRole.MANAGER) as AppUser['role'],
    organizationId: String(data.organizationId ?? DEFAULT_ORGANIZATION_ID),
    createdAt: (data.createdAt as AppUser['createdAt']) ?? null,
    updatedAt: (data.updatedAt as AppUser['updatedAt']) ?? null,
  }
}

export async function fetchUserProfile(uid: string): Promise<AppUser | null> {
  const db = getFirebaseDb()
  if (!db) return null
  const ref = doc(db, 'users', uid)
  const snap = await getDoc(ref)
  if (!snap.exists()) return null
  return toAppUser(uid, snap.data() as Record<string, unknown>)
}

export async function ensureUserProfile(firebaseUser: User, displayName?: string): Promise<AppUser> {
  const db = getFirebaseDb()
  if (!db) {
    throw new Error('Firestore nu este disponibil.')
  }
  const ref = doc(db, 'users', firebaseUser.uid)
  const snap = await getDoc(ref)
  if (snap.exists()) {
    return toAppUser(firebaseUser.uid, snap.data() as Record<string, unknown>)
  }
  const name =
    displayName?.trim() ||
    firebaseUser.displayName?.trim() ||
    firebaseUser.email?.split('@')[0] ||
    'Manager'
  const payload = {
    email: firebaseUser.email ?? '',
    displayName: name,
    role: UserRole.MANAGER,
    organizationId: DEFAULT_ORGANIZATION_ID,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }
  await setDoc(ref, payload)
  const created = await getDoc(ref)
  return toAppUser(firebaseUser.uid, created.data() as Record<string, unknown>)
}

export async function updateUserProfile(
  uid: string,
  partial: { displayName?: string; phone?: string },
): Promise<void> {
  const db = getFirebaseDb()
  if (!db) throw new Error('Firestore nu este disponibil.')
  const ref = doc(db, 'users', uid)
  const payload: Record<string, unknown> = {
    updatedAt: serverTimestamp(),
  }
  if (partial.displayName !== undefined) {
    payload.displayName = partial.displayName
  }
  if (partial.phone !== undefined) {
    const trimmed = partial.phone.trim()
    payload.phone = trimmed === '' ? deleteField() : trimmed
  }
  await setDoc(ref, payload, { merge: true })
}
