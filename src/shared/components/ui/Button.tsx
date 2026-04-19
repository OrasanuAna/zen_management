import clsx from 'clsx'
import { type ButtonHTMLAttributes, type ReactNode } from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'

type ButtonProps = {
  variant?: ButtonVariant
  fullWidth?: boolean
  loading?: boolean
  children: ReactNode
} & ButtonHTMLAttributes<HTMLButtonElement>

export function Button({
  variant = 'primary',
  fullWidth,
  loading,
  children,
  className,
  disabled,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={clsx(
        'zs-button',
        variant !== 'primary' && `zs-button--${variant}`,
        fullWidth && 'zs-button--block',
        loading && 'zs-button--loading',
        className,
      )}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? <span className="zs-button__spinner" aria-hidden /> : null}
      <span className={clsx(loading && 'zs-button__text--hidden')}>{children}</span>
    </button>
  )
}
