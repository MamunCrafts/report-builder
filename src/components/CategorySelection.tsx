import SectionCard from './common/SectionCard.tsx'
import type { Category } from '../types'

type CategorySelectionProps = {
  categories: Category[]
  selectedCategoryId: string
  onCategorySelect: (categoryId: string) => void
}

export default function CategorySelection({
  categories,
  selectedCategoryId,
  onCategorySelect,
}: CategorySelectionProps) {
  return (
    <SectionCard
      step={1}
      title="Select a Category"
      isNewButton={true}
      description="Choose the segment you want to manage reports for."
     
    >
      
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((category) => {
          const isSelected = category.id === selectedCategoryId

          return (
            <button
              key={category.id}
              type="button"
              aria-pressed={isSelected}
              onClick={() => onCategorySelect(category.id)}
              className={[
                'group relative flex h-full flex-col rounded-xl border px-5 py-4 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400',
                isSelected
                  ? 'border-sky-500/90 bg-gradient-to-br from-sky-500/20 via-slate-900/80 to-slate-950/90 shadow-lg shadow-sky-500/25'
                  : 'border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-900',
              ].join(' ')}
            >
              <span className="pointer-events-none absolute -top-3 left-5 inline-flex size-7 items-center justify-center rounded-full border border-slate-800 bg-slate-900 text-[11px] font-semibold text-slate-300 shadow shadow-slate-950/40">
                {category.reportCount}
              </span>
              <span className="text-lg font-semibold text-white">{category.name}</span>
            
             
              {isSelected && (
                <span className="pointer-events-none absolute right-4 top-4 inline-flex items-center rounded-full bg-sky-500 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-50">
                  Active
                </span>
              )}
            </button>
          )
        })}
      </div>
    </SectionCard>
  )
}
