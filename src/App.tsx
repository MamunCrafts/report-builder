import { useEffect, useMemo, useState } from 'react'
import toast, { Toaster } from 'react-hot-toast'
import Header from './components/Header.tsx'
import CategorySelection from './components/CategorySelection.tsx'
import SectionCard from './components/SectionCard.tsx'
import FieldGroup from './components/FieldGroup.tsx'
import SelectField from './components/SelectField.tsx'
import ListPanel from './components/ListPanel.tsx'
import ActionButton from './components/ActionButton.tsx'
import IconButton from './components/IconButton.tsx'
import GlobalLoader from './components/GlobalLoader.tsx'
import {
  fetchReportBuilderData,
  fetchCategories,
  fetchDatabaseTables,
  fetchTableFields,
  saveReportConfiguration,
  type ReportBuilderData,
  type ApiDatabaseTable,
  type ReportBuilderConfiguration,
} from './api/reportBuilder.ts'
import type { Category } from './types'

function App() {
  const [data, setData] = useState<ReportBuilderData | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('')
  const [selectedTable, setSelectedTable] = useState<ApiDatabaseTable | null>(null)
  const [availableTables, setAvailableTables] = useState<ApiDatabaseTable[]>([])
  const [printFields, setPrintFields] = useState<string[]>([])
  const [sumFields, setSumFields] = useState<string[]>([])
  const [joinedPrintFields, setJoinedPrintFields] = useState<string[]>([])
  const [showJoinSections, setShowJoinSections] = useState<boolean>(false)
  const [filterConditions, setFilterConditions] = useState<
    Array<{ field: string; operator: string; value: string }>
  >([])
  const [aggregateFilters, setAggregateFilters] = useState<
    Array<{ field: string; operator: string; value: string }>
  >([])
  const [joinedAggregateFilters] = useState<
    Array<{ field: string; operator: string; value: string }>
  >([{ field: '', operator: '', value: '' }])
  const [sortOrders, setSortOrders] = useState<string[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [tableFields, setTableFields] = useState<string[]>([])
  const [tableFieldMap, setTableFieldMap] = useState<{ [tableName: string]: string[] }>({}) // cache
  const [isTableFieldsLoading, setIsTableFieldsLoading] = useState(false)
  const [joinQuery, setJoinQuery] = useState<string>('')
  const [joinedTableFields, setJoinedTableFields] = useState<string[]>([])
  const [isCreatingNewReport, setIsCreatingNewReport] = useState<boolean>(false)
  const [newCategoryName, setNewCategoryName] = useState<string>('')
  const [newReportName, setNewReportName] = useState<string>('')

  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
    [],
  )

  const formatDate = (value?: string | null) => {
    if (!value) return '—'
    try {
      return dateFormatter.format(new Date(value))
    } catch {
      return value
    }
  }

  const formatDataSourceLabel = (
    source?:
      | ReportBuilderData['dataSources'][number]
      | { label?: string; description?: string }
      | string,
  ) => {
    if (!source) {
      return ''
    }
    if (typeof source === 'string') {
      return source
    }
    const label = 'label' in source ? source.label ?? '' : ''
    if (!label) {
      return ''
    }
    const description = 'description' in source ? source.description : undefined
    return description ? `${label} — ${description}` : label
  }

  useEffect(() => {
    const controller = new AbortController()

    async function loadData() {
      try {
        setLoading(true)
        setError(null)
        const categoriesPromise = fetchCategories(controller.signal).catch((categoryError) => {
          if (categoryError instanceof Error && categoryError.name === 'AbortError') {
            throw categoryError
          }
          console.warn('Failed to load categories from API.', categoryError)
          return null
        })

        const tablesPromise = fetchDatabaseTables(controller.signal).catch((tableError) => {
          if (tableError instanceof Error && tableError.name === 'AbortError') {
            throw tableError
          }
          console.warn('Failed to load database tables from API.', tableError)
          return null
        })

        const [categoriesResponse, apiData, databaseTables] = await Promise.all([
          categoriesPromise,
          fetchReportBuilderData(controller.signal),
          tablesPromise,
        ])

        const dataSourcesList = Array.isArray(apiData.dataSources) ? apiData.dataSources : []
        const normalizedData: ReportBuilderData = {
          ...apiData,
          dataSources: dataSourcesList,
          categories: Array.isArray(apiData.categories) ? apiData.categories : [],
        }
        setData(normalizedData)

        const normalizeCategory = (item: {
          id: string
          name: string
          description?: string
          reportCount?: number
          productCount?: number
          displayOrder?: number
        }): Category => ({
          id: item.id,
          name: item.name,
          description: item.description ?? '',
          reportCount: item.reportCount ?? 0,
          productCount: item.productCount ?? 0,
          displayOrder: item.displayOrder ?? 0,
        })

        const primaryCategories =
          Array.isArray(categoriesResponse) && categoriesResponse.length > 0
            ? categoriesResponse.map(normalizeCategory)
            : []

        setCategories(primaryCategories)

        const initialCategoryId = primaryCategories[0]?.id ?? ''
        setSelectedCategoryId(initialCategoryId)
        
        // Use database tables if available
        const tables: ApiDatabaseTable[] =
          Array.isArray(databaseTables) && databaseTables.length > 0
            ? databaseTables
            : (dataSourcesList ?? []).map((source) => ({
                name: source.name,
                label: formatDataSourceLabel(source) || source.name,
              }))

        setAvailableTables(tables)

        // Don't auto-select table - let user choose
        setSelectedTable(null)
        setPrintFields([])
        setSumFields([])
        setJoinedPrintFields([])
        setFilterConditions([{ field: '', operator: '', value: '' }])
        setAggregateFilters([{ field: '', operator: '', value: '' }])
  
        setSortOrders([])
      } catch (fetchError) {
        if (fetchError instanceof Error && fetchError.name === 'AbortError') {
          return
        }
        console.error(fetchError)
        const errorMessage = fetchError instanceof Error ? fetchError.message : 'Failed to load data.'
        setError(errorMessage)
        toast.error(errorMessage)
      } finally {
        // Ensure loader is visible for at least 800ms for better UX
        const minLoadTime = 800
        const elapsed = Date.now() - loadStartTime
        const remainingTime = Math.max(0, minLoadTime - elapsed)
        
        setTimeout(() => {
          setLoading(false)
        }, remainingTime)
      }
    }

    const loadStartTime = Date.now()
    loadData()

    return () => controller.abort()
  }, [])

  // Clear field selections when table changes
  useEffect(() => {
    if (selectedTable) {
      setPrintFields([])
      setSumFields([])
    }
  }, [selectedTable])

  // When table changes, fetch its fields
  useEffect(() => {
    let ignore = false;
    if (!selectedTable) {
      setTableFields([])
      return
    }
    const cache = tableFieldMap[selectedTable.name]
    setIsTableFieldsLoading(true)
    if (cache) {
      setTableFields(cache)
      setIsTableFieldsLoading(false)
      return
    }
    const controller = new AbortController()
    fetchTableFields(selectedTable.name, controller.signal).then(fields => {
      if (!ignore) {
        const names = fields.map(f => f.name)
        setTableFields(names)
        setTableFieldMap((prev) => ({ ...prev, [selectedTable.name]: names }))
        setIsTableFieldsLoading(false)
      }
    }).catch(() => {
      if (!ignore) { setTableFields([]); setIsTableFieldsLoading(false) }
    })
    return () => { ignore = true; controller.abort(); setIsTableFieldsLoading(false) }
  }, [selectedTable])

  const reportCatalog = useMemo(() => data?.reportCatalog ?? {}, [data])
  
  // Table-specific available fields (not global!)
  const availableFields = useMemo(() => {
    if (!selectedTable) return []
    return tableFields
  }, [selectedTable, tableFields])
  
  const joinedAvailableFields = useMemo(() => {
    // Only show fields if user has entered a JOIN query
    if (joinedTableFields.length > 0) {
      return joinedTableFields
    }
    // Otherwise return empty array until JOIN query is entered
    return []
  }, [joinedTableFields])

  const selectedCategory = useMemo(
    () => categories.find((category) => category.id === selectedCategoryId),
    [categories, selectedCategoryId],
  )

  const reports = useMemo(
    () => reportCatalog[selectedCategoryId] ?? [],
    [reportCatalog, selectedCategoryId],
  )
  const selectedTables = selectedTable ? [selectedTable] : []
  
  // Helper values for ListPanel (which expects string arrays)
  const availableTableLabels = availableTables.map((table) => table.label)
  const selectedTableLabels = selectedTables.map((table) => table.label)
  
  const availableFieldOptions = useMemo(
    () => availableFields.filter((field) => !printFields.includes(field)),
    [availableFields, printFields],
  )
  const availableSummaryFieldOptions = useMemo(
    () => availableFields.filter((field) => !sumFields.includes(field)),
    [availableFields, sumFields],
  )
  const availableJoinedFieldOptions = useMemo(
    () => joinedAvailableFields.filter((field) => !joinedPrintFields.includes(field)),
    [joinedAvailableFields, joinedPrintFields],
  )

  const handleSelectTable = (tableLabel: string) => {
    const table = availableTables.find((t) => t.label === tableLabel)
    if (!table) return
    
    setSelectedTable((current) => 
      current?.name === table.name ? null : table
    )
  }

  const handleClearSelectedTable = () => {
    setSelectedTable(null)
  }

  const handleAddFieldToPrint = (fieldName: string) => {
    setPrintFields((current) => (current.includes(fieldName) ? current : [...current, fieldName]))
  }

  const handleRemoveFieldFromPrint = (fieldName: string) => {
    setPrintFields((current) => current.filter((field) => field !== fieldName))
  }

  const handleMoveField = (fieldName: string, direction: 'up' | 'down') => {
    setPrintFields((current) => {
      const index = current.indexOf(fieldName)
      if (index === -1) return current

      const targetIndex = direction === 'up' ? index - 1 : index + 1
      if (targetIndex < 0 || targetIndex >= current.length) {
        return current
      }

      const updated = [...current]
      const [removed] = updated.splice(index, 1)
      updated.splice(targetIndex, 0, removed)
      return updated
    })
  }

  const handleAddSummaryField = (fieldName: string) => {
    setSumFields((current) => (current.includes(fieldName) ? current : [...current, fieldName]))
  }

  const handleRemoveSummaryField = (fieldName: string) => {
    setSumFields((current) => current.filter((field) => field !== fieldName))
  }

  const handleMoveSummaryField = (fieldName: string, direction: 'up' | 'down') => {
    setSumFields((current) => {
      const index = current.indexOf(fieldName)
      if (index === -1) return current

      const targetIndex = direction === 'up' ? index - 1 : index + 1
      if (targetIndex < 0 || targetIndex >= current.length) {
        return current
      }

      const updated = [...current]
      const [removed] = updated.splice(index, 1)
      updated.splice(targetIndex, 0, removed)
      return updated
    })
  }

  const handleAddJoinedField = (fieldName: string) => {
    setJoinedPrintFields((current) =>
      current.includes(fieldName) ? current : [...current, fieldName],
    )
  }

  const handleRemoveJoinedField = (fieldName: string) => {
    setJoinedPrintFields((current) => current.filter((field) => field !== fieldName))
  }

  const handleMoveJoinedField = (fieldName: string, direction: 'up' | 'down') => {
    setJoinedPrintFields((current) => {
      const index = current.indexOf(fieldName)
      if (index === -1) return current

      const targetIndex = direction === 'up' ? index - 1 : index + 1
      if (targetIndex < 0 || targetIndex >= current.length) {
        return current
      }

      const updated = [...current]
      const [removed] = updated.splice(index, 1)
      updated.splice(targetIndex, 0, removed)
      return updated
    })
  }

  const toggleJoinSections = () => {
    setShowJoinSections((current) => !current)
  }

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategoryId(categoryId)
    // Close the new report form when a category is selected
    if (isCreatingNewReport) {
      setIsCreatingNewReport(false)
      setNewCategoryName('')
      setNewReportName('')
    }
  }

  const handleSaveReport = async () => {
    if (!newCategoryName.trim() || !newReportName.trim()) {
      const errorMsg = 'Please enter both category name and report name.'
      setError(errorMsg)
      toast.error(errorMsg)
      return
    }

    try {
      setLoading(true)
      setError(null)

      // Build configuration from current state
      const configuration: ReportBuilderConfiguration = {
        dataSource: selectedTable?.name ?? '',
        dataSourceLabel: selectedTable?.label ?? '',
        selectedTables: selectedTable ? [selectedTable.name] : [],
        selectedFields: printFields,
        printOrderFields: printFields,
        summaryFields: sumFields,
        sortFields: [], // TODO: Add sort field state
        sortOrders: [], // TODO: Add sort order state
        filterConditions: filterConditions,
        groupByFields: [], // TODO: Add grouping state
        aggregateFilters: aggregateFilters,
        joinQuery: joinQuery,
        joinedAvailableFields: joinedTableFields,
        joinedPrintOrderFields: joinedPrintFields,
        joinedGroupByFields: [], // TODO: Add joined grouping state
        joinedAggregateFilters: joinedAggregateFilters,
      }

      // Save report configuration
      await saveReportConfiguration(
        newCategoryName.trim(),
        newReportName.trim(),
        configuration,
      )

      // Show success message
      setError(null)
      toast.success(`Report "${newReportName}" created successfully!`)

      // Reset form
      setNewCategoryName('')
      setNewReportName('')
      setIsCreatingNewReport(false)

      // Reload categories
      const updatedCategories = await fetchCategories()
      setCategories(updatedCategories)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save report.'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  // Parse table names from JOIN query and fetch their fields
  useEffect(() => {
    const parseAndFetchJoinedTableFields = async () => {
      if (!joinQuery.trim()) {
        setJoinedTableFields([])
        return
      }

      // Extract table names from JOIN query
      // Matches patterns like: JOIN TableName, FROM TableName, etc.
      const tableNameRegex = /(?:JOIN|FROM)\s+([a-zA-Z_][a-zA-Z0-9_]*)/gi
      const matches = [...joinQuery.matchAll(tableNameRegex)]
      const tableNames = [...new Set(matches.map((match) => match[1]))]

      if (tableNames.length === 0) {
        setJoinedTableFields([])
        return
      }

      try {
        // Fetch fields for all tables found in the JOIN query
        const fieldsPromises = tableNames.map(async (tableName) => {
          // Check cache first
          if (tableFieldMap[tableName]) {
            return tableFieldMap[tableName]
          }

          // Fetch from API
          const fields = await fetchTableFields(tableName)
          const fieldNames = fields.map((f) => f.name)

          // Update cache
          setTableFieldMap((prev) => ({ ...prev, [tableName]: fieldNames }))

          return fieldNames
        })

        const allFields = await Promise.all(fieldsPromises)
        const combinedFields = [...new Set(allFields.flat())]
        setJoinedTableFields(combinedFields)
      } catch (err) {
        console.error('Error fetching joined table fields:', err)
        setJoinedTableFields([])
      }
    }

    parseAndFetchJoinedTableFields()
  }, [joinQuery, tableFieldMap])

  if (error) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-950 text-slate-200">
        <div className="max-w-md rounded-xl border border-rose-700/40 bg-rose-900/20 px-6 py-5 text-center shadow-lg shadow-rose-950/40">
          <p className="text-base font-semibold text-rose-200">Unable to load data</p>
          <p className="mt-2 text-sm text-rose-300">{error}</p>
          <p className="mt-4 text-xs text-rose-200/70">
            Please check the API server connection and reload the page.
          </p>
        </div>
      </main>
    )
  }

  return (
    <>
      <GlobalLoader isLoading={loading} />
      <Toaster position="bottom-right" reverseOrder={false} />
      <main className="min-h-screen bg-slate-950 bg-[radial-gradient(circle_at_top,_#1f284a55,_transparent_65%)] py-12 text-slate-200">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 sm:px-6 lg:px-8">
        <Header />

        <CategorySelection
          categories={categories}
          selectedCategoryId={selectedCategoryId}
          onCategorySelect={handleCategorySelect}
        />

        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => {
              setIsCreatingNewReport(true)
              setSelectedCategoryId('')
            }}
            className="inline-flex items-center gap-2 rounded-lg bg-green-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-green-500/30 transition hover:bg-green-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
          >
            + New Report
          </button>
        </div>

        {isCreatingNewReport && (
          <SectionCard
            step={1}
            title="Create New Report"
            description="Enter details for your new report category and name."
          >
            <div className="space-y-6">
              <FieldGroup label="New Category Name">
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="Enter category name"
                  className="w-full rounded-lg border border-slate-800 bg-slate-950/80 px-3 py-2 text-sm text-slate-200 shadow-inner shadow-slate-950/40 placeholder:text-slate-500 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/40"
                />
              </FieldGroup>
              <FieldGroup label="Report Name">
                <input
                  type="text"
                  value={newReportName}
                  onChange={(e) => setNewReportName(e.target.value)}
                  placeholder="Enter report name"
                  className="w-full rounded-lg border border-slate-800 bg-slate-950/80 px-3 py-2 text-sm text-slate-200 shadow-inner shadow-slate-950/40 placeholder:text-slate-500 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/40"
                />
              </FieldGroup>
            </div>
          </SectionCard>
        )}

        {!isCreatingNewReport && (
          <SectionCard
            step={2}
            title={`Category Reports: ${selectedCategory?.name ?? 'Select a category'}`}
            description="Review existing reports or manage them directly."
          >
          <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-950/40">
            <table className="min-w-full divide-y divide-slate-800 text-sm">
              <thead className="bg-slate-900/80 text-slate-400">
                <tr>
                  <th scope="col" className="px-4 py-3 text-left font-medium">
                    Name
                  </th>
                  <th scope="col" className="px-4 py-3 text-left font-medium">
                    Report Number
                  </th>
                  <th scope="col" className="px-4 py-3 text-left font-medium">
                    Status
                  </th>
                  <th scope="col" className="px-4 py-3 text-left font-medium">
                    Version
                  </th>
                  <th scope="col" className="px-4 py-3 text-left font-medium">
                    Last Updated
                  </th>
                  <th scope="col" className="px-4 py-3 text-left font-medium">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {reports.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center text-slate-500">
                      No reports available for this category yet.
                    </td>
                  </tr>
                ) : (
                  reports.map((report) => (
                    <tr key={report.id} className="bg-slate-950/60 hover:bg-slate-900/40">
                      <td className="px-4 py-3 font-medium text-slate-200">
                        <div className="flex flex-col gap-1">
                          <span className="text-slate-50">{report.name}</span>
                          <span className="text-xs font-normal text-slate-400">
                            {report.description ?? 'No description'}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-400">{report.number}</td>
                      <td className="px-4 py-3">
                        <span
                          className={[
                            'inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide',
                            report.status === 'active'
                              ? 'bg-emerald-500/15 text-emerald-300'
                              : report.status === 'draft'
                              ? 'bg-amber-500/15 text-amber-300'
                              : 'bg-slate-500/15 text-slate-300',
                          ].join(' ')}
                        >
                          {report.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-300">{report.version}</td>
                      <td className="px-4 py-3 text-slate-400">{formatDate(report.updatedAt)}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                          <ActionButton label={`Add version for ${report.name}`} tone="neutral">
                            Add
                          </ActionButton>
                          <ActionButton label={`Edit ${report.name}`} tone="primary">
                            Edit
                          </ActionButton>
                          <ActionButton label={`Delete ${report.name}`} tone="danger">
                            Delete
                          </ActionButton>
                          <ActionButton label={`Execute ${report.name}`} tone="info">
                            Execute
                          </ActionButton>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          </SectionCard>
        )}

        <SectionCard
          step={3}
          title="Data Source"
          description="Select the tables and fields that will feed this report."
        >
          <div className="grid gap-6 md:grid-cols-2">
            <ListPanel
              title="Available Tables"
              items={availableTableLabels}
              onItemClick={handleSelectTable}
              selectedItems={selectedTableLabels}
              emptyMessage="No tables available."
            />
            <ListPanel
              title="Selected Tables"
              items={selectedTableLabels}
              emptyMessage="Select a table from the left to include it."
              actionRenderer={(item) => (
                <IconButton
                  key={`${item}-remove`}
                  label={`Remove ${item}`}
                  variant="danger"
                  onClick={handleClearSelectedTable}
                >
                  X
                </IconButton>
              )}
            />
          </div>
        </SectionCard>

        <SectionCard
          step={4}
          title="Select Fields & Print Order"
          description="Arrange the fields that will appear in your report."
        >
          <div className="grid gap-6 md:grid-cols-2">
            <ListPanel
              title="Available Fields"
              items={availableFieldOptions}
              onItemClick={handleAddFieldToPrint}
              emptyMessage={
                !selectedTable
                  ? 'Please select a table first.'
                  : availableFieldOptions.length === 0 && printFields.length > 0
                  ? 'All fields are already selected.'
                  : 'No fields available for this table.'
              }
              loading={isTableFieldsLoading}
            />
            <ListPanel
              title="Fields to Print (In Order)"
              items={printFields}
              numbered
              actionRenderer={(item, index) => (
                <>
                  <IconButton
                    label={`Move ${item} up`}
                    variant="ghost"
                    onClick={() => handleMoveField(item, 'up')}
                    disabled={index === 0}
                  >
                    Up
                  </IconButton>
                  <IconButton
                    label={`Move ${item} down`}
                    variant="ghost"
                    onClick={() => handleMoveField(item, 'down')}
                    disabled={index === printFields.length - 1}
                  >
                    Dn
                  </IconButton>
                  <IconButton
                    label={`Remove ${item}`}
                    variant="danger"
                    onClick={() => handleRemoveFieldFromPrint(item)}
                  >
                    X
                  </IconButton>
                </>
              )}
            />
          </div>
        </SectionCard>

        <SectionCard
          step={5}
          title="Select Fields to Sum"
          description="Choose numeric fields that should be aggregated."
        >
          <div className="grid gap-6 md:grid-cols-2">
            <ListPanel
              title="Available Fields"
              items={availableSummaryFieldOptions}
              onItemClick={handleAddSummaryField}
              emptyMessage={
                !selectedTable
                  ? 'Please select a table first.'
                  : availableSummaryFieldOptions.length === 0 && sumFields.length > 0
                  ? 'All fields are currently selected to sum.'
                  : 'No fields available for this table.'
              }
            />
            <ListPanel
              title="Fields to Sum"
              items={sumFields}
              numbered
              emptyMessage="Select a field from the left to add it."
              actionRenderer={(item, index) => (
                <>
                  <IconButton
                    label={`Move ${item} up`}
                    variant="ghost"
                    onClick={() => handleMoveSummaryField(item, 'up')}
                    disabled={index === 0}
                  >
                    Up
                  </IconButton>
                  <IconButton
                    label={`Move ${item} down`}
                    variant="ghost"
                    onClick={() => handleMoveSummaryField(item, 'down')}
                    disabled={index === sumFields.length - 1}
                  >
                    Dn
                  </IconButton>
                  <IconButton
                    label={`Remove ${item}`}
                    variant="danger"
                    onClick={() => handleRemoveSummaryField(item)}
                  >
                    X
                  </IconButton>
                </>
              )}
            />
          </div>
        </SectionCard>

        <SectionCard
          step={6}
          title="Select Sort"
          description="Define the default ordering of your report output."
        >
          <div className="grid gap-6 md:grid-cols-2">
            <FieldGroup label="Sort Field">
              <SelectField
                name="sort-field"
                placeholder="Select a field to sort by"
                options={availableFields} // <-- Only per-table API fields
              />
            </FieldGroup>
            <FieldGroup label="Sort Order">
              <SelectField
                name="sort-order"
                placeholder="Select sort order"
                options={sortOrders.length > 0 ? sortOrders : ['Ascending', 'Descending']}
              />
            </FieldGroup>
          </div>
        </SectionCard>

        <SectionCard
          step={7}
          title="Select Filters"
          description="Add conditions to limit the dataset before summarization."
          footer={
            <div className="flex justify-end">
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-sm font-medium text-slate-200 transition hover:border-slate-600 hover:bg-slate-900"
              >
                + Add Condition
              </button>
            </div>
          }
        >
          <div className="space-y-3">
            {filterConditions.map((condition, index) => (
              <div
                key={`${condition.field}-${index.toString()}`}
                className="grid gap-3 rounded-xl border border-slate-800 bg-slate-950/60 p-4 md:grid-cols-[minmax(0,1fr),minmax(0,1fr),minmax(0,1fr),auto] md:items-center"
              >
                <SelectField
                  name={`filter-field-${index.toString()}`}
                  placeholder="Select field"
                  options={availableFields} // <-- Only API field list
                />
                <SelectField
                  name={`filter-operator-${index.toString()}`}
                  placeholder="Select operator"
                  options={['equal to', 'not equal to', 'greater than', 'less than']}
                />
                <input
                  type="text"
                  placeholder="Enter value"
                  className="w-full rounded-lg border border-slate-800 bg-slate-950/80 px-3 py-2 text-sm text-slate-200 shadow-inner shadow-slate-950/40 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/40"
                />
                <ActionButton label={`Remove filter condition ${index + 1}`} tone="danger">
                  Remove
                </ActionButton>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard
          step={8}
          title="Grouping & Summarization"
          description="Group records and apply aggregate functions."
          footer={
            <div className="flex justify-between">
              <label className="flex items-center gap-2 text-xs font-medium text-slate-400">
                <input
                  type="checkbox"
                  defaultChecked
                  className="size-4 rounded border border-slate-700 bg-slate-950 text-sky-500 focus:ring-2 focus:ring-sky-500/50"
                />
                Show Groups Only
              </label>
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-sm font-medium text-slate-200 transition hover:border-slate-600 hover:bg-slate-900"
              >
                + Add
              </button>
            </div>
          }
        >
          <div className="grid gap-4 md:grid-cols-[minmax(0,1fr),minmax(0,1fr),auto] md:items-center">
            <FieldGroup label="Group By (1)">
              <SelectField
                name="group-by"
                placeholder="Select field to group by"
                options={availableFields} // <-- Only API field list
              />
            </FieldGroup>
            <FieldGroup label="Fields to Summarize">
              <SelectField
                name="summary-field"
                placeholder="Select field to summarize"
                options={availableFields} // <-- Only API field list, not previously filtered set
              />
            </FieldGroup>
            <ActionButton label="Remove grouping rule" tone="danger">
              Remove
            </ActionButton>
          </div>
        </SectionCard>

        <SectionCard
          step={9}
          title="Aggregate Filters (HAVING)"
          description="Filter aggregated data after grouping has been applied."
          footer={
            <div className="flex justify-end">
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-sm font-medium text-slate-200 transition hover:border-slate-600 hover:bg-slate-900"
              >
                + Add Condition
              </button>
            </div>
          }
        >
          <div className="space-y-3">
            {aggregateFilters.map((condition, index) => (
              <div
                key={`${condition.field}-${index.toString()}-agg`}
                className="grid gap-3 rounded-xl border border-slate-800 bg-slate-950/60 p-4 md:grid-cols-[minmax(0,1fr),minmax(0,1fr),minmax(0,1fr),auto] md:items-center"
              >
                <SelectField
                  name={`aggregate-field-${index.toString()}`}
                  placeholder="Select field"
                  options={availableFields} // <-- Only fields from API
                />
                <SelectField
                  name={`aggregate-operator-${index.toString()}`}
                  placeholder="Select operator"
                  options={['greater than', 'less than', 'equal to']}
                />
                <input
                  type="text"
                  placeholder="Enter value"
                  className="w-full rounded-lg border border-slate-800 bg-slate-950/80 px-3 py-2 text-sm text-slate-200 shadow-inner shadow-slate-950/40 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/40"
                />
                <ActionButton label={`Remove aggregate filter ${index + 1}`} tone="danger">
                  Remove
                </ActionButton>
              </div>
            ))}
          </div>
        </SectionCard>

        {/* Join Button */}
        <div className="flex justify-center">
          <button
            type="button"
            onClick={toggleJoinSections}
            className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-600/30 transition-all duration-300 hover:bg-sky-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
          >
            <span aria-hidden className={`transition-transform duration-300 ${showJoinSections ? 'rotate-180' : ''}`}>⚡</span>
            {showJoinSections ? 'Hide Join' : 'Join'}
          </button>
        </div>

        {/* Join Sections - With Animation */}
        <div className={`overflow-hidden transition-all duration-500 ease-in-out ${showJoinSections ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'}`}>
          <div className="space-y-6">
            <SectionCard
              step={10}
              title="Manual Join Query (Optional)"
              description="Provide a custom JOIN clause to combine additional tables."
              footer={
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={toggleJoinSections}
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-sm font-medium text-slate-200 transition hover:border-slate-600 hover:bg-slate-900"
                  >
                    Hide Join Query
                  </button>
                </div>
              }
            >
              <div className="space-y-2">
                <textarea
                  rows={4}
                  value={joinQuery}
                  onChange={(e) => setJoinQuery(e.target.value)}
                  placeholder="LEFT JOIN Customer_Record cr ON Waste_Management_Data.customer = cr.customer_id"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950/80 px-3 py-3 text-sm text-slate-200 shadow-inner shadow-slate-950/40 placeholder:text-slate-500 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/40"
                />
                <p className="text-xs text-slate-500">
                  Note: You may need to add fields from the joined tables to the &ldquo;Print
                  Order&rdquo; section manually.
                </p>
              </div>
            </SectionCard>
            <SectionCard
              step={11}
              title="Select Fields & Print Order (Joined Data)"
              description="Choose which joined table fields appear and in what order."
            >
              <div className="grid gap-6 md:grid-cols-2">
                <ListPanel
                  title="Available Fields"
                  items={availableJoinedFieldOptions}
                  onItemClick={handleAddJoinedField}
                  emptyMessage={
                    joinQuery.trim()
                      ? 'Enter table names in the JOIN query above to see available fields.'
                      : 'All joined fields are already selected.'
                  }
                />
                <ListPanel
                  title="Fields to Print (In Order)"
                  items={joinedPrintFields}
                  numbered
                  emptyMessage="Select a joined field from the left to include it."
                  actionRenderer={(item, index) => (
                    <>
                      <IconButton
                        label={`Move ${item} up`}
                        variant="ghost"
                        onClick={() => handleMoveJoinedField(item, 'up')}
                        disabled={index === 0}
                      >
                        Up
                      </IconButton>
                      <IconButton
                        label={`Move ${item} down`}
                        variant="ghost"
                        onClick={() => handleMoveJoinedField(item, 'down')}
                        disabled={index === joinedPrintFields.length - 1}
                      >
                        Dn
                      </IconButton>
                      <IconButton
                        label={`Remove ${item}`}
                        variant="danger"
                        onClick={() => handleRemoveJoinedField(item)}
                      >
                        X
                      </IconButton>
                    </>
                  )}
                />
              </div>
            </SectionCard>

            <SectionCard
              step={12}
              title="Grouping & Summarization (Joined Data)"
              description="Apply grouping rules to data coming from joined tables."
              footer={
                <div className="flex justify-between">
                  <label className="flex items-center gap-2 text-xs font-medium text-slate-400">
                    <input
                      type="checkbox"
                      className="size-4 rounded border border-slate-700 bg-slate-950 text-sky-500 focus:ring-2 focus:ring-sky-500/50"
                    />
                    Show Groups Only
                  </label>
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-sm font-medium text-slate-200 transition hover:border-slate-600 hover:bg-slate-900"
                  >
                    + Add
                  </button>
                </div>
              }
            >
              <div className="grid gap-4 md:grid-cols-[minmax(0,1fr),minmax(0,1fr),auto] md:items-center">
                <FieldGroup label="Group By">
                  <SelectField
                    name="joined-group-by"
                    placeholder="Select group by field"
                    options={joinedAvailableFields}
                  />
                </FieldGroup>
                <FieldGroup label="Fields to Summarize">
                  <SelectField
                    name="joined-summary-field"
                    placeholder="Select field to summarize"
                    options={joinedAvailableFields}
                  />
                </FieldGroup>
                <ActionButton label="Remove grouping rule" tone="danger">
                  Remove
                </ActionButton>
              </div>
            </SectionCard>

            <SectionCard
              step={13}
              title="Aggregate Filters (HAVING - Joined Data)"
              description="Apply aggregate filters to joined datasets."
              footer={
                <div className="flex justify-end">
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-sm font-medium text-slate-200 transition hover:border-slate-600 hover:bg-slate-900"
                  >
                    + Add Condition
                  </button>
                </div>
              }
            >
              <div className="space-y-3">
                {joinedAggregateFilters.map((condition, index) => (
                  <div
                    key={`${condition.field}-${index.toString()}-joined-agg`}
                    className="grid gap-3 rounded-xl border border-slate-800 bg-slate-950/60 p-4 md:grid-cols-[minmax(0,1fr),minmax(0,1fr),minmax(0,1fr),auto] md:items-center"
                  >
                    <SelectField
                      name={`joined-aggregate-field-${index.toString()}`}
                      placeholder="Select field"
                      options={joinedAvailableFields}
                    />
                    <SelectField
                      name={`joined-aggregate-operator-${index.toString()}`}
                      placeholder="Select operator"
                      options={['greater than', 'less than', 'equal to']}
                    />
                    <input
                      type="text"
                      placeholder="Enter value"
                      className="w-full rounded-lg border border-slate-800 bg-slate-950/80 px-3 py-2 text-sm text-slate-200 shadow-inner shadow-slate-950/40 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/40"
                    />
                    <ActionButton label={`Remove joined aggregate filter ${index + 1}`} tone="danger">
                      Remove
                    </ActionButton>
                  </div>
                ))}
              </div>
            </SectionCard>
          </div>
        </div>

        {isTableFieldsLoading && <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-950/60"><GlobalLoader isLoading={true} /></div>}

        <div className="sticky bottom-0 z-10 border-t border-slate-800 bg-slate-950/80 py-6 backdrop-blur">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <p className="text-sm text-slate-400">
              Review your selections before saving. You can adjust these settings later.
            </p>
            <button
              type="button"
              onClick={handleSaveReport}
              className="inline-flex items-center gap-3 rounded-lg bg-sky-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-500/30 transition hover:bg-sky-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
            >
              Save Report
            </button>
          </div>
        </div>
      </div>
    </main>
    </>
  )
}

export default App
