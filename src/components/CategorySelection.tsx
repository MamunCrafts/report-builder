import SectionCard from './common/SectionCard.tsx'
import { useState } from 'react'
import type { Category } from '../types'
import {
  createCategory,
  updateCategory,
  createReport,
  fetchReportBuilderData,
  type ApiReport,
} from '../api/reportBuilder'
import toast from 'react-hot-toast'

type CategorySelectionProps = {
  categories: Category[]
  selectedCategoryId: string
  onCategorySelect: (categoryId: string) => void
  onCategoryChanged?: () => void
  onReportCreated?: () => void
  onReportExecute?: (categoryId: string, report: ApiReport) => void
  onReportEdit?: (categoryId: string, report: ApiReport) => void
  onReportDelete?: (categoryId: string, report: ApiReport) => void
}

export default function CategorySelection({
  categories,
  selectedCategoryId,
  onCategorySelect,
  onCategoryChanged,
  onReportCreated,
  onReportExecute,
  onReportEdit,
  onReportDelete,
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

  const [isReportsTableOpen, setIsReportsTableOpen] = useState(false)
  const [reportsTableCategory, setReportsTableCategory] = useState<Category | null>(null)
  const [isReportsTableLoading, setIsReportsTableLoading] = useState(false)
  const [reportsTableError, setReportsTableError] = useState<string | null>(null)
  const [reportCatalog, setReportCatalog] = useState<Record<string, ApiReport[]>>({})

  const openCreateModal = () => {
    setNewName('')
    setIsEditMode(false)
    setEditingCategoryId(null)
    setIsModalOpen(true)
  }

  const loadReportsCatalog = async () => {
    try {
      setIsReportsTableLoading(true)
      const data = await fetchReportBuilderData()
      const catalog = data?.reportCatalog ?? {}
      setReportCatalog(catalog)
      setReportsTableError(null)
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      setReportsTableError(message)
      toast.error(message)
    } finally {
      setIsReportsTableLoading(false)
    }
  }

  const openReportsTableForCategory = async (category: Category) => {
    onCategorySelect(category.id)
    setReportsTableCategory(category)
    setReportsTableError(null)
    setIsReportsTableOpen(true)
    await loadReportsCatalog()
  }

  const closeReportsTable = () => {
    setIsReportsTableOpen(false)
    setReportsTableCategory(null)
    setReportsTableError(null)
  }

  const openCreateReportModalForCategory = (category: Category) => {
    onCategorySelect(category.id)
    setNewReportNameForCategory('')
    closeReportsTable()
    setIsReportModalOpen(true)
  }

  const handleExecuteReport = (categoryId: string, report: ApiReport) => {
    onCategorySelect(categoryId)
    closeReportsTable()
    if (onReportExecute) {
      onReportExecute(categoryId, report)
      return
    }
    onReportCreated?.()
  }

  const handleEditReport = (categoryId: string, report: ApiReport) => {
    onCategorySelect(categoryId)
    closeReportsTable()
    if (onReportEdit) {
      onReportEdit(categoryId, report)
      return
    }
    onReportCreated?.()
    toast.success(`Loaded "${report.name}" for editing.`)
  }

  const handleDeleteReport = (categoryId: string, report: ApiReport) => {
    if (onReportDelete) {
      onReportDelete(categoryId, report)
      return
    }
    toast.error('Delete action is not configured.')
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
                  void openReportsTableForCategory(category)
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

      {isReportsTableOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-4xl rounded-lg border border-slate-700 bg-slate-900/95 p-6 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold text-slate-100">Reports Table</h3>
                {reportsTableCategory && (
                  <p className="mt-1 text-sm text-slate-400">
                    Category: <span className="text-slate-200">{reportsTableCategory.name}</span>
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                {reportsTableCategory && (
                  <button
                    className="rounded bg-blue-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-blue-700"
                    onClick={() => openCreateReportModalForCategory(reportsTableCategory)}
                    type="button"
                  >
                    Create New Reports
                  </button>
                )}
                <button
                  className="rounded bg-slate-700 px-3 py-1.5 text-sm font-medium text-slate-100 transition hover:bg-slate-600"
                  onClick={closeReportsTable}
                  type="button"
                >
                  Close
                </button>
              </div>
            </div>
            {isReportsTableLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="size-10 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
              </div>
            ) : reportsTableError ? (
              <div className="rounded-md border border-rose-500/40 bg-rose-500/10 p-4 text-sm text-rose-200">
                {reportsTableError}
              </div>
            ) : (
              <div className="overflow-hidden rounded-lg border border-slate-800 bg-slate-900/60">
                <table className="min-w-full divide-y divide-slate-800 text-sm">
                  <thead className="bg-slate-900/80 text-slate-300">
                    <tr className="uppercase tracking-wide text-xs">
                      <th className="px-4 py-3 text-left font-semibold">Report Name</th>
                      <th className="px-4 py-3 text-left font-semibold">Category Name</th>
                      <th className="px-4 py-3 text-left font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {reportsTableCategory &&
                    (reportCatalog[reportsTableCategory.id] ?? []).length > 0 ? (
                      (reportCatalog[reportsTableCategory.id] ?? []).map((report) => (
                        <tr key={report.id} className="bg-slate-900/40 text-slate-200">
                          <td className="px-4 py-3 font-medium">{report.name}</td>
                          <td className="px-4 py-3">{reportsTableCategory.name}</td>
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap gap-2">
                              <button
                                className="rounded bg-green-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-green-500"
                                onClick={() =>
                                  handleExecuteReport(reportsTableCategory.id, report)
                                }
                                type="button"
                              >
                                Execute
                              </button>
                              <button
                                className="rounded bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-500"
                                onClick={() =>
                                  handleEditReport(reportsTableCategory.id, report)
                                }
                                type="button"
                              >
                                EDIT
                              </button>
                              <button
                                className="rounded bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-rose-500"
                                onClick={() =>
                                  handleDeleteReport(reportsTableCategory.id, report)
                                }
                                type="button"
                              >
                                DELETE
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          className="px-4 py-6 text-center text-slate-400"
                          colSpan={3}
                        >
                          No reports found for this category.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
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
