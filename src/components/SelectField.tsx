type OptionItem = { value: string; label?: string }

type SelectFieldProps = {
  name?: string
  options: string[] | OptionItem[]
  defaultValue?: string
  value?: string
  onChange?: (value: string) => void
  disabled?: boolean
  placeholder?: string
  label?: string
}

export default function SelectField({
  name,
  options,
  defaultValue,
  value,
  onChange,
  disabled = false,
  placeholder = 'Select an option',
  label,
}: SelectFieldProps) {
  // normalize options to simple {value,label}[]
  const normalized: OptionItem[] = Array.isArray(options)
    ? (options as OptionItem[]).map((o) =>
        typeof o === 'string' ? { value: o, label: o } : { value: o.value, label: o.label ?? o.value },
      )
    : []

  const selectionProps = value !== undefined ? { value } : { defaultValue: defaultValue || '' }

  const selectElement = (
    <select
      name={name}
      {...selectionProps}
      disabled={disabled}
      onChange={(event) => onChange?.(event.target.value)}
      className="w-full rounded-lg border border-slate-800 bg-slate-950/80 px-3 py-2 text-sm text-slate-200 shadow-inner shadow-slate-950/40 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/40 disabled:cursor-not-allowed disabled:border-slate-800/60 disabled:bg-slate-900/60 disabled:text-slate-500"
    >
      <option value="" disabled={true}>
        {placeholder}
      </option>
      {normalized.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label ?? option.value}
        </option>
      ))}
    </select>
  )

  if (label) {
    return (
      <label className="flex flex-col gap-2 text-sm">
        <span className="font-medium text-slate-300">{label}</span>
        {selectElement}
      </label>
    )
  }

  return selectElement
}
