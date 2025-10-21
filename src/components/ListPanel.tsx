import type { KeyboardEvent, ReactNode } from 'react'
import IconButton from './IconButton.tsx'

type ListPanelProps = {
  title: string
  items: string[]
  numbered?: boolean
  withActions?: boolean
  onItemClick?: (item: string) => void
  selectedItems?: string[]
  emptyMessage?: string
  actionRenderer?: (item: string, index: number) => ReactNode
}

export default function ListPanel({
  title,
  items,
  numbered = false,
  withActions = false,
  onItemClick,
  selectedItems,
  emptyMessage = 'Nothing to display yet.',
  actionRenderer,
}: ListPanelProps) {
  const handleItemKeyDown = (event: KeyboardEvent<HTMLLIElement>, item: string) => {
    if (!onItemClick) return

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onItemClick(item)
    }
  }

  return (
    <div className="flex min-h-[14rem] flex-col rounded-2xl border border-slate-800 bg-slate-950/60 p-4 shadow-inner shadow-slate-950/40">
      <h3 className="text-sm font-semibold text-slate-200">{title}</h3>
      <ul className="mt-4 flex-1 space-y-2 overflow-y-auto pr-1 [&_*]:transition-colors">
        {items.length === 0 ? (
          <li className="rounded-lg border border-dashed border-slate-800 bg-slate-950/40 px-3 py-4 text-center text-xs text-slate-500">
            {emptyMessage}
          </li>
        ) : (
          items.map((item, index) => (
            <li
              key={`${title}-${item}-${index.toString()}`}
              role={onItemClick ? 'button' : undefined}
              tabIndex={onItemClick ? 0 : undefined}
              onClick={onItemClick ? () => onItemClick(item) : undefined}
              onKeyDown={(event) => handleItemKeyDown(event, item)}
              className={[
                'flex items-center justify-between rounded-xl border px-3 py-2 text-sm shadow-sm transition-colors',
                onItemClick ? 'cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400' : '',
                selectedItems?.includes(item)
                  ? 'border-sky-500/80 bg-sky-500/10 text-sky-100 shadow-sky-500/30 hover:border-sky-400/80'
                  : 'border-slate-800/80 bg-slate-950/80 text-slate-200 hover:border-slate-700',
              ].join(' ')}
            >
              <span className="flex items-center gap-2">
                {numbered && (
                  <span className="grid size-6 place-items-center rounded-full bg-slate-800 text-[11px] font-semibold text-slate-300">
                    {index + 1}
                  </span>
                )}
                {item}
              </span>
              {(actionRenderer || withActions) && (
                <div className="flex items-center gap-1.5">
                  {actionRenderer ? (
                    actionRenderer(item, index)
                  ) : (
                    <>
                      <IconButton label={`Move ${item} up`} variant="ghost">
                        Up
                      </IconButton>
                      <IconButton label={`Move ${item} down`} variant="ghost">
                        Dn
                      </IconButton>
                      <IconButton label={`Remove ${item}`} variant="danger">
                        X
                      </IconButton>
                    </>
                  )}
                </div>
              )}
            </li>
          ))
        )}
      </ul>
    </div>
  )
}
