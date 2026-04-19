import clsx from 'clsx'
import { forwardRef, type TextareaHTMLAttributes } from 'react'

type TextareaProps = {
  label: string
  error?: string
  hint?: string
} & TextareaHTMLAttributes<HTMLTextAreaElement>

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, error, hint, className, id, name, rows = 4, ...rest },
  ref,
) {
  const areaId = id ?? name ?? label.replace(/\s+/g, '-').toLowerCase()
  return (
    <div className="zs-field">
      <label className="zs-label" htmlFor={areaId}>
        {label}
      </label>
      <textarea
        ref={ref}
        id={areaId}
        name={name}
        rows={rows}
        className={clsx('zs-textarea', error && 'zs-textarea--error', className)}
        aria-invalid={Boolean(error)}
        aria-describedby={
          error ? `${areaId}-error` : hint ? `${areaId}-hint` : undefined
        }
        {...rest}
      />
      {hint && !error ? (
        <p className="zs-hint" id={`${areaId}-hint`}>
          {hint}
        </p>
      ) : null}
      {error ? (
        <p className="zs-error" id={`${areaId}-error`} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
})
