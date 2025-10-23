import type { ReactNode } from 'react'

type ActionButtonProps = {
  children: ReactNode
  label?: string
  onClick?: () => void
  variant?: 'primary' | 'secondary' | 'danger' | 'info'
  size?: 'sm' | 'md'
  disabled?: boolean
}

export default function ActionButton({
  children,
  label,
  onClick,
  variant = 'secondary',
  size = 'md',
  disabled = false,
}: ActionButtonProps) {
  const baseClasses =
    'inline-flex items-center justify-center rounded-lg px-3 py-1.5 text-xs font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950'

  const variantClasses: Record<NonNullable<ActionButtonProps['variant']>, string> = {
    primary: 'bg-sky-600 text-white hover:bg-sky-500 focus-visible:ring-sky-300',
    secondary:
      'border border-slate-700 bg-slate-900/80 text-slate-200 hover:border-slate-600 focus-visible:ring-slate-500',
    danger: 'bg-rose-600 text-white hover:bg-rose-500 focus-visible:ring-rose-300',
    info: 'bg-indigo-600 text-white hover:bg-indigo-500 focus-visible:ring-indigo-300',
  }

  const sizeClasses = size === 'sm' ? 'px-2 py-1 text-xs' : ''

  const disabledClasses = disabled ? 'cursor-not-allowed opacity-60' : ''

  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses} ${disabledClasses}`}
    >
      {children}
    </button>
  )
}
