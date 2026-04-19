import clsx from 'clsx'
import { type HTMLAttributes, type ReactNode } from 'react'

type CardProps = {
  title?: string
  subtitle?: string
  actions?: ReactNode
  children: ReactNode
} & HTMLAttributes<HTMLDivElement>

export function Card({ title, subtitle, actions, children, className, ...rest }: CardProps) {
  return (
    <section className={clsx('zs-card', className)} {...rest}>
      {(title || subtitle || actions) && (
        <header className="zs-card__header">
          <div>
            {title ? <h2 className="zs-card__title">{title}</h2> : null}
            {subtitle ? <p className="zs-card__subtitle">{subtitle}</p> : null}
          </div>
          {actions ? <div className="zs-card__actions">{actions}</div> : null}
        </header>
      )}
      <div className="zs-card__body">{children}</div>
    </section>
  )
}
