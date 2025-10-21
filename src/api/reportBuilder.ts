const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000'

export type ApiCategory = {
  id: string
  name: string
  description: string
  reportCount: number
  productCount: number
  displayOrder: number
}

export type ApiReport = {
  id: string
  name: string
  number: string
  description: string
  status: string
  version: number
  updatedAt: string
}

export type ReportBuilderConfiguration = {
  dataSource: string
  dataSourceLabel: string
  selectedFields: string[]
  printOrderFields: string[]
  summaryFields: string[]
  filterConditions: Array<{ field: string; operator: string; value: string }>
  aggregateFilters: Array<{ field: string; operator: string; value: string }>
  sortFields: string[]
  sortOrders: string[]
  joinedAvailableFields: string[]
  joinedPrintOrderFields: string[]
}

export type ReportBuilderData = {
  categories: ApiCategory[]
  reportCatalog: Record<string, ApiReport[]>
  dataSources: Array<{ name: string; label: string; description: string }>
  availableTables: string[]
  availableFields: string[]
  defaultConfiguration: ReportBuilderConfiguration
}

export type ApiDataSource = {
  name: string
  label: string
  description: string
}

export type ApiDatabaseTable = {
  name: string
  label: string
}

export type ApiTableField = {
  name: string
  label: string
  type: string
}

export async function fetchTableFields(
  tableName: string,
  signal?: AbortSignal,
): Promise<ApiTableField[]> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/v1/database-tables/${encodeURIComponent(tableName)}/fields`,
      { signal },
    )

    if (!response.ok) {
      // If endpoint doesn't exist (404), return empty array instead of throwing
      if (response.status === 404) {
        console.warn(`Fields endpoint not found for table: ${tableName}. Using fallback.`)
        return []
      }
      throw new Error(`Failed to load fields for table ${tableName} (status ${response.status}).`)
    }

    const payload = await response.json()

    if (!payload?.success) {
      throw new Error(payload?.message ?? 'Unexpected table fields API response.')
    }

    return (payload.data?.fields ?? []) as ApiTableField[]
  } catch (error) {
    // If it's an abort error, re-throw it
    if (error instanceof Error && error.name === 'AbortError') {
      throw error
    }
    // For other errors (like network errors), log and return empty array
    console.warn(`Error fetching fields for table ${tableName}:`, error)
    return []
  }
}

export async function fetchDatabaseTables(signal?: AbortSignal): Promise<ApiDatabaseTable[]> {
  const response = await fetch(`${API_BASE_URL}/api/v1/database-tables`, { signal })

  if (!response.ok) {
    throw new Error(`Failed to load database tables (status ${response.status}).`)
  }

  const payload = await response.json()

  if (!payload?.success) {
    throw new Error(payload?.message ?? 'Unexpected database tables API response.')
  }

  return (payload.data?.tables ?? []) as ApiDatabaseTable[]
}

export async function fetchCategories(signal?: AbortSignal): Promise<ApiCategory[]> {
  const response = await fetch(`${API_BASE_URL}/api/v1/get-categories`, { signal })

  if (!response.ok) {
    throw new Error(`Failed to load categories (status ${response.status}).`)
  }

  const payload = await response.json()

  if (!payload?.success) {
    throw new Error(payload?.message ?? 'Unexpected categories API response.')
  }

  return (payload.data?.categories ?? []) as ApiCategory[]
}

export async function fetchReportBuilderData(signal?: AbortSignal): Promise<ReportBuilderData> {
  const response = await fetch(`${API_BASE_URL}/api/report-builder/initial`, {
    headers: { 'Content-Type': 'application/json' },
    signal,
  })

  if (!response.ok) {
    throw new Error(`Failed to load report builder data (status ${response.status}).`)
  }

  const payload = await response.json()

  if (!payload?.success) {
    throw new Error(payload?.message ?? 'Unexpected API response.')
  }

  return payload.data as ReportBuilderData
}
