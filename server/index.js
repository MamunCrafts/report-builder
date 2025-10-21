import express from 'express'
import cors from 'cors'
import mysql from 'mysql2/promise'
import dotenv from 'dotenv'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

dotenv.config()

const app = express()
app.use(cors({ origin: process.env.CORS_ORIGIN ?? '*' }))
app.use(express.json())

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const staticDir = path.resolve(__dirname, './static')

const pool = mysql.createPool({
  host: process.env.DB_HOST ?? 'localhost',
  user: process.env.DB_USER ?? 'root',
  password: process.env.DB_PASSWORD ?? '',
  database: process.env.DB_NAME ?? 'mamun',
  waitForConnections: true,
  connectionLimit: Number.parseInt(process.env.DB_POOL_SIZE ?? '10', 10),
  queueLimit: 0,
})

const parseJsonColumn = (value, fallback = []) => {
  if (!value) return fallback
  try {
    if (Buffer.isBuffer(value)) {
      return JSON.parse(value.toString())
    }
    return typeof value === 'string' ? JSON.parse(value) : value
  } catch (error) {
    console.error('Failed to parse JSON column', error)
    return fallback
  }
}

app.get('/api/report-builder/initial', async (_req, res) => {
  try {
    const [reportsRows] = await pool.query(
      `SELECT id,
              category_id,
              name,
              report_number,
              description,
              status,
              version,
              updated_at
         FROM reports
         WHERE status != 'deleted'
         ORDER BY created_at DESC`,
    )

    const [dataSourcesRows] = await pool.query(
      `SELECT name,
              COALESCE(display_name, name) AS display_name,
              description
         FROM data_sources
         ORDER BY display_name`,
    )

    const [fieldsRows] = await pool.query(
      `SELECT DISTINCT field_name
         FROM data_fields
         ORDER BY field_name`,
    )

    const [configRows] = await pool.query(
      `SELECT data_source,
              selected_fields,
              print_order_fields,
              summary_fields,
              filter_conditions,
              aggregate_filters,
              sort_fields,
              sort_orders,
              joined_available_fields,
              joined_print_order_fields
         FROM report_configurations
         ORDER BY id
         LIMIT 1`,
    )

    const defaultConfig = configRows[0] ?? {}

    const dataSources = dataSourcesRows.map((row) => ({
      name: row.name,
      label: row.display_name,
      description: row.description ?? '',
    }))

    const response = {
      reportCatalog: reportsRows.reduce((acc, report) => {
        const categoryKey = String(report.category_id)
        if (!acc[categoryKey]) {
          acc[categoryKey] = []
        }
        acc[categoryKey].push({
          id: String(report.id),
          name: report.name,
          number: report.report_number,
          description: report.description ?? '',
          status: report.status,
          version: report.version,
          updatedAt: report.updated_at,
        })
        return acc
      }, {}),
      availableTables: dataSources.map((item) => item.label),
      dataSources,
      availableFields: fieldsRows.map((row) => row.field_name),
      defaultConfiguration: {
        dataSource: defaultConfig.data_source ?? dataSourcesRows[0]?.name ?? '',
        dataSourceLabel:
          dataSources.find((source) => source.name === defaultConfig.data_source)?.label ??
          dataSources[0]?.label ??
          '',
        selectedFields: parseJsonColumn(defaultConfig.selected_fields),
        printOrderFields: parseJsonColumn(defaultConfig.print_order_fields),
        summaryFields: parseJsonColumn(defaultConfig.summary_fields),
        filterConditions: parseJsonColumn(defaultConfig.filter_conditions),
        aggregateFilters: parseJsonColumn(defaultConfig.aggregate_filters),
        sortFields: parseJsonColumn(defaultConfig.sort_fields, ['date_recorded', 'customer']),
        sortOrders: parseJsonColumn(defaultConfig.sort_orders, ['Ascending', 'Descending']),
        joinedAvailableFields: parseJsonColumn(defaultConfig.joined_available_fields),
        joinedPrintOrderFields: parseJsonColumn(defaultConfig.joined_print_order_fields),
      },
    }

    res.json({ success: true, data: response })
  } catch (error) {
    console.error('Failed to build initial payload', error)
    res.status(500).json({
      success: false,
      message: 'Unable to load report builder data.',
    })
  }
})

