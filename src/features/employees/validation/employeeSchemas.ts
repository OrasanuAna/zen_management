import { z } from 'zod'
import { EmployeeRole, RestaurantZone } from '@/shared/types/entities'

const roleEnum = z.enum([
  EmployeeRole.WAITER,
  EmployeeRole.HOST,
  EmployeeRole.BARTENDER,
  EmployeeRole.CHEF,
  EmployeeRole.MANAGER,
])

const zoneEnum = z.enum([
  RestaurantZone.DINING,
  RestaurantZone.BAR,
  RestaurantZone.TERRACE,
  RestaurantZone.KITCHEN,
])

export const employeeFormSchema = z.object({
  fullName: z.string().min(2, 'Numele trebuie să aibă cel puțin 2 caractere.'),
  email: z.string().trim().refine((v) => v === '' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), {
    message: 'E-mail invalid.',
  }),
  phone: z.string().max(40, 'Telefonul este prea lung.'),
  role: roleEnum,
  zone: zoneEnum,
  isActive: z.boolean(),
})

export type EmployeeFormValues = z.infer<typeof employeeFormSchema>
