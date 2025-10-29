import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import SectionCard from './common/SectionCard.tsx'
import FieldGroup from './FieldGroup.tsx'
import SelectField from './SelectField.tsx'
import ListPanel from './ListPanel.tsx'
import ActionButton from './ActionButton.tsx'
import IconButton from './IconButton.tsx'
import {
  fetchReportBuilderData,
  fetchDatabaseTables,
  fetchTableFields,
  type ReportBuilderData,
  type ApiDatabaseTable,
  type ReportBuilderConfiguration,
} from '../api/reportBuilder.ts'
import { generateSQLQuery } from '../utils/sqlUtils.ts'
import type { Category } from '../types'

interface ReportBuilderFormProps {
  categories: Category[]
  selectedCategoryId: string
  setSelectedCategoryId: (id: string) => void
  loading: boolean
}

export default function ReportBuilderForm({
  categories,
  selectedCategoryId,
  setSelectedCategoryId,
  loading,
}: ReportBuilderFormProps) {
  // mark prop as used (component no longer changes category from inside)
  void setSelectedCategoryId
  void categories
  void selectedCategoryId
  void loading
  const [availableTables, setAvailableTables] = useState<ApiDatabaseTable[]>([])
  const [selectedTable, setSelectedTable] = useState<ApiDatabaseTable | null>(null)
  const [printFields, setPrintFields] = useState<string[]>([])
  const [sumFields, setSumFields] = useState<string[]>([])
  const [joinedPrintFields, setJoinedPrintFields] = useState<string[]>([])
  const [filterConditions, setFilterConditions] = useState<
    Array<{ field: string; operator: string; value: string }>
  >([])
  const [aggregateFilters, setAggregateFilters] = useState<
    Array<{ field: string; operator: string; value: string }>
  >([])
  const [joinedAggregateFilters] = useState<
    Array<{ field: string; operator: string; value: string }>
  >([{ field: '', operator: '', value: '' }])
  // sortOrders intentionally omitted until sort UI is implemented
  const [tableFields, setTableFields] = useState<string[]>([])
  const [tableFieldMap, setTableFieldMap] = useState<{ [tableName: string]: string[] }>({}) // cache
  const [isTableFieldsLoading, setIsTableFieldsLoading] = useState(false)
  const [joinQuery, setJoinQuery] = useState<string>('')
  const [joinedTableFields, setJoinedTableFields] = useState<string[]>([])
  const [currentStep, setCurrentStep] = useState<number>(1) // Track which step is visible

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
        const tablesPromise = fetchDatabaseTables(controller.signal).catch((tableError) => {
          if (tableError instanceof Error && tableError.name === 'AbortError') {
            throw tableError
          }
          console.warn('Failed to load database tables from API.', tableError)
          return null
        })

        const [apiData, databaseTables] = await Promise.all([
          fetchReportBuilderData(controller.signal),
          tablesPromise,
        ])

        const dataSourcesList = Array.isArray(apiData.dataSources) ? apiData.dataSources : []

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
  // sortOrders not set here - sorting UI not implemented yet
      } catch (fetchError) {
        if (fetchError instanceof Error && fetchError.name === 'AbortError') {
          return
        }
        console.error(fetchError)
      }
    }

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

  const finalConfiguration = useMemo<ReportBuilderConfiguration>(() => {
    return {
      dataSource: selectedTable?.name ?? '',
      dataSourceLabel: selectedTable?.label ?? '',
      selectedTables: selectedTable ? [selectedTable.name] : [],
      selectedFields: printFields,
      printOrderFields: printFields,
      summaryFields: sumFields,
      sortFields: [], // Sorting UI not implemented yet
      sortOrders: [],
      filterConditions,
      groupByFields: [],
      aggregateFilters,
      joinQuery,
      joinedAvailableFields: joinedTableFields,
      joinedPrintOrderFields: joinedPrintFields,
      joinedGroupByFields: [],
      joinedAggregateFilters,
    }
  }, [
    selectedTable,
    printFields,
    sumFields,
    filterConditions,
    aggregateFilters,
    joinQuery,
    joinedTableFields,
    joinedPrintFields,
    joinedAggregateFilters,
  ])

  const finalSql = useMemo(() => generateSQLQuery(finalConfiguration), [finalConfiguration])

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


  const handleAddSummaryField = (fieldName: string) => {
    setSumFields((current) => (current.includes(fieldName) ? current : [...current, fieldName]))
  }

  const handleRemoveSummaryField = (fieldName: string) => {
    setSumFields((current) => current.filter((field) => field !== fieldName))
  }


  const handleAddJoinedField = (fieldName: string) => {
    setJoinedPrintFields((current) =>
      current.includes(fieldName) ? current : [...current, fieldName],
    )
  }

  const handleRemoveJoinedField = (fieldName: string) => {
    setJoinedPrintFields((current) => current.filter((field) => field !== fieldName))
  }

  const handleSaveSql = async () => {
    const trimmedSql = finalSql.trim()
    if (!trimmedSql) {
      toast.error('SQL query is empty. Select a table and fields first.')
      return
    }
    try {
      if ('clipboard' in navigator && navigator.clipboard) {
        await navigator.clipboard.writeText(trimmedSql)
        toast.success('SQL query copied to clipboard.')
      } else {
        throw new Error('Clipboard API not available')
      }
    } catch (copyError) {
      console.warn('Failed to copy SQL query to clipboard.', copyError)
      toast.success('SQL query ready. Copy it manually if needed.')
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

  return (
    <>
      {currentStep === 1 && (
        <>
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
                onItemClick={handleClearSelectedTable}
                selectedItems={[]}
                emptyMessage="No table selected."
              />
            </div>
          </SectionCard>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between gap-4 px-4">
            <button
              type="button"
              className="rounded-lg border border-slate-700 bg-slate-800 px-6 py-2.5 text-sm font-medium text-slate-200 transition hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-500"
              onClick={() => {
                // Navigate back to category selection
                window.location.reload()
              }}
            >
              Back
            </button>
            <div className="flex gap-3">
              <button
                type="button"
                className="rounded-lg border border-slate-700 bg-slate-800 px-6 py-2.5 text-sm font-medium text-slate-200 transition hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-500"
                onClick={() => {
                  // Cancel action
                  if (confirm('Are you sure you want to cancel? Any unsaved changes will be lost.')) {
                    window.location.reload()
                  }
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => {
                  if (!selectedTable) {
                    toast.error('Please select a table first')
                    return
                  }
                  setCurrentStep(2)
                }}
                disabled={!selectedTable}
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}

      {currentStep === 2 && (
        <>
          <SectionCard
            step={4}
            title="Fields to Print"
            description="Choose which fields to include in the report output."
          >
            <div className="grid gap-6 md:grid-cols-2">
              <ListPanel
                title="Available Fields"
                items={availableFieldOptions}
                onItemClick={handleAddFieldToPrint}
                selectedItems={[]}
                emptyMessage={isTableFieldsLoading ? "Loading fields..." : "Select a table first."}
              />
              <ListPanel
                title="Selected Fields"
                items={printFields}
                onItemClick={handleRemoveFieldFromPrint}
                selectedItems={[]}
                emptyMessage="No fields selected."
                actionRenderer={(item) => (
                  <div className="flex items-center gap-2">
                    <IconButton label={`Move ${item} up`} variant="ghost">↑</IconButton>
                    <IconButton label={`Move ${item} down`} variant="ghost">↓</IconButton>
                    <IconButton label={`Remove ${item}`} variant="danger" onClick={() => handleRemoveFieldFromPrint(item)}>×</IconButton>
                  </div>
                )}
              />
            </div>
          </SectionCard>

          {/* Navigation Buttons for Step 2 */}
          <div className="flex items-center justify-between gap-4 px-4">
            <button
              type="button"
              className="rounded-lg border border-slate-700 bg-slate-800 px-6 py-2.5 text-sm font-medium text-slate-200 transition hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-500"
              onClick={() => setCurrentStep(1)}
            >
              Back
            </button>
            <div className="flex gap-3">
              <button
                type="button"
                className="rounded-lg border border-slate-700 bg-slate-800 px-6 py-2.5 text-sm font-medium text-slate-200 transition hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-500"
                onClick={() => {
                  if (confirm('Are you sure you want to cancel? Any unsaved changes will be lost.')) {
                    window.location.reload()
                  }
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                onClick={() => {
                  setCurrentStep(3)
                }}
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}

      {currentStep === 3 && (
        <>
          <SectionCard
            step={5}
            title="Summary Fields"
            description="Select fields to summarize (count, sum, average, etc.)."
          >
            <div className="grid gap-6 md:grid-cols-2">
              <ListPanel
                title="Available Fields"
                items={availableSummaryFieldOptions}
                onItemClick={handleAddSummaryField}
                selectedItems={[]}
                emptyMessage={isTableFieldsLoading ? "Loading fields..." : "Select a table first."}
              />
              <ListPanel
                title="Summary Fields"
                items={sumFields}
                onItemClick={handleRemoveSummaryField}
                selectedItems={[]}
                emptyMessage="No summary fields selected."
                actionRenderer={(item) => (
                  <div className="flex items-center gap-2">
                    <IconButton label={`Move ${item} up`} variant="ghost">↑</IconButton>
                    <IconButton label={`Move ${item} down`} variant="ghost">↓</IconButton>
                    <IconButton label={`Remove ${item}`} variant="danger" onClick={() => handleRemoveSummaryField(item)}>×</IconButton>
                  </div>
                )}
              />
            </div>
          </SectionCard>

          {/* Navigation Buttons for Step 3 */}
          <div className="flex items-center justify-between gap-4 px-4">
            <button
              type="button"
              className="rounded-lg border border-slate-700 bg-slate-800 px-6 py-2.5 text-sm font-medium text-slate-200 transition hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-500"
              onClick={() => setCurrentStep(2)}
            >
              Back
            </button>
            <div className="flex gap-3">
              <button
                type="button"
                className="rounded-lg border border-slate-700 bg-slate-800 px-6 py-2.5 text-sm font-medium text-slate-200 transition hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-500"
                onClick={() => {
                  if (confirm('Are you sure you want to cancel? Any unsaved changes will be lost.')) {
                    window.location.reload()
                  }
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                onClick={() => setCurrentStep(4)}
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}

      {currentStep === 4 && (
        <>
          <SectionCard
            step={6}
            title="Filters"
            description="Apply conditions to limit the data included in the report."
          >
            <div className="space-y-4">
              {filterConditions.map((condition, index) => (
                <div key={index} className="flex gap-4 items-end">
                  <SelectField
                    label="Field"
                    value={condition.field}
                    onChange={(value) => {
                      const updated = [...filterConditions]
                      updated[index].field = value
                      setFilterConditions(updated)
                    }}
                    options={availableFields.map(field => ({ value: field, label: field }))}
                    placeholder="Select field"
                  />
                  <SelectField
                    label="Operator"
                    value={condition.operator}
                    onChange={(value) => {
                      const updated = [...filterConditions]
                      updated[index].operator = value
                      setFilterConditions(updated)
                    }}
                    options={[
                      { value: '=', label: 'Equals' },
                      { value: '!=', label: 'Not Equals' },
                      { value: '>', label: 'Greater Than' },
                      { value: '<', label: 'Less Than' },
                      { value: '>=', label: 'Greater or Equal' },
                      { value: '<=', label: 'Less or Equal' },
                      { value: 'LIKE', label: 'Contains' },
                      { value: 'NOT LIKE', label: 'Does Not Contain' },
                    ]}
                    placeholder="Select operator"
                  />
                  <FieldGroup label="Value">
                    <input
                      className="w-full rounded-lg border border-slate-800 bg-slate-950/80 px-3 py-2 text-sm text-slate-200"
                      value={condition.value}
                      onChange={(e) => {
                        const v = (e.target as HTMLInputElement).value
                        const updated = [...filterConditions]
                        updated[index].value = v
                        setFilterConditions(updated)
                      }}
                      placeholder="Enter value"
                    />
                  </FieldGroup>
                  <IconButton
                    label="Remove filter"
                    onClick={() => {
                      setFilterConditions(filterConditions.filter((_, i) => i !== index))
                    }}
                    disabled={filterConditions.length === 1}
                    className="mb-1"
                  >
                    −
                  </IconButton>
                </div>
              ))}
              <ActionButton
                onClick={() => setFilterConditions([...filterConditions, { field: '', operator: '', value: '' }])}
                variant="secondary"
                size="sm"
              >
                Add Filter
              </ActionButton>
            </div>
          </SectionCard>

          {/* Navigation Buttons for Step 4 */}
          <div className="flex items-center justify-between gap-4 px-4">
            <button
              type="button"
              className="rounded-lg border border-slate-700 bg-slate-800 px-6 py-2.5 text-sm font-medium text-slate-200 transition hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-500"
              onClick={() => setCurrentStep(3)}
            >
              Back
            </button>
            <div className="flex gap-3">
              <button
                type="button"
                className="rounded-lg border border-slate-700 bg-slate-800 px-6 py-2.5 text-sm font-medium text-slate-200 transition hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-500"
                onClick={() => {
                  if (confirm('Are you sure you want to cancel? Any unsaved changes will be lost.')) {
                    window.location.reload()
                  }
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                onClick={() => setCurrentStep(5)}
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}

      {currentStep === 5 && (
        <>
          <SectionCard
            step={7}
            title="Aggregate Filters"
            description="Apply filters on aggregated data (HAVING clause)."
          >
            <div className="space-y-4">
              {aggregateFilters.map((condition, index) => (
                <div key={index} className="flex gap-4 items-end">
                  <SelectField
                    label="Field"
                    value={condition.field}
                    onChange={(value) => {
                      const updated = [...aggregateFilters]
                      updated[index].field = value
                      setAggregateFilters(updated)
                    }}
                    options={sumFields.map(field => ({ value: field, label: field }))}
                    placeholder="Select field"
                  />
                  <SelectField
                    label="Operator"
                    value={condition.operator}
                    onChange={(value) => {
                      const updated = [...aggregateFilters]
                      updated[index].operator = value
                      setAggregateFilters(updated)
                    }}
                    options={[
                      { value: '=', label: 'Equals' },
                      { value: '!=', label: 'Not Equals' },
                      { value: '>', label: 'Greater Than' },
                      { value: '<', label: 'Less Than' },
                      { value: '>=', label: 'Greater or Equal' },
                      { value: '<=', label: 'Less or Equal' },
                    ]}
                    placeholder="Select operator"
                  />
                  <FieldGroup label="Value">
                    <input
                      className="w-full rounded-lg border border-slate-800 bg-slate-950/80 px-3 py-2 text-sm text-slate-200"
                      value={condition.value}
                      onChange={(e) => {
                        const v = (e.target as HTMLInputElement).value
                        const updated = [...aggregateFilters]
                        updated[index].value = v
                        setAggregateFilters(updated)
                      }}
                      placeholder="Enter value"
                    />
                  </FieldGroup>
                  <IconButton
                    label="Remove aggregate filter"
                    onClick={() => {
                      setAggregateFilters(aggregateFilters.filter((_, i) => i !== index))
                    }}
                    disabled={aggregateFilters.length === 1}
                    className="mb-1"
                  >
                    −
                  </IconButton>
                </div>
              ))}
              <ActionButton
                onClick={() => setAggregateFilters([...aggregateFilters, { field: '', operator: '', value: '' }])}
                variant="secondary"
                size="sm"
              >
                Add Aggregate Filter
              </ActionButton>
            </div>
          </SectionCard>

          {/* Navigation Buttons for Step 5 */}
          <div className="flex items-center justify-between gap-4 px-4">
            <button
              type="button"
              className="rounded-lg border border-slate-700 bg-slate-800 px-6 py-2.5 text-sm font-medium text-slate-200 transition hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-500"
              onClick={() => setCurrentStep(4)}
            >
              Back
            </button>
            <div className="flex gap-3">
              <button
                type="button"
                className="rounded-lg border border-slate-700 bg-slate-800 px-6 py-2.5 text-sm font-medium text-slate-200 transition hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-500"
                onClick={() => {
                  if (confirm('Are you sure you want to cancel? Any unsaved changes will be lost.')) {
                    window.location.reload()
                  }
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                onClick={() => setCurrentStep(6)}
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}

      {currentStep === 6 && (
        <>
          <SectionCard
            step={8}
            title="JOIN Queries"
            description="Combine data from multiple tables using SQL JOIN statements."
          >
            <div className="space-y-4">
              <FieldGroup label="">
                <textarea
                  className="w-full rounded-lg border border-slate-800 bg-slate-950/80 px-3 py-2 text-sm text-slate-200"
                  value={joinQuery}
                  onChange={(e) => setJoinQuery((e.target as HTMLTextAreaElement).value)}
                  placeholder="Enter SQL JOIN query (e.g., JOIN Orders ON Users.id = Orders.user_id)"
                  rows={4}
                />
              </FieldGroup>

              <div className="grid gap-6 md:grid-cols-2">
                <ListPanel
                  title="Available Joined Fields"
                  items={availableJoinedFieldOptions}
                  onItemClick={handleAddJoinedField}
                  selectedItems={[]}
                  emptyMessage="Enter a JOIN query to see available fields."
                />
                <ListPanel
                  title="Selected Joined Fields"
                  items={joinedPrintFields}
                  onItemClick={handleRemoveJoinedField}
                  selectedItems={[]}
                  emptyMessage="No joined fields selected."
                  actionRenderer={(item) => (
                    <div className="flex items-center gap-2">
                      <IconButton label={`Move ${item} up`} variant="ghost">↑</IconButton>
                      <IconButton label={`Move ${item} down`} variant="ghost">↓</IconButton>
                      <IconButton label={`Remove ${item}`} variant="danger" onClick={() => handleRemoveJoinedField(item)}>×</IconButton>
                    </div>
                  )}
                />
              </div>
            </div>
          </SectionCard>

          {/* Navigation Buttons for Step 6 */}
          <div className="flex items-center justify-between gap-4 px-4">
            <button
              type="button"
              className="rounded-lg border border-slate-700 bg-slate-800 px-6 py-2.5 text-sm font-medium text-slate-200 transition hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-500"
              onClick={() => setCurrentStep(5)}
            >
              Back
            </button>
            <div className="flex gap-3">
              <button
                type="button"
                className="rounded-lg border border-slate-700 bg-slate-800 px-6 py-2.5 text-sm font-medium text-slate-200 transition hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-500"
                onClick={() => {
                  if (confirm('Are you sure you want to cancel? Any unsaved changes will be lost.')) {
                    window.location.reload()
                  }
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                onClick={() => setCurrentStep(7)}
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}

      {currentStep === 7 && (
        <>
          <SectionCard
            step={9}
            title="Generated SQL"
            description="Review the SQL query produced from your selections."
          >
            <div className="space-y-4">
              <p className="text-sm text-slate-400">
                The query updates automatically as you adjust tables, fields, and filters.
              </p>
              <div className="rounded-lg border border-slate-700 bg-slate-900/60 p-4">
                <pre className="max-h-[50vh] overflow-auto whitespace-pre-wrap text-sm text-slate-200">
                  {finalSql.trim()
                    ? finalSql
                    : 'Select a data source and configure fields to generate the SQL query.'}
                </pre>
              </div>
            </div>
          </SectionCard>

          <div className="flex items-center justify-between gap-4 px-4">
            <button
              type="button"
              className="rounded-lg border border-slate-700 bg-slate-800 px-6 py-2.5 text-sm font-medium text-slate-200 transition hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-500"
              onClick={() => setCurrentStep(6)}
            >
              Back
            </button>
            <div className="flex gap-3">
              <button
                type="button"
                className="rounded-lg border border-slate-700 bg-slate-800 px-6 py-2.5 text-sm font-medium text-slate-200 transition hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-500"
                onClick={() => {
                  if (confirm('Are you sure you want to cancel? Any unsaved changes will be lost.')) {
                    window.location.reload()
                  }
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="rounded-lg bg-green-600 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                onClick={async () => {
                  await handleSaveSql()
                  window.location.href = '/'
                }}
              >
                Save
              </button>
            </div>
          </div>
        </>
      )}
    </>
  )
}
