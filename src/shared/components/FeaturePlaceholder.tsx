import { Card } from '@/shared/components/ui/Card'
import { PageHeader } from '@/shared/components/layout/PageHeader'

type FeaturePlaceholderProps = {
  title: string
  description?: string
}

export function FeaturePlaceholder({ title, description }: FeaturePlaceholderProps) {
  return (
    <>
      <PageHeader title={title} description={description} />
      <Card>
        <p className="zs-muted">
          Acest modul este pregătit în structura aplicației și va fi dezvoltat în ordinea planificată
          (date Firestore, formulare, liste, rapoarte).
        </p>
      </Card>
    </>
  )
}
