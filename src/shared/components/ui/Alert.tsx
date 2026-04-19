import clsx from 'clsx'
import { type HTMLAttributes, type ReactNode } from 'react'

type AlertVariant = 'info' | 'success' | 'warning' | 'error'

type AlertProps = {
  variant?: AlertVariant
  title?: string
  children: ReactNode
} & HTMLAttributes<HTMLDivElement>

export function Alert({ variant = 'info', title, children, className, ...rest }: AlertProps) {
  return (
    <div
      role="alert"
      className={clsx('zs-alert', variant !== 'info' && `zs-alert--${variant}`, className)}
      {...rest}
    >
      {title ? <strong className="zs-alert__title">{title}</strong> : null}
      <div className="zs-alert__body">{children}</div>
    </div>
  )
}
