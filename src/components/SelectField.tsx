type SelectFieldProps = {
  name: string
  options: string[]
  defaultValue?: string
}

export default function SelectField({ name, options, defaultValue }: SelectFieldProps) {
  return (
    <select
      name={name}
      defaultValue={defaultValue}
      className="w-full rounded-lg border border-slate-800 bg-slate-950/80 px-3 py-2 text-sm text-slate-200 shadow-inner shadow-slate-950/40 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/40"
    >
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  )
}
