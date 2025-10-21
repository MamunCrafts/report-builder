import type { ReactNode } from 'react'

type FieldGroupProps = {
  label: string
  children: ReactNode
}

export default function FieldGroup({ label, children }: FieldGroupProps) {
  return (
    <label className="flex flex-col gap-2 text-sm">
      <span className="font-medium text-slate-300">{label}</span>
      {children}
    </label>
  )
}
