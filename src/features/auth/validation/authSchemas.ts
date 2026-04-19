import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().min(1, 'Introdu adresa de e-mail.').email('E-mail invalid.'),
  password: z.string().min(1, 'Introdu parola.'),
})

export type LoginFormValues = z.infer<typeof loginSchema>

export const registerSchema = z
  .object({
    displayName: z.string().min(2, 'Numele trebuie să aibă cel puțin 2 caractere.'),
    email: z.string().min(1, 'Introdu adresa de e-mail.').email('E-mail invalid.'),
    password: z.string().min(6, 'Parola trebuie să aibă cel puțin 6 caractere.'),
    confirmPassword: z.string().min(1, 'Confirmă parola.'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Parolele nu coincid.',
    path: ['confirmPassword'],
  })

export type RegisterFormValues = z.infer<typeof registerSchema>

export const forgotPasswordSchema = z.object({
  email: z.string().min(1, 'Introdu adresa de e-mail.').email('E-mail invalid.'),
})

export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>
