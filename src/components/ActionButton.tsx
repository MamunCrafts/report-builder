import type { ReactNode } from 'react'

type ActionButtonProps = {
  children: ReactNode
  label: string
  tone: 'primary' | 'neutral' | 'danger' | 'info'
}

export default function ActionButton({ children, label, tone }: ActionButtonProps) {
  const baseClasses =
    'inline-flex items-center justify-center rounded-lg px-3 py-1.5 text-xs font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950'

  const toneClasses: Record<ActionButtonProps['tone'], string> = {
    primary: 'bg-sky-600 text-white hover:bg-sky-500 focus-visible:ring-sky-300',
    neutral:
      'border border-slate-700 bg-slate-900/80 text-slate-200 hover:border-slate-600 focus-visible:ring-slate-500',
    danger: 'bg-rose-600 text-white hover:bg-rose-500 focus-visible:ring-rose-300',
    info: 'bg-indigo-600 text-white hover:bg-indigo-500 focus-visible:ring-indigo-300',
  }

  return (
    <button type="button" aria-label={label} className={`${baseClasses} ${toneClasses[tone]}`}>
      {children}
    </button>
  )
}
