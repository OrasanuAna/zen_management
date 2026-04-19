import type { EmployeeRole, RestaurantZone } from '@/shared/types/entities'
import { EmployeeRole as ER, RestaurantZone as RZ } from '@/shared/types/entities'

export const EMPLOYEE_ROLE_LABELS: Record<EmployeeRole, string> = {
  [ER.WAITER]: 'Ospătar',
  [ER.HOST]: 'Host / recepție',
  [ER.BARTENDER]: 'Barman',
  [ER.CHEF]: 'Bucătar',
  [ER.MANAGER]: 'Manager sală',
}

export const RESTAURANT_ZONE_LABELS: Record<RestaurantZone, string> = {
  [RZ.DINING]: 'Salon',
  [RZ.BAR]: 'Bar',
  [RZ.TERRACE]: 'Terasă',
  [RZ.KITCHEN]: 'Bucătărie',
}

export const EMPLOYEE_ROLE_OPTIONS = Object.values(ER).map((value) => ({
  value,
  label: EMPLOYEE_ROLE_LABELS[value],
}))

export const RESTAURANT_ZONE_OPTIONS = Object.values(RZ).map((value) => ({
  value,
  label: RESTAURANT_ZONE_LABELS[value],
}))
