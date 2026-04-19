import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useAuth } from '@/app/providers/AuthProvider'
import {
  changePasswordSchema,
  type ChangePasswordFormValues,
} from '@/features/profile/validation/profileSchemas'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { Alert } from '@/shared/components/ui/Alert'
import { Button } from '@/shared/components/ui/Button'
import { Card } from '@/shared/components/ui/Card'
import { Input } from '@/shared/components/ui/Input'

export function AccountSettingsPage() {
  const { changePassword, sendPasswordReset, profile, firebaseUser } = useAuth()
  const [pwdFeedback, setPwdFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null,
  )
  const [resetFeedback, setResetFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null,
  )
  const [resetLoading, setResetLoading] = useState(false)

  const email = profile?.email ?? firebaseUser?.email ?? ''

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  })

  const onPasswordSubmit = handleSubmit(async (values) => {
    setPwdFeedback(null)
    try {
      await changePassword(values.currentPassword, values.newPassword)
      reset()
      setPwdFeedback({ type: 'success', message: 'Parola a fost schimbată cu succes.' })
    } catch (e) {
      setPwdFeedback({
        type: 'error',
        message: e instanceof Error ? e.message : 'Schimbarea parolei a eșuat.',
      })
    }
  })

  const handleSendResetEmail = async () => {
    setResetFeedback(null)
    if (!email) {
      setResetFeedback({ type: 'error', message: 'Nu există adresă de e-mail asociată contului.' })
      return
    }
    setResetLoading(true)
    try {
      await sendPasswordReset(email)
      setResetFeedback({
        type: 'success',
        message: 'Dacă adresa este validă, vei primi un e-mail cu instrucțiuni. Verifică și Spam.',
      })
    } catch (e) {
      setResetFeedback({
        type: 'error',
        message: e instanceof Error ? e.message : 'Trimiterea e-mailului a eșuat.',
      })
    } finally {
      setResetLoading(false)
    }
  }

  return (
    <>
      <PageHeader
        title="Setări cont"
        description="Securitate: schimbare parolă și recuperare acces."
      />

      <Card title="Schimbare parolă" subtitle="Introdu parola curentă, apoi parola nouă">
        {pwdFeedback?.type === 'success' ? (
          <Alert variant="success" title="Gata">
            {pwdFeedback.message}
          </Alert>
        ) : null}
        {pwdFeedback?.type === 'error' ? (
          <Alert variant="error" title="Nu am putut schimba parola">
            {pwdFeedback.message}
          </Alert>
        ) : null}

        <form className="zs-stack zs-stack--md" onSubmit={onPasswordSubmit} noValidate>
          <Input
            label="Parola curentă"
            type="password"
            autoComplete="current-password"
            error={errors.currentPassword?.message}
            {...register('currentPassword')}
          />
          <Input
            label="Parola nouă"
            type="password"
            autoComplete="new-password"
            error={errors.newPassword?.message}
            {...register('newPassword')}
          />
          <Input
            label="Confirmă parola nouă"
            type="password"
            autoComplete="new-password"
            error={errors.confirmPassword?.message}
            {...register('confirmPassword')}
          />
          <Button type="submit" loading={isSubmitting}>
            Actualizează parola
          </Button>
        </form>
      </Card>

      <Card title="Resetare prin e-mail" subtitle="Dacă ai uitat parola sau preferi linkul de reset">
        {resetFeedback?.type === 'success' ? (
          <Alert variant="success" title="Trimis">
            {resetFeedback.message}
          </Alert>
        ) : null}
        {resetFeedback?.type === 'error' ? (
          <Alert variant="error" title="Eroare">
            {resetFeedback.message}
          </Alert>
        ) : null}

        <p className="zs-muted zs-stack__tight">
          Se trimite un e-mail la <strong>{email || '—'}</strong> cu link de resetare (dacă contul
          există).
        </p>
        <Button type="button" variant="secondary" loading={resetLoading} onClick={() => void handleSendResetEmail()}>
          Trimite e-mail de resetare
        </Button>
      </Card>
    </>
  )
}
