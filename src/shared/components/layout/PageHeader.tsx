import clsx from 'clsx'
import { type ReactNode } from 'react'

type PageHeaderProps = {
  title: string
  description?: string
  actions?: ReactNode
  className?: string
}

export function PageHeader({ title, description, actions, className }: PageHeaderProps) {
  return (
    <header className={clsx('zs-page-header', className)}>
      <div>
        <h1 className="zs-page-header__title">{title}</h1>
        {description ? <p className="zs-page-header__desc">{description}</p> : null}
      </div>
      {actions ? <div className="zs-page-header__actions">{actions}</div> : null}
    </header>
  )
}
