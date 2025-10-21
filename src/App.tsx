import { useMemo, useState } from 'react'
import Header from './components/Header.tsx'
import CategorySelection from './components/CategorySelection.tsx'
import SectionCard from './components/SectionCard.tsx'
import FieldGroup from './components/FieldGroup.tsx'
import SelectField from './components/SelectField.tsx'
import ListPanel from './components/ListPanel.tsx'
import ActionButton from './components/ActionButton.tsx'
import IconButton from './components/IconButton.tsx'
import {
  categories,
  reportCatalog,
  availableTables,
  availableFields,
  printOrderFields,
  summaryFields,
  filterConditions,
  aggregateFilters,
  sortFields,
  sortOrders,
  joinedAvailableFields,
  joinedPrintOrderFields,
} from './data/mockData'

function App() {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(categories[0]?.id ?? '')
  const [selectedTable, setSelectedTable] = useState<string | null>(null)
  const [printFields, setPrintFields] = useState<string[]>(printOrderFields)
  const [sumFields, setSumFields] = useState<string[]>(summaryFields)
  const [joinedPrintFields, setJoinedPrintFields] =
    useState<string[]>(joinedPrintOrderFields)
  const [showJoinSections, setShowJoinSections] = useState<boolean>(true)

  const selectedCategory = useMemo(
    () => categories.find((category) => category.id === selectedCategoryId),
    [selectedCategoryId],
  )

  const reports = reportCatalog[selectedCategoryId] ?? []
  const selectedTables = selectedTable ? [selectedTable] : []
  const availableFieldOptions = useMemo(
    () => availableFields.filter((field) => !printFields.includes(field)),
    [printFields],
  )
  const availableSummaryFieldOptions = useMemo(
    () => availableFields.filter((field) => !sumFields.includes(field)),
    [sumFields],
  )
  const availableJoinedFieldOptions = useMemo(
    () => joinedAvailableFields.filter((field) => !joinedPrintFields.includes(field)),
    [joinedPrintFields],
  )

  const handleSelectTable = (tableName: string) => {
    setSelectedTable((current) => (current === tableName ? null : tableName))
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

  return (
    <main className="min-h-screen bg-slate-950 bg-[radial-gradient(circle_at_top,_#1f284a55,_transparent_65%)] py-12 text-slate-200">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 sm:px-6 lg:px-8">
        <Header />

        <CategorySelection
          categories={categories}
          selectedCategoryId={selectedCategoryId}
          onCategorySelect={setSelectedCategoryId}
        />

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
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {reports.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-6 text-center text-slate-500">
                      No reports available for this category yet.
                    </td>
                  </tr>
                ) : (
                  reports.map((report) => (
                    <tr key={report.id} className="bg-slate-950/60 hover:bg-slate-900/40">
                      <td className="px-4 py-3 font-medium text-slate-200">{report.name}</td>
                      <td className="px-4 py-3 text-slate-400">{report.number}</td>
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

        <SectionCard
          step={3}
          title="Report Details"
          description="Define the report scope and naming conventions."
        >
          <div className="grid gap-6 md:grid-cols-2">
            <FieldGroup label="Category">
              <SelectField
                name="report-category"
                defaultValue="Sales Reports"
                options={['Sales Reports', 'Inventory', 'Operations']}
              />
            </FieldGroup>
            <FieldGroup label="Report Name">
              <SelectField
                name="report-name"
                defaultValue="Q3 Sales Summary"
                options={['Q3 Sales Summary', 'Annual Overview', 'Custom Report']}
              />
            </FieldGroup>
          </div>
        </SectionCard>

        <SectionCard
          step={4}
          title="Data Source"
          description="Select the tables and fields that will feed this report."
        >
          <div className="grid gap-6 md:grid-cols-2">
            <ListPanel
              title="Available Tables"
              items={availableTables}
              onItemClick={handleSelectTable}
              selectedItems={selectedTables}
              emptyMessage="No tables available."
            />
            <ListPanel
              title="Selected Tables"
              items={selectedTables}
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
          step={5}
          title="Select Fields & Print Order"
          description="Arrange the fields that will appear in your report."
        >
          <div className="grid gap-6 md:grid-cols-2">
            <ListPanel
              title="Available Fields"
              items={availableFieldOptions}
              onItemClick={handleAddFieldToPrint}
              emptyMessage="All fields are already selected."
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
          step={6}
          title="Select Fields to Sum"
          description="Choose numeric fields that should be aggregated."
        >
          <div className="grid gap-6 md:grid-cols-2">
            <ListPanel
              title="Available Fields"
              items={availableSummaryFieldOptions}
              onItemClick={handleAddSummaryField}
              emptyMessage="All fields are currently selected to sum."
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
          step={7}
          title="Select Sort"
          description="Define the default ordering of your report output."
        >
          <div className="grid gap-6 md:grid-cols-2">
            <FieldGroup label="Sort Field">
              <SelectField name="sort-field" defaultValue={sortFields[0]} options={sortFields} />
            </FieldGroup>
            <FieldGroup label="Sort Order">
              <SelectField name="sort-order" defaultValue={sortOrders[0]} options={sortOrders} />
            </FieldGroup>
          </div>
        </SectionCard>

        <SectionCard
          step={8}
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
                className="flex flex-col gap-3 rounded-xl border border-slate-800 bg-slate-950/60 p-4 sm:flex-row sm:items-center sm:gap-4"
              >
                <SelectField
                  name={`filter-field-${index.toString()}`}
                  defaultValue={condition.field}
                  options={availableFields}
                />
                <SelectField
                  name={`filter-operator-${index.toString()}`}
                  defaultValue={condition.operator}
                  options={['equal to', 'not equal to', 'greater than', 'less than']}
                />
                <input
                  type="text"
                  defaultValue={condition.value}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950/80 px-3 py-2 text-sm text-slate-200 shadow-inner shadow-slate-950/40 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/40"
                />
                <button
                  type="button"
                  className="inline-flex items-center justify-center rounded-lg border border-rose-600/60 px-3 py-2 text-sm font-semibold text-rose-300 transition hover:bg-rose-600/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400/50"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard
          step={9}
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
                defaultValue="customer"
                options={['customer', 'waste_zone', 'waste_group']}
              />
            </FieldGroup>
            <FieldGroup label="Fields to Summarize">
              <SelectField
                name="summary-field"
                defaultValue="weight_kg"
                options={summaryFields}
              />
            </FieldGroup>
            <ActionButton label="Remove grouping rule" tone="danger">
              Remove
            </ActionButton>
          </div>
        </SectionCard>

        <SectionCard
          step={10}
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
                className="flex flex-col gap-3 rounded-xl border border-slate-800 bg-slate-950/60 p-4 sm:flex-row sm:items-center sm:gap-4"
              >
                <SelectField
                  name={`aggregate-field-${index.toString()}`}
                  defaultValue={condition.field}
                  options={summaryFields}
                />
                <SelectField
                  name={`aggregate-operator-${index.toString()}`}
                  defaultValue={condition.operator}
                  options={['greater than', 'less than', 'equal to']}
                />
                <input
                  type="text"
                  defaultValue={condition.value}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950/80 px-3 py-2 text-sm text-slate-200 shadow-inner shadow-slate-950/40 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/40"
                />
                <button
                  type="button"
                  className="inline-flex items-center justify-center rounded-lg border border-rose-600/60 px-3 py-2 text-sm font-semibold text-rose-300 transition hover:bg-rose-600/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400/50"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard
          step={11}
          title="Manual Join Query (Optional)"
          description="Provide a custom JOIN clause to combine additional tables."
          footer={
            <div className="flex justify-end">
              <button
                type="button"
                onClick={toggleJoinSections}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-sm font-medium text-slate-200 transition hover:border-slate-600 hover:bg-slate-900"
              >
                {showJoinSections ? 'Hide Join Query' : 'Show Join Query'}
              </button>
            </div>
          }
        >
          {showJoinSections ? (
            <div className="space-y-2">
              <textarea
                rows={4}
                defaultValue="LEFT JOIN Customer_Record cr ON Waste_Management_Data.customer = cr.customer_id"
                className="w-full rounded-xl border border-slate-800 bg-slate-950/80 px-3 py-3 text-sm text-slate-200 shadow-inner shadow-slate-950/40 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/40"
              />
              <p className="text-xs text-slate-500">
                Note: You may need to add fields from the joined tables to the &ldquo;Print
                Order&rdquo; section manually.
              </p>
            </div>
          ) : (
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-6 text-sm text-slate-400">
              Join configuration is currently hidden. Select &ldquo;Show Join Query&rdquo; to
              manage joined data settings.
            </div>
          )}
        </SectionCard>

        {showJoinSections && (
          <>
            <SectionCard
              step={12}
              title="Select Fields & Print Order (Joined Data)"
              description="Choose which joined table fields appear and in what order."
            >
              <div className="grid gap-6 md:grid-cols-2">
                <ListPanel
                  title="Available Fields"
                  items={availableJoinedFieldOptions}
                  onItemClick={handleAddJoinedField}
                  emptyMessage="All joined fields are already selected."
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
              step={13}
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
                    defaultValue="None"
                    options={['None', 'customer', 'supplier', 'location']}
                  />
                </FieldGroup>
                <FieldGroup label="Fields to Summarize">
                  <SelectField
                    name="joined-summary-field"
                    defaultValue="Select Field"
                    options={['Select Field', ...summaryFields]}
                  />
                </FieldGroup>
                <ActionButton label="Remove grouping rule" tone="danger">
                  Remove
                </ActionButton>
              </div>
            </SectionCard>

            <SectionCard
              step={14}
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
              <div className="rounded-xl border border-slate-800 bg-slate-950/40 px-4 py-6 text-center text-sm text-slate-500">
                No aggregate filters have been defined for the joined data yet.
              </div>
            </SectionCard>
          </>
        )}

        <div className="sticky bottom-0 z-10 border-t border-slate-800 bg-slate-950/80 py-6 backdrop-blur">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <p className="text-sm text-slate-400">
              Review your selections before saving. You can adjust these settings later.
            </p>
            <button
              type="button"
              className="inline-flex items-center gap-3 rounded-lg bg-sky-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-500/30 transition hover:bg-sky-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
            >
              Save Report
            </button>
          </div>
        </div>
      </div>
    </main>
  )
}

export default App
