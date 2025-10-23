import type { ReactNode } from 'react'
import type { MouseEventHandler } from 'react'

type IconButtonProps = {
  label?: string
  children: ReactNode
  variant?: 'ghost' | 'danger'
  onClick?: MouseEventHandler<HTMLButtonElement>
  disabled?: boolean
  className?: string
}

export default function IconButton({ label, children, variant = 'ghost', onClick, disabled = false, className = '' }: IconButtonProps) {
  const baseClasses =
    'inline-flex size-8 items-center justify-center rounded-lg border text-xs font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950'

  const variantClasses =
    variant === 'danger'
      ? 'border-rose-600/60 text-rose-300 hover:bg-rose-600/10 focus-visible:ring-rose-400/50'
      : 'border-slate-700 text-slate-300 hover:bg-slate-800 focus-visible:ring-slate-600/60'

  const disabledClasses = disabled
    ? 'cursor-not-allowed opacity-40 hover:bg-transparent focus-visible:ring-0'
    : ''

  return (
    <button
      type="button"
      aria-label={label}
      className={`${baseClasses} ${variantClasses} ${disabledClasses} ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      <span aria-hidden>{children}</span>
    </button>
  )
}
