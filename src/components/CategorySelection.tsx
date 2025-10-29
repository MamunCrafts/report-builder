import SectionCard from './common/SectionCard.tsx'
import { useState } from 'react'
import type { Category } from '../types'
import { createCategory, updateCategory, createReport } from '../api/reportBuilder'
import toast from 'react-hot-toast'

type CategorySelectionProps = {
  categories: Category[]
  selectedCategoryId: string
  onCategorySelect: (categoryId: string) => void
  onCategoryChanged?: () => void
  onReportCreated?: () => void
}

export default function CategorySelection({
  categories,
  selectedCategoryId,
  onCategorySelect,
  onCategoryChanged,
  onReportCreated,
}: CategorySelectionProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newName, setNewName] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null)

  const [isReportModalOpen, setIsReportModalOpen] = useState(false)
  const [newReportNameForCategory, setNewReportNameForCategory] = useState('')
  const [isReportSubmitting, setIsReportSubmitting] = useState(false)
  const [errorModalOpen, setErrorModalOpen] = useState(false)
  const [lastErrorMessage, setLastErrorMessage] = useState('')

  const openCreateModal = () => {
    setNewName('')
    setIsEditMode(false)
    setEditingCategoryId(null)
    setIsModalOpen(true)
  }

  const openEditModal = (category: Category) => {
    setIsEditMode(true)
    setEditingCategoryId(category.id)
    setNewName(category.name)
    setIsModalOpen(true)
  }

  const handleCreate = async () => {
    if (!newName.trim()) return
    try {
      setIsSubmitting(true)
      const created = await createCategory(newName.trim(), '')
      // select newly created category
      onCategorySelect(created.id)
      // close category modal and open report creation modal for this category
  setIsModalOpen(false)
  setNewReportNameForCategory('')
  setIsReportModalOpen(true)
  // notify parent to refresh categories
  onCategoryChanged?.()
    } catch (err) {
      console.error('Failed to create category', err)
      const message = err instanceof Error ? err.message : String(err)
      setLastErrorMessage(message)
      setErrorModalOpen(true)
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <SectionCard
        step={1}
        title="Select a Category"
        isNewButton={true}
        onNewClick={openCreateModal}
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
                onClick={() => {
                 
                    openEditModal(category)
               
                }}
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

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-lg bg-slate-900/90 p-6 shadow-lg border border-slate-700">
            <h3 className="mb-4 text-lg font-semibold text-slate-100">{isEditMode ? 'Edit Category' : 'Create Category'}</h3>
            <input
              className="w-full rounded border border-slate-700 bg-slate-800 px-3 py-2 mb-4 text-slate-100"
              value={newName}
              onChange={(e) => setNewName((e.target as HTMLInputElement).value)}
              placeholder="Category name"
            />
            <div className="flex justify-end gap-2">
              <button
                className="px-3 py-1 rounded bg-slate-700 text-slate-100"
                onClick={() => setIsModalOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                className="px-3 py-1 rounded bg-blue-600 text-white"
                onClick={async () => {
                  if (isEditMode && editingCategoryId) {
                    try {
                      setIsSubmitting(true)
                      const updated = await updateCategory(editingCategoryId, newName.trim(), '')
                      onCategorySelect(updated.id)
                      setIsModalOpen(false)
                      toast.success('Category updated')
                      onCategoryChanged?.()
                    } catch (err) {
                      console.error('Failed to update category', err)
                      const message = err instanceof Error ? err.message : String(err)
                      setLastErrorMessage(message)
                      setErrorModalOpen(true)
                      toast.error(message)
                    } finally {
                      setIsSubmitting(false)
                    }
                  } else {
                    await handleCreate()
                  }
                }}
                disabled={isSubmitting}
              >
                {isSubmitting ? (isEditMode ? 'Saving...' : 'Creating...') : isEditMode ? 'Save' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {isReportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-lg bg-slate-900/90 p-6 shadow-lg border border-slate-700">
            <h3 className="mb-4 text-lg font-semibold text-slate-100">Create Report</h3>
            <input
              className="w-full rounded border border-slate-700 bg-slate-800 px-3 py-2 mb-4 text-slate-100"
              value={newReportNameForCategory}
              onChange={(e) => setNewReportNameForCategory((e.target as HTMLInputElement).value)}
              placeholder="Report name"
            />
            <div className="flex justify-end gap-2">
              <button
                className="px-3 py-1 rounded bg-slate-700 text-slate-100"
                onClick={() => setIsReportModalOpen(false)}
                disabled={isReportSubmitting}
              >
                Cancel
              </button>
              <button
                className="px-3 py-1 rounded bg-blue-600 text-white"
                onClick={async () => {
                  if (!newReportNameForCategory.trim()) return
                  try {
                    setIsReportSubmitting(true)
                    // use currently selected category
                    const targetCategoryId = selectedCategoryId || categories[0]?.id || ''
                    await createReport(targetCategoryId, newReportNameForCategory.trim(), undefined, '')
                    toast.success('Report created')
                    setIsReportModalOpen(false)
                    // report creation may affect counts; refresh categories
                    onCategoryChanged?.()
                    // notify parent that report was created so it can show the report builder
                    onReportCreated?.()
                  } catch (err) {
                    console.error('Failed to create report', err)
                    const message = err instanceof Error ? err.message : String(err)
                    setLastErrorMessage(message)
                    setErrorModalOpen(true)
                    toast.error(message)
                  } finally {
                    setIsReportSubmitting(false)
                  }
                }}
                disabled={isReportSubmitting}
              >
                {isReportSubmitting ? 'Creating...' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {errorModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-2xl rounded-lg bg-slate-900/95 p-6 shadow-lg border border-slate-700">
            <h3 className="mb-3 text-lg font-semibold text-rose-400">Server error</h3>
            <p className="mb-4 text-sm text-slate-300">The server returned an unexpected response. Copy the text below and check your backend logs or base URL.</p>
            <pre className="max-h-64 overflow-auto whitespace-pre-wrap rounded border border-slate-800 bg-slate-800 p-3 text-xs text-slate-100">{lastErrorMessage}</pre>
            <div className="mt-4 flex justify-end gap-2">
              <button
                className="px-3 py-1 rounded bg-slate-700 text-slate-100"
                onClick={() => {
                  void navigator.clipboard?.writeText(lastErrorMessage || '')
                }}
              >
                Copy
              </button>
              <button
                className="px-3 py-1 rounded bg-rose-600 text-white"
                onClick={() => setErrorModalOpen(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
