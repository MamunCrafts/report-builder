type StepBadgeProps = {
  step: number
}

export default function StepBadge({ step }: StepBadgeProps) {
  return (
    <span className="inline-flex size-8 items-center justify-center rounded-full border border-sky-500/80 bg-sky-500/10 text-sm font-semibold text-sky-300 shadow shadow-sky-500/20">
      {step}
    </span>
  )
}
