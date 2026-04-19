import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { FirebaseError } from 'firebase/app'
import {
  EmailAuthProvider,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  reauthenticateWithCredential,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updatePassword,
  updateProfile,
  type User,
} from 'firebase/auth'
import { getFirebaseAuth, isFirebaseConfigured } from '@/config/firebase'
import { ensureUserProfile, fetchUserProfile } from '@/features/auth/services/userDocument'
import { mapFirebaseAuthError } from '@/shared/lib/firebase-errors'
import type { AppUser } from '@/shared/types/entities'

type AuthContextValue = {
  firebaseUser: User | null
  profile: AppUser | null
  loading: boolean
  firebaseReady: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, displayName: string) => Promise<void>
  signOutUser: () => Promise<void>
  sendPasswordReset: (email: string) => Promise<void>
  refreshProfile: () => Promise<void>
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

function mapError(e: unknown): Error {
  if (e instanceof FirebaseError) {
    return new Error(mapFirebaseAuthError(e.code))
  }
  if (e instanceof Error) return e
  return new Error('A apărut o eroare neașteptată.')
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<AppUser | null>(null)
  const [loading, setLoading] = useState(true)
  const firebaseReady = isFirebaseConfigured() && Boolean(getFirebaseAuth())

  useEffect(() => {
    const auth = getFirebaseAuth()
    if (!auth) {
      setFirebaseUser(null)
      setProfile(null)
      setLoading(false)
      return
    }

    const unsub = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user)
      if (!user) {
        setProfile(null)
        setLoading(false)
        return
      }
      try {
        let nextProfile = await fetchUserProfile(user.uid)
        if (!nextProfile) {
          nextProfile = await ensureUserProfile(user)
        }
        setProfile(nextProfile)
      } catch {
        setProfile(null)
      } finally {
        setLoading(false)
      }
    })

    return () => unsub()
  }, [])

  const signIn = useCallback(async (email: string, password: string) => {
    const auth = getFirebaseAuth()
    if (!auth) throw new Error('Firebase nu este configurat. Verifică fișierul .env.')
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password)
    } catch (e) {
      throw mapError(e)
    }
  }, [])

  const signUp = useCallback(async (email: string, password: string, displayName: string) => {
    const auth = getFirebaseAuth()
    if (!auth) throw new Error('Firebase nu este configurat. Verifică fișierul .env.')
    try {
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password)
      await updateProfile(cred.user, { displayName: displayName.trim() })
      await ensureUserProfile(cred.user, displayName.trim())
    } catch (e) {
      throw mapError(e)
    }
  }, [])

  const signOutUser = useCallback(async () => {
    const auth = getFirebaseAuth()
    if (!auth) return
    try {
      await signOut(auth)
    } catch (e) {
      throw mapError(e)
    }
  }, [])

  const sendPasswordReset = useCallback(async (email: string) => {
    const auth = getFirebaseAuth()
    if (!auth) throw new Error('Firebase nu este configurat. Verifică fișierul .env.')
    try {
      await sendPasswordResetEmail(auth, email.trim())
    } catch (e) {
      throw mapError(e)
    }
  }, [])

  const refreshProfile = useCallback(async () => {
    const auth = getFirebaseAuth()
    const user = auth?.currentUser
    if (!user) return
    try {
      const next = await fetchUserProfile(user.uid)
      if (next) setProfile(next)
    } catch {
      /* păstrăm profilul existent la erori de rețea */
    }
  }, [])

  const changePassword = useCallback(async (currentPassword: string, newPassword: string) => {
    const auth = getFirebaseAuth()
    const user = auth?.currentUser
    if (!user?.email) {
      throw new Error('Utilizator neautentificat sau e-mail indisponibil.')
    }
    try {
      const credential = EmailAuthProvider.credential(user.email, currentPassword)
      await reauthenticateWithCredential(user, credential)
      await updatePassword(user, newPassword)
    } catch (e) {
      throw mapError(e)
    }
  }, [])

  const value = useMemo(
    () => ({
      firebaseUser,
      profile,
      loading,
      firebaseReady,
      signIn,
      signUp,
      signOutUser,
      sendPasswordReset,
      refreshProfile,
      changePassword,
    }),
    [
      firebaseUser,
      profile,
      loading,
      firebaseReady,
      signIn,
      signUp,
      signOutUser,
      sendPasswordReset,
      refreshProfile,
      changePassword,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth trebuie folosit în interiorul AuthProvider.')
  }
  return ctx
}
