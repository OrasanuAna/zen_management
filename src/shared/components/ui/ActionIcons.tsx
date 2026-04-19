import type { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement>

const common = (props: IconProps) => ({
  width: props.width ?? 20,
  height: props.height ?? 20,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.65,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true as const,
  ...props,
})

/** Editează */
export function IconPencil(props: IconProps) {
  const p = common(props)
  return (
    <svg {...p}>
      <path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5Z" />
    </svg>
  )
}

/** Șterge */
export function IconTrash(props: IconProps) {
  const p = common(props)
  return (
    <svg {...p}>
      <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14Z" />
      <path d="M10 11v6M14 11v6" />
    </svg>
  )
}

/** Marchează finalizată / finalizează */
export function IconCheckCircle(props: IconProps) {
  const p = common(props)
  return (
    <svg {...p}>
      <circle cx="12" cy="12" r="9" />
      <path d="m8.5 12.5 2.5 2.5 5-6" />
    </svg>
  )
}

/** Marchează nefinalizată */
export function IconCircle(props: IconProps) {
  const p = common(props)
  return (
    <svg {...p}>
      <circle cx="12" cy="12" r="9" />
    </svg>
  )
}

/** Revocă finalizarea procedurii */
export function IconUnlock(props: IconProps) {
  const p = common(props)
  return (
    <svg {...p}>
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 6.7-2.9" />
    </svg>
  )
}

/** Reîncarcă */
export function IconRefresh(props: IconProps) {
  const p = common(props)
  return (
    <svg {...p}>
      <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
      <path d="M3 16v4h4M21 8V4h-4" />
    </svg>
  )
}

/** Salvează */
export function IconSave(props: IconProps) {
  const p = common(props)
  return (
    <svg {...p}>
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z" />
      <path d="M17 21v-8H7v8M7 3v5h8" />
    </svg>
  )
}
