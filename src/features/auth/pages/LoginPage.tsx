import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { paths } from '@/app/router/paths'
import { useAuth } from '@/app/providers/AuthProvider'
import { isFirebaseConfigured } from '@/config/firebase'
import { loginSchema, type LoginFormValues } from '@/features/auth/validation/authSchemas'
import { Alert } from '@/shared/components/ui/Alert'
import { Button } from '@/shared/components/ui/Button'
import { Card } from '@/shared/components/ui/Card'
import { Input } from '@/shared/components/ui/Input'

export function LoginPage() {
  const { signIn, firebaseReady } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from ?? paths.dashboard
  const [formError, setFormError] = useState<string | null>(null)
  const configured = isFirebaseConfigured()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null)
    try {
      await signIn(values.email, values.password)
      navigate(from, { replace: true })
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Autentificare eșuată.')
    }
  })

  return (
    <Card title="Autentificare" subtitle="Acces pentru manageri Zen Sushi SRL">
      {!configured || !firebaseReady ? (
        <Alert variant="warning" title="Firebase neconfigurat">
          <p>
            Creează fișierul <code>.env</code> din <code>.env.example</code> și completează
            cheile din consola Firebase. Fără aceste variabile, autentificarea nu funcționează.
          </p>
        </Alert>
      ) : null}

      {formError ? (
        <Alert variant="error" title="Nu te-am putut autentifica">
          {formError}
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
        <Input
          label="Parolă"
          type="password"
          autoComplete="current-password"
          error={errors.password?.message}
          {...register('password')}
        />
        <div className="zs-auth-links">
          <Link className="zs-link" to={paths.forgotPassword}>
            Ai uitat parola?
          </Link>
        </div>
        <Button type="submit" fullWidth loading={isSubmitting} disabled={!configured || !firebaseReady}>
          Intră în cont
        </Button>
      </form>

      <p className="zs-auth-footer">
        Nu ai cont? <Link to={paths.register}>Creează cont de manager</Link>
      </p>
    </Card>
  )
}
