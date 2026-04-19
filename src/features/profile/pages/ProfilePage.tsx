import { zodResolver } from '@hookform/resolvers/zod'
import { updateProfile } from 'firebase/auth'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useAuth } from '@/app/providers/AuthProvider'
import { updateUserProfile } from '@/features/auth/services/userDocument'
import {
  profileFormSchema,
  type ProfileFormValues,
} from '@/features/profile/validation/profileSchemas'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { Alert } from '@/shared/components/ui/Alert'
import { Button } from '@/shared/components/ui/Button'
import { Card } from '@/shared/components/ui/Card'
import { Input } from '@/shared/components/ui/Input'
import { UserRole } from '@/shared/types/entities'

export function ProfilePage() {
  const { profile, firebaseUser, refreshProfile } = useAuth()
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null,
  )

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      displayName: '',
      phone: '',
    },
  })

  useEffect(() => {
    if (profile) {
      reset({
        displayName: profile.displayName,
        phone: profile.phone ?? '',
      })
    }
  }, [profile, reset])

  const onSubmit = handleSubmit(async (values) => {
    setFeedback(null)
    const user = firebaseUser
    if (!user || !profile) {
      setFeedback({ type: 'error', message: 'Nu ești autentificat sau profilul lipsește.' })
      return
    }
    const displayName = values.displayName.trim()
    const phone = values.phone?.trim() ?? ''
    try {
      await updateUserProfile(user.uid, { displayName, phone })
      await updateProfile(user, { displayName })
      await refreshProfile()
      setFeedback({ type: 'success', message: 'Profilul a fost actualizat.' })
      reset({ displayName, phone })
    } catch {
      setFeedback({
        type: 'error',
        message: 'Nu am putut salva modificările. Verifică regulile Firestore și conexiunea.',
      })
    }
  })

  return (
    <>
      <PageHeader
        title="Profil"
        description="Datele tale afișate în aplicație și folosite în rapoarte operaționale."
      />

      {feedback?.type === 'success' ? (
        <Alert variant="success" title="Salvat">
          {feedback.message}
        </Alert>
      ) : null}
      {feedback?.type === 'error' ? (
        <Alert variant="error" title="Eroare">
          {feedback.message}
        </Alert>
      ) : null}

      <Card title="Informații personale" subtitle="Nume și contact">
        <div className="zs-readonly-field">
          <span className="zs-label">E-mail</span>
          <p className="zs-readonly-field__value">
            {profile?.email ?? firebaseUser?.email ?? '—'}
          </p>
          <p className="zs-hint zs-readonly-field__hint">
            Schimbarea adresei de e-mail se face din consola Firebase sau prin suport tehnic.
          </p>
        </div>

        <form className="zs-stack zs-stack--md zs-profile-form" onSubmit={onSubmit} noValidate>
          <Input
            label="Nume afișat"
            autoComplete="name"
            placeholder="ex. Maria Ionescu"
            error={errors.displayName?.message}
            {...register('displayName')}
          />
          <Input
            label="Telefon (opțional)"
            type="tel"
            autoComplete="tel"
            placeholder="ex. 07xx xxx xxx"
            error={errors.phone?.message}
            {...register('phone')}
          />
          <div className="zs-profile-form__actions">
            <Button type="submit" loading={isSubmitting} disabled={!isDirty}>
              Salvează modificările
            </Button>
          </div>
        </form>
      </Card>

      {profile ? (
        <Card title="Rol și organizație" subtitle="Informații doar în citire">
          <dl className="zs-dl">
            <div className="zs-dl__row">
              <dt>Rol</dt>
              <dd>{profile.role === UserRole.ADMIN ? 'Administrator' : 'Manager'}</dd>
            </div>
            <div className="zs-dl__row">
              <dt>ID organizație</dt>
              <dd>
                <code>{profile.organizationId}</code>
              </dd>
            </div>
          </dl>
        </Card>
      ) : null}
    </>
  )
}
