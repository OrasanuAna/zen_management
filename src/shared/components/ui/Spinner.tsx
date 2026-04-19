import clsx from 'clsx'

type SpinnerProps = {
  label?: string
  className?: string
}

export function Spinner({ label, className }: SpinnerProps) {
  return (
    <div className={clsx('zs-spinner-wrap', className)} role="status" aria-live="polite">
      <span className="zs-spinner" aria-hidden />
      {label ? <p className="zs-spinner__label">{label}</p> : null}
    </div>
  )
}
