import { ProcedureRunScreen } from '@/features/procedures/components/ProcedureRunScreen'
import { ProcedureType } from '@/shared/types/entities'

export function ClosingProcedurePage() {
  return (
    <ProcedureRunScreen
      type={ProcedureType.CLOSING}
      title="Procedură închidere"
      description="Închidere operațională — casă, curățenie, depozitare și securitate."
    />
  )
}
