import type { Category, Report, FilterCondition } from '../types'

export const categories: Category[] = [
  { id: 'toyota', name: 'Toyota', description: '12 reports' },
  { id: 'nissan', name: 'Nissan', description: '8 reports' },
  { id: 'bmw', name: 'BMW', description: '6 reports' },
  { id: 'trucks', name: 'Trucks', description: '9 reports' },
  { id: 'vans', name: 'Vans', description: '5 reports' },
  { id: 'sedan', name: 'Sedan', description: '4 reports' },
]

export const reportCatalog: Record<string, Report[]> = {
  toyota: [
    { id: 'rpt-001', name: 'Q1 Sales Report', number: 'RPT-018' },
    { id: 'rpt-002', name: 'Inventory Summary', number: 'RPT-102' },
  ],
  nissan: [{ id: 'rpt-101', name: 'Fleet Utilization', number: 'RPT-204' }],
  bmw: [{ id: 'rpt-201', name: 'Dealer Performance', number: 'RPT-409' }],
  trucks: [{ id: 'rpt-301', name: 'Logistics KPI Review', number: 'RPT-540' }],
  vans: [{ id: 'rpt-401', name: 'Service Route Analysis', number: 'RPT-623' }],
  sedan: [{ id: 'rpt-501', name: 'Retail Demand Trends', number: 'RPT-712' }],
}

export const availableTables = ['Waste_Management_Data', 'Customer_Records', 'Inventory_Items']

export const availableFields = ['record_number', 'weight_kg', 'waste_zone', 'waste_group', 'diameter']

export const printOrderFields = ['customer', 'weight_kg', 'date_recorded']

export const summaryFields = ['weight_kg', 'volume_l', 'cost_usd']

export const joinedAvailableFields = [
  'customer_name',
  'customer_email',
  'customer_phone',
  'region',
  'account_status',
]

export const joinedPrintOrderFields = ['customer_name', 'region', 'account_status']

export const filterConditions: FilterCondition[] = [
  { field: 'waste_zone', operator: 'equal to', value: 'North' },
]

export const aggregateFilters: FilterCondition[] = [
  { field: 'weight_kg', operator: 'greater than', value: '250' },
]

export const sortFields = ['date_recorded', 'customer', 'weight_kg']

export const sortOrders = ['Ascending', 'Descending']
