import clsx from 'clsx'
import { forwardRef, type SelectHTMLAttributes } from 'react'

type SelectOption = { value: string; label: string }

type SelectProps = {
  label: string
  error?: string
  options: SelectOption[]
} & SelectHTMLAttributes<HTMLSelectElement>

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, error, options, className, id, name, ...rest },
  ref,
) {
  const selectId = id ?? name ?? label.replace(/\s+/g, '-').toLowerCase()
  return (
    <div className="zs-field">
      <label className="zs-label" htmlFor={selectId}>
        {label}
      </label>
      <select
        ref={ref}
        id={selectId}
        name={name}
        className={clsx('zs-select', error && 'zs-select--error', className)}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${selectId}-error` : undefined}
        {...rest}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error ? (
        <p className="zs-error" id={`${selectId}-error`} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
})