app.get('/api/v1/get-categories', async (_req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT c.id,
              c.name,
              c.description,
              c.display_order,
              COUNT(DISTINCT r.id) AS report_count,
              COUNT(DISTINCT p.id) AS product_count
         FROM categories c
         LEFT JOIN reports r ON r.category_id = c.id AND r.status != 'deleted'
         LEFT JOIN products p ON p.category_id = c.id AND p.is_active = 1
         WHERE c.is_active = 1
         GROUP BY c.id, c.name, c.description, c.display_order
         ORDER BY c.display_order, c.name`,
    )

    const categories = rows.map((row) => ({
      id: String(row.id),
      name: row.name,
      description: row.description ?? '',
      reportCount: Number(row.report_count ?? 0),
      productCount: Number(row.product_count ?? 0),
      displayOrder: row.display_order,
    }))

    res.json({ success: true, data: { categories } })
  } catch (error) {
    console.error('Failed to load categories', error)
    res.status(500).json({
      success: false,
      message: 'Unable to load categories.',
    })
  }
})

app.get('/api/v1/data-sources', async (_req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT name,
              COALESCE(display_name, name) AS display_name,
              description
         FROM data_sources
         ORDER BY display_name`,
    )

    const dataSources = rows.map((row) => ({
      name: row.name,
      label: row.display_name,
      description: row.description ?? '',
    }))

    res.json({ success: true, data: { dataSources } })
  } catch (error) {
    console.error('Failed to load data sources', error)
    res.status(500).json({
      success: false,
      message: 'Unable to load data sources.',
    })
  }
})

app.get('/api/v1/database-tables', async (_req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT table_name AS name
         FROM information_schema.tables
         WHERE table_schema = DATABASE()
           AND table_type = 'BASE TABLE'
         ORDER BY table_name`,
    )

    const formatLabel = (name) =>
      name
        .split('_')
        .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
        .join(' ')

    const tables = rows.map((row) => ({
      name: row.name,
      label: formatLabel(row.name),
    }))

    res.json({ success: true, data: { tables } })
  } catch (error) {
    console.error('Failed to load database tables', error)
    res.status(500).json({
      success: false,
      message: 'Unable to load database tables.',
    })
  }
})

app.get('/api/v1/database-tables/:tableName/fields', async (req, res) => {
  try {
    const { tableName } = req.params;
    // Query MySQL information_schema columns for this table
    const [rows] = await pool.query(
      `SELECT COLUMN_NAME as name, DATA_TYPE as type
         FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?
         ORDER BY ORDINAL_POSITION`,
      [tableName]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Table not found or has no columns.' });
    }
    res.json({
      success: true,
      data: { fields: rows.map(row => ({ name: row.name, label: row.name, type: row.type })) }
    });
  } catch (error) {
    console.error(`Error fetching fields for table '${req.params.tableName}'`, error);
    res.status(500).json({ success: false, message: 'Error fetching fields.' });
  }
})

app.get('/api/data-sources/:name/fields', async (req, res) => {
  try {
    const { name } = req.params
    const [rows] = await pool.query(
      `SELECT field_name, field_label, field_type, is_numeric
         FROM data_fields
         WHERE data_source_id = (
           SELECT id FROM data_sources WHERE name = ?
         )
         ORDER BY field_name`,
      [name],
    )

    res.json({
      success: true,
      data: rows.map((row) => ({
        name: row.field_name,
        label: row.field_label,
        type: row.field_type,
        isNumeric: Boolean(row.is_numeric),
      })),
    })
  } catch (error) {
    console.error('Failed to load fields for data source', error)
    res.status(500).json({
      success: false,
      message: 'Unable to load fields for the selected data source.',
    })
  }
})

app.use(express.static(staticDir))

app.use((_req, res) => {
  res.status(404).sendFile(path.join(staticDir, 'index.html'))
})

const port = Number.parseInt(process.env.API_PORT ?? '4000', 10)

app.listen(port, () => {
  console.log(`Report Builder API listening on port ${port}`)
})
