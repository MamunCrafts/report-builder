import type { ReactNode } from 'react'
import StepBadge from './StepBadge.tsx'

type SectionCardProps = {
  title: string
  description?: string
  children: ReactNode
  footer?: ReactNode
  step?: number
}

export default function SectionCard({ title,  children, step }: SectionCardProps) {
  return (
    <section className="rounded-3xl border border-slate-800/60 bg-slate-900/70 p-6 shadow-2xl shadow-slate-950/40 sm:p-8">
      <div className="flex items-center justify-between gap-4 pb-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-3">
            {/* {typeof step === 'number' && <StepBadge step={step} />} */}
            <h2 className="text-xl font-semibold text-white sm:text-2xl">{title}</h2>
          </div>
          {/* {description && <p className="text-sm text-slate-400">{description}</p>} */}
        </div>
      </div>
      <div className="space-y-6">{children}</div>
      {/* {footer && <div className="mt-6 border-t border-slate-800/60 pt-6">{footer}</div>} */}
    </section>
  )
}
