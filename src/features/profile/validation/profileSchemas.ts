import { z } from 'zod'

export const profileFormSchema = z.object({
  displayName: z.string().min(2, 'Numele trebuie să aibă cel puțin 2 caractere.'),
  phone: z
    .string()
    .max(40, 'Telefonul nu poate depăși 40 de caractere.')
    .optional(),
})

export type ProfileFormValues = z.infer<typeof profileFormSchema>

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Introdu parola curentă.'),
    newPassword: z.string().min(6, 'Parola nouă trebuie să aibă cel puțin 6 caractere.'),
    confirmPassword: z.string().min(1, 'Confirmă parola nouă.'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Parolele nu coincid.',
    path: ['confirmPassword'],
  })

export type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>
