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
  saveReportConfiguration,
  getReportConfiguration,
  updateReportConfiguration,
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
  const [data, setData] = useState<ReportBuilderData | null>(null)
  const [availableTables, setAvailableTables] = useState<ApiDatabaseTable[]>([])
  const [selectedTable, setSelectedTable] = useState<ApiDatabaseTable | null>(null)
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
  // sortOrders intentionally omitted until sort UI is implemented
  const [tableFields, setTableFields] = useState<string[]>([])
  const [tableFieldMap, setTableFieldMap] = useState<{ [tableName: string]: string[] }>({}) // cache
  const [isTableFieldsLoading, setIsTableFieldsLoading] = useState(false)
  const [joinQuery, setJoinQuery] = useState<string>('')
  const [joinedTableFields, setJoinedTableFields] = useState<string[]>([])
  const [isCreatingNewReport, setIsCreatingNewReport] = useState<boolean>(false)
  const [newCategoryName, setNewCategoryName] = useState<string>('')
  const [newReportName, setNewReportName] = useState<string>('')
  const [isEditingReport, setIsEditingReport] = useState<boolean>(false)
  const [editingReportId, setEditingReportId] = useState<string | null>(null)
  const [editingReportName, setEditingReportName] = useState<string>('')
  const [isViewingSQLQuery, setIsViewingSQLQuery] = useState<boolean>(false)
  const [currentSQLQuery, setCurrentSQLQuery] = useState<string>('')

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
        const normalizedData: ReportBuilderData = {
          ...apiData,
          dataSources: dataSourcesList,
          categories: Array.isArray(apiData.categories) ? apiData.categories : [],
        }
        setData(normalizedData)
        
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

  const toggleJoinSections = () => {
    setShowJoinSections((current) => !current)
  }




  const handleSaveReport = async () => {
    // For edit mode, only report name is required. For create mode, both are required
    if (!isEditingReport && (!newCategoryName.trim() || !newReportName.trim())) {
      const errorMsg = 'Please enter both category name and report name.'
      toast.error(errorMsg)
      return
    }

    if (!newReportName.trim()) {
      const errorMsg = 'Please enter a report name.'
      toast.error(errorMsg)
      return
    }

    try {
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

      if (isEditingReport && editingReportId) {
        // Update existing report
        await updateReportConfiguration(
          editingReportId,
          configuration,
        )
        toast.success(`Report "${newReportName}" updated successfully!`)
        handleCancelEdit()
      } else {
        // Create new report
        await saveReportConfiguration(
          newCategoryName.trim(),
          newReportName.trim(),
          configuration,
        )
        toast.success(`Report "${newReportName}" created successfully!`)
        setNewCategoryName('')
        setNewReportName('')
        setIsCreatingNewReport(false)
      }

  // Note: categories are managed in parent component (parent will refresh as needed)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save report.'
      toast.error(errorMessage)
    }
  }

  const handleEditReport = async (reportId: string, reportName: string) => {
    try {
      // Fetch the report configuration
      const { configuration } = await getReportConfiguration(reportId)

      // Set edit mode and populate form with existing data
      setIsEditingReport(true)
      setEditingReportId(reportId)
      setEditingReportName(reportName)
      setNewReportName(reportName)

      // Find and select the table
      if (configuration.dataSource) {
        const table = availableTables.find((t) => t.name === configuration.dataSource)
        if (table) {
          setSelectedTable(table)
        }
      }

      // Populate fields
      setPrintFields(configuration.printOrderFields || [])
      setSumFields(configuration.summaryFields || [])
      setFilterConditions(configuration.filterConditions || [{ field: '', operator: '', value: '' }])
      setAggregateFilters(configuration.aggregateFilters || [{ field: '', operator: '', value: '' }])
      setJoinQuery(configuration.joinQuery || '')
      setJoinedPrintFields(configuration.joinedPrintOrderFields || [])

      // Scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' })

      toast.success('Report loaded for editing')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load report for editing.'
      toast.error(errorMessage)
    }
  }

  const handleCancelEdit = () => {
    setIsEditingReport(false)
    setEditingReportId(null)
    setEditingReportName('')
    setNewReportName('')
    setPrintFields([])
    setSumFields([])
    setFilterConditions([{ field: '', operator: '', value: '' }])
    setAggregateFilters([{ field: '', operator: '', value: '' }])
    setJoinQuery('')
    setJoinedPrintFields([])
    setSelectedTable(null)
  }

  const handleViewReport = async (reportId: string, reportName: string) => {
    try {
      // Fetch the report configuration
      const { configuration } = await getReportConfiguration(reportId)

      // Generate SQL query
      const sqlQuery = generateSQLQuery(configuration)
      setCurrentSQLQuery(sqlQuery)
      setIsViewingSQLQuery(true)

      toast.success(`Loaded query for "${reportName}"`)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load report query.'
      toast.error(errorMessage)
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

          <SectionCard
            step={8}
            title="JOIN Queries"
            description="Combine data from multiple tables using SQL JOIN statements."
          >
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <ActionButton
                  onClick={toggleJoinSections}
                  variant="secondary"
                  size="sm"
                >
                  {showJoinSections ? 'Hide' : 'Show'} JOIN Sections
                </ActionButton>
              </div>

              {showJoinSections && (
                <>
                  <FieldGroup label="JOIN Query">
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
                </>
              )}
            </div>
          </SectionCard>

          <SectionCard
            step={9}
            title="Report Management"
            description="Save, edit, or view existing reports."
          >
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <ActionButton
                  onClick={() => setIsCreatingNewReport(true)}
                  variant="primary"
                  disabled={loading}
                >
                  Create New Report
                </ActionButton>
                <ActionButton
                  onClick={() => {
                    const config: ReportBuilderConfiguration = {
                      dataSource: selectedTable?.name ?? '',
                      dataSourceLabel: selectedTable?.label ?? '',
                      selectedTables: selectedTable ? [selectedTable.name] : [],
                      selectedFields: printFields,
                      printOrderFields: printFields,
                      summaryFields: sumFields,
                      sortFields: [],
                      sortOrders: [],
                      filterConditions: filterConditions,
                      groupByFields: [],
                      aggregateFilters: aggregateFilters,
                      joinQuery: joinQuery,
                      joinedAvailableFields: joinedTableFields,
                      joinedPrintOrderFields: joinedPrintFields,
                      joinedGroupByFields: [],
                      joinedAggregateFilters: joinedAggregateFilters,
                    }
                    const sqlQuery = generateSQLQuery(config)
                    setCurrentSQLQuery(sqlQuery)
                    setIsViewingSQLQuery(true)
                  }}
                  variant="secondary"
                  disabled={!selectedTable}
                >
                  View SQL Query
                </ActionButton>
              </div>

              {isCreatingNewReport && (
                <div className="rounded-lg border border-slate-700 bg-slate-900/50 p-6">
                  <h3 className="mb-4 text-lg font-semibold text-slate-200">Create New Report</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <FieldGroup label="Category Name">
                      <input
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName((e.target as HTMLInputElement).value)}
                        placeholder="Enter category name"
                        className="w-full rounded-lg border border-slate-800 bg-slate-950/80 px-3 py-2 text-sm text-slate-200"
                      />
                    </FieldGroup>
                    <FieldGroup label="Report Name">
                      <input
                        value={newReportName}
                        onChange={(e) => setNewReportName((e.target as HTMLInputElement).value)}
                        placeholder="Enter report name"
                        className="w-full rounded-lg border border-slate-800 bg-slate-950/80 px-3 py-2 text-sm text-slate-200"
                      />
                    </FieldGroup>
                  </div>
                  <div className="mt-4 flex gap-4">
                    <ActionButton onClick={handleSaveReport} variant="primary" size="sm">
                      Save Report
                    </ActionButton>
                    <ActionButton
                      onClick={() => {
                        setIsCreatingNewReport(false)
                        setNewCategoryName('')
                        setNewReportName('')
                      }}
                      variant="secondary"
                      size="sm"
                    >
                      Cancel
                    </ActionButton>
                  </div>
                </div>
              )}

              {selectedCategory && (
                <div className="rounded-lg border border-slate-700 bg-slate-900/50 p-6">
                  <h3 className="mb-4 text-lg font-semibold text-slate-200">
                    Reports in {selectedCategory.name}
                  </h3>
                  {reports.length === 0 ? (
                    <p className="text-slate-400">No reports in this category yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {reports.map((report) => (
                        <div
                          key={report.id}
                          className="flex items-center justify-between rounded border border-slate-700 bg-slate-800/50 p-3"
                        >
                          <div>
                            <p className="font-medium text-slate-200">{report.name}</p>
                            <p className="text-sm text-slate-400">
                              Created {formatDate(report.createdAt)} • Updated {formatDate(report.updatedAt)}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <ActionButton
                              onClick={() => handleViewReport(report.id, report.name)}
                              variant="secondary"
                              size="sm"
                            >
                              View SQL
                            </ActionButton>
                            <ActionButton
                              onClick={() => handleEditReport(report.id, report.name)}
                              variant="secondary"
                              size="sm"
                            >
                              Edit
                            </ActionButton>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {isEditingReport && (
                <div className="rounded-lg border border-slate-700 bg-slate-900/50 p-6">
                  <h3 className="mb-4 text-lg font-semibold text-slate-200">
                    Editing: {editingReportName}
                  </h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <FieldGroup label="Report Name">
                      <input
                        value={newReportName}
                        onChange={(e) => setNewReportName((e.target as HTMLInputElement).value)}
                        placeholder="Enter report name"
                        className="w-full rounded-lg border border-slate-800 bg-slate-950/80 px-3 py-2 text-sm text-slate-200"
                      />
                    </FieldGroup>
                  </div>
                  <div className="mt-4 flex gap-4">
                    <ActionButton onClick={handleSaveReport} variant="primary" size="sm">
                      Update Report
                    </ActionButton>
                    <ActionButton onClick={handleCancelEdit} variant="secondary" size="sm">
                      Cancel
                    </ActionButton>
                  </div>
                </div>
              )}
            </div>
          </SectionCard>

          {isViewingSQLQuery && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
              <div className="max-h-[80vh] w-full max-w-4xl overflow-auto rounded-lg border border-slate-700 bg-slate-900 p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-slate-200">Generated SQL Query</h3>
                  <IconButton
                    label="Close SQL modal"
                    onClick={() => setIsViewingSQLQuery(false)}
                    className="text-slate-400 hover:text-slate-200"
                  >
                    ×
                  </IconButton>
                </div>
                <pre className="whitespace-pre-wrap rounded bg-slate-800 p-4 text-sm text-slate-300">
                  {currentSQLQuery}
                </pre>
              </div>
            </div>
          )}
  </>
  )
}