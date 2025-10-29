import { useEffect, useState } from 'react'
import Header from './components/Header'
import CategorySelection from './components/CategorySelection'
import ReportBuilderForm from './components/ReportBuilderForm'
import GlobalLoader from './components/GlobalLoader'
import { Toaster } from 'react-hot-toast'
import type { Category } from './types'
import { fetchCategories } from './api/reportBuilder'

function App() {
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [hasCreatedReport, setHasCreatedReport] = useState<boolean>(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const cats = await fetchCategories()
        setCategories(cats)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const fetchAndSetCategories = async () => {
    try {
      const cats = await fetchCategories()
      setCategories(cats)
    } catch (err) {
      // don't surface to UI here; keep current categories
      console.error('Failed to refresh categories', err)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-500 text-xl">{error}</div>
      </div>
    )
  }

  return (
    <>
      <Toaster position="bottom-right" reverseOrder={false} />
      <GlobalLoader isLoading={loading} />
      <main className="min-h-screen bg-slate-950 bg-[radial-gradient(circle_at_top,_#1f284a55,_transparent_65%)] py-12 pb-40 text-slate-200">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 sm:px-6 lg:px-8">
          <Header />
          
          {!hasCreatedReport && (
            <CategorySelection
              categories={categories}
              selectedCategoryId={selectedCategoryId}
              onCategorySelect={(id: string) => setSelectedCategoryId(id)}
              onCategoryChanged={fetchAndSetCategories}
              onReportCreated={() => setHasCreatedReport(true)}
            />
          )}

          {hasCreatedReport && (
            <ReportBuilderForm
              categories={categories}
              selectedCategoryId={selectedCategoryId}
              setSelectedCategoryId={setSelectedCategoryId}
              loading={loading}
            />
          )}
        </div>
      </main>
    </>
  )
}

export default App
