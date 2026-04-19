import { z } from 'zod'
import { TaskStatus } from '@/shared/types/entities'

const statusEnum = z.enum([TaskStatus.PENDING, TaskStatus.COMPLETED, TaskStatus.CANCELLED])

export const taskFormSchema = z.object({
  title: z.string().min(1, 'Introdu titlul sarcinii.'),
  description: z.string().max(2000, 'Descrierea este prea lungă.').optional(),
  dueAt: z.string(),
  assignedToEmployeeId: z.string().optional(),
  status: statusEnum,
})

export type TaskFormValues = z.infer<typeof taskFormSchema>
