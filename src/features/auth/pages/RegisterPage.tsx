import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { paths } from '@/app/router/paths'
import { useAuth } from '@/app/providers/AuthProvider'
import { isFirebaseConfigured } from '@/config/firebase'
import { registerSchema, type RegisterFormValues } from '@/features/auth/validation/authSchemas'
import { Alert } from '@/shared/components/ui/Alert'
import { Button } from '@/shared/components/ui/Button'
import { Card } from '@/shared/components/ui/Card'
import { Input } from '@/shared/components/ui/Input'

export function RegisterPage() {
  const { signUp, firebaseReady } = useAuth()
  const navigate = useNavigate()
  const [formError, setFormError] = useState<string | null>(null)
  const configured = isFirebaseConfigured()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      displayName: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  })

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null)
    try {
      await signUp(values.email, values.password, values.displayName)
      navigate(paths.dashboard, { replace: true })
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Înregistrare eșuată.')
    }
  })

  return (
    <Card title="Înregistrare" subtitle="Creează un cont de manager">
      {!configured || !firebaseReady ? (
        <Alert variant="warning" title="Firebase neconfigurat">
          <p>
            Configurează variabilele <code>VITE_FIREBASE_*</code> în <code>.env</code> înainte de a
            crea un cont.
          </p>
        </Alert>
      ) : null}

      {formError ? (
        <Alert variant="error" title="Nu am putut crea contul">
          {formError}
        </Alert>
      ) : null}

      <form className="zs-stack zs-stack--md" onSubmit={onSubmit} noValidate>
        <Input
          label="Nume afișat"
          autoComplete="name"
          placeholder="ex. Maria Ionescu"
          error={errors.displayName?.message}
          {...register('displayName')}
        />
        <Input
          label="E-mail"
          type="email"
          autoComplete="email"
          placeholder="nume@exemplu.ro"
          error={errors.email?.message}
          {...register('email')}
        />
        <Input
          label="Parolă"
          type="password"
          autoComplete="new-password"
          error={errors.password?.message}
          {...register('password')}
        />
        <Input
          label="Confirmă parola"
          type="password"
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />
        <Button type="submit" fullWidth loading={isSubmitting} disabled={!configured || !firebaseReady}>
          Creează cont
        </Button>
      </form>

      <p className="zs-auth-footer">
        Ai deja cont? <Link to={paths.login}>Autentifică-te</Link>
      </p>
    </Card>
  )
}
