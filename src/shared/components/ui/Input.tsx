import clsx from 'clsx'
import { forwardRef, type InputHTMLAttributes } from 'react'

type InputProps = {
  label: string
  error?: string
  hint?: string
} & InputHTMLAttributes<HTMLInputElement>

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, label, error, hint, id, name, ...rest },
  ref,
) {
  const inputId = id ?? name ?? label.replace(/\s+/g, '-').toLowerCase()
  return (
    <div className="zs-field">
      <label className="zs-label" htmlFor={inputId}>
        {label}
      </label>
      <input
        ref={ref}
        id={inputId}
        name={name}
        className={clsx('zs-input', error && 'zs-input--error', className)}
        aria-invalid={Boolean(error)}
        aria-describedby={
          error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined
        }
        {...rest}
      />
      {hint && !error ? (
        <p className="zs-hint" id={`${inputId}-hint`}>
          {hint}
        </p>
      ) : null}
      {error ? (
        <p className="zs-error" id={`${inputId}-error`} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
})
