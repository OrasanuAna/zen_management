import { ProcedureRunScreen } from '@/features/procedures/components/ProcedureRunScreen'
import { ProcedureType } from '@/shared/types/entities'

export function OpeningProcedurePage() {
  return (
    <ProcedureRunScreen
      type={ProcedureType.OPENING}
      title="Procedură deschidere"
      description="Checklist înainte de primii clienți — sală, bar, bucătărie și siguranță."
    />
  )
}
