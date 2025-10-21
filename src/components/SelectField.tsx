type SelectFieldProps = {
  name: string
  options: string[]
  defaultValue?: string
  value?: string
  onChange?: (value: string) => void
  disabled?: boolean
  placeholder?: string
}

export default function SelectField({
  name,
  options,
  defaultValue,
  value,
  onChange,
  disabled = false,
  placeholder = 'Select an option',
}: SelectFieldProps) {
  // If no value or defaultValue is provided, use empty string
  const selectionProps =
    value !== undefined
      ? { value }
      : { defaultValue: defaultValue || '' }

  return (
    <select
      name={name}
      {...selectionProps}
      disabled={disabled}
      onChange={(event) => onChange?.(event.target.value)}
      className="w-full rounded-lg border border-slate-800 bg-slate-950/80 px-3 py-2 text-sm text-slate-200 shadow-inner shadow-slate-950/40 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/40 disabled:cursor-not-allowed disabled:border-slate-800/60 disabled:bg-slate-900/60 disabled:text-slate-500"
    >
      <option value="" disabled selected={!value && !defaultValue}>
        {placeholder}
      </option>
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  )
}
