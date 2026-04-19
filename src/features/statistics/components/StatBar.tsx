import clsx from 'clsx'

type StatBarProps = {
  label: string
  value: number
  max: number
  className?: string
  variant?: 'default' | 'accent' | 'muted'
}

export function StatBar({ label, value, max, className, variant = 'default' }: StatBarProps) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0
  return (
    <div className={clsx('zs-stat-bar', className)}>
      <div className="zs-stat-bar__head">
        <span className="zs-stat-bar__label">{label}</span>
        <span className="zs-stat-bar__value">{value}</span>
      </div>
      <div className="zs-stat-bar__track" aria-hidden>
        <div
          className={clsx(
            'zs-stat-bar__fill',
            variant === 'accent' && 'zs-stat-bar__fill--accent',
            variant === 'muted' && 'zs-stat-bar__fill--muted',
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
