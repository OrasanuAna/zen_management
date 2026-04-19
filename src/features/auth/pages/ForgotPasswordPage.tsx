import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import { paths } from '@/app/router/paths'
import { useAuth } from '@/app/providers/AuthProvider'
import { isFirebaseConfigured } from '@/config/firebase'
import {
  forgotPasswordSchema,
  type ForgotPasswordFormValues,
} from '@/features/auth/validation/authSchemas'
import { Alert } from '@/shared/components/ui/Alert'
import { Button } from '@/shared/components/ui/Button'
import { Card } from '@/shared/components/ui/Card'
import { Input } from '@/shared/components/ui/Input'

export function ForgotPasswordPage() {
  const { sendPasswordReset, firebaseReady } = useAuth()
  const [formError, setFormError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)
  const configured = isFirebaseConfigured()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  })

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null)
    try {
      await sendPasswordReset(values.email)
      setSent(true)
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Trimiterea e-mailului a eșuat.')
    }
  })

  return (
    <Card title="Resetare parolă" subtitle="Îți trimitem un link pe e-mail">
      {!configured || !firebaseReady ? (
        <Alert variant="warning" title="Firebase neconfigurat">
          <p>Completează configurarea Firebase pentru a putea reseta parola.</p>
        </Alert>
      ) : null}

      {formError ? (
        <Alert variant="error" title="Eroare">
          {formError}
        </Alert>
      ) : null}

      {sent ? (
        <Alert variant="success" title="E-mail trimis">
          <p>
            Dacă adresa există în sistem, vei primi instrucțiuni pentru resetarea parolei.
            Verifică și folderul Spam.
          </p>
        </Alert>
      ) : null}

      <form className="zs-stack zs-stack--md" onSubmit={onSubmit} noValidate>
        <Input
          label="E-mail"
          type="email"
          autoComplete="email"
          placeholder="nume@exemplu.ro"
          error={errors.email?.message}
          {...register('email')}
        />
        <Button type="submit" fullWidth loading={isSubmitting} disabled={!configured || !firebaseReady}>
          Trimite link de resetare
        </Button>
      </form>

      <p className="zs-auth-footer">
        <Link to={paths.login}>Înapoi la autentificare</Link>
      </p>
    </Card>
  )
}
