const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ;

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
  createdAt?: string
  updatedAt: string
}

export type ReportBuilderConfiguration = {
  // Step 3: Data Source
  dataSource: string
  dataSourceLabel: string
  selectedTables: string[]
  
  // Step 4: Select Fields & Print Order
  selectedFields: string[]
  printOrderFields: string[]
  
  // Step 5: Select Fields to Sum
  summaryFields: string[]
  
  // Step 6: Select Sort
  sortFields: string[]
  sortOrders: string[]
  
  // Step 7: Select Filters
  filterConditions: Array<{ field: string; operator: string; value: string }>
  
  // Step 8: Grouping & Summarization
  groupByFields: string[]
  
  // Step 9: Aggregate Filters (HAVING)
  aggregateFilters: Array<{ field: string; operator: string; value: string }>
  
  // Step 10: Manual Join Query (Optional)
  joinQuery: string
  
  // Step 11-13: Joined Data sections
  joinedAvailableFields: string[]
  joinedPrintOrderFields: string[]
  joinedGroupByFields: string[]
  joinedAggregateFilters: Array<{ field: string; operator: string; value: string }>
}

export type SaveReportConfigurationRequest = {
  categoryName: string
  reportName: string
  configuration: ReportBuilderConfiguration
}

export type SaveReportConfigurationResponse = {
  success: boolean
  message: string
  data?: {
    reportId: string
    reportName: string
    categoryId: string
    createdAt: string
  }
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

export async function createCategory(
  name: string,
  description?: string,
  signal?: AbortSignal,
): Promise<ApiCategory> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/create-category`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        description: description ?? '',
      }),
      signal,
    })

    if (!response.ok) {
      // Try to include response body for better debugging (server may return HTML error page)
      const text = await response.text().catch(() => '')
      if (response.status === 404) {
        throw new Error(
          `Failed to create category (status 404). Endpoint not found. Response body: ${text}`,
        )
      }
      throw new Error(`Failed to create category (status ${response.status}). Response body: ${text}`)
    }

    const contentType = response.headers.get('content-type') ?? ''
    if (!contentType.includes('application/json')) {
      const text = await response.text().catch(() => '')
      throw new Error(`Expected JSON response from create-category but received: ${text}`)
    }

    const payload = await response.json()

    if (!payload?.success) {
      throw new Error(payload?.message ?? 'Unexpected create category API response.')
    }

    return payload.data as ApiCategory
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw error
    }
    // Re-throw with the same message so caller sees readable info
    throw error
  }
}

export async function updateCategory(
  id: string,
  name: string,
  description?: string,
  signal?: AbortSignal,
): Promise<ApiCategory> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/update-category`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, name, description: description ?? '' }),
      signal,
    })

    if (!response.ok) {
      const text = await response.text().catch(() => '')
      if (response.status === 404) {
        throw new Error(`Failed to update category (status 404). Endpoint not found. Response body: ${text}`)
      }
      throw new Error(`Failed to update category (status ${response.status}). Response body: ${text}`)
    }

    const contentType = response.headers.get('content-type') ?? ''
    if (!contentType.includes('application/json')) {
      const text = await response.text().catch(() => '')
      throw new Error(`Expected JSON response from update-category but received: ${text}`)
    }

    const payload = await response.json()

    if (!payload?.success) {
      throw new Error(payload?.message ?? 'Unexpected update category API response.')
    }

    return payload.data as ApiCategory
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw error
    }
    throw error
  }
}

export async function createReport(
  categoryId: string,
  name: string,
  number?: string,
  description?: string,
  signal?: AbortSignal,
): Promise<ApiReport> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/create-report`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        categoryId,
        name,
        number: number ?? '',
        description: description ?? '',
      }),
      signal,
    })

    if (!response.ok) {
      const text = await response.text().catch(() => '')
      if (response.status === 404) {
        throw new Error(`Failed to create report (status 404). Endpoint not found. Response body: ${text}`)
      }
      throw new Error(`Failed to create report (status ${response.status}). Response body: ${text}`)
    }

    const contentType = response.headers.get('content-type') ?? ''
    if (!contentType.includes('application/json')) {
      const text = await response.text().catch(() => '')
      throw new Error(`Expected JSON response from create-report but received: ${text}`)
    }

    const payload = await response.json()

    if (!payload?.success) {
      throw new Error(payload?.message ?? 'Unexpected create report API response.')
    }

    return payload.data as ApiReport
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw error
    }
    throw error
  }
}

export async function saveReportConfiguration(
  categoryName: string,
  reportName: string,
  configuration: ReportBuilderConfiguration,
  signal?: AbortSignal,
): Promise<SaveReportConfigurationResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/save-report-configuration`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        categoryName,
        reportName,
        configuration,
      }),
      signal,
    })

    if (!response.ok) {
      if (response.status === 404) {
        console.warn('Save report configuration endpoint not found (404). Endpoint needs to be created on backend.')
        throw new Error(
          'Backend endpoint /api/v1/save-report-configuration not implemented yet. Please contact your administrator.'
        )
      }
      throw new Error(
        `Failed to save report configuration (status ${response.status}).`,
      )
    }

    const payload = await response.json()

    if (!payload?.success) {
      throw new Error(
        payload?.message ?? 'Unexpected save report configuration API response.',
      )
    }

    return payload as SaveReportConfigurationResponse
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw error
    }
    throw error
  }
}

export async function getReportConfiguration(
  reportId: string,
  signal?: AbortSignal,
): Promise<{ configuration: ReportBuilderConfiguration }> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/report-configuration/${encodeURIComponent(reportId)}`,
    { signal },
  )

  if (!response.ok) {
    throw new Error(
      `Failed to fetch report configuration (status ${response.status}).`,
    )
  }

  const payload = await response.json()

  if (!payload?.success) {
    throw new Error(
      payload?.message ?? 'Unexpected get report configuration API response.',
    )
  }

  return payload.data as { configuration: ReportBuilderConfiguration }
}

export async function updateReportConfiguration(
  reportId: string,
  configuration: ReportBuilderConfiguration,
  signal?: AbortSignal,
): Promise<SaveReportConfigurationResponse> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/report-configuration/${encodeURIComponent(reportId)}`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ configuration }),
      signal,
    },
  )

  if (!response.ok) {
    throw new Error(
      `Failed to update report configuration (status ${response.status}).`,
    )
  }

  const payload = await response.json()

  if (!payload?.success) {
    throw new Error(
      payload?.message ?? 'Unexpected update report configuration API response.',
    )
  }

  return payload as SaveReportConfigurationResponse
}
