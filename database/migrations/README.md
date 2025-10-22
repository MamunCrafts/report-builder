# Database Migration Patches

This directory contains SQL migration scripts for the Report Builder application.

## Available Migrations

### 001_add_delete_functions.sql
Adds stored procedures and functions for deleting and truncating data.

**Features:**
- `delete_report_by_id(report_id)` - Deletes a specific report and its configuration
- `truncate_all_reports()` - Deletes all reports and configurations (keeps categories)
- `truncate_all_categories()` - Deletes all categories, reports, and configurations
- `count_total_reports()` - Returns total number of reports
- `count_total_categories()` - Returns total number of categories

## How to Apply Migrations

### Using MySQL CLI

```bash
# Connect to your database
mysql -u your_username -p your_database_name

# Apply the migration
mysql -u your_username -p your_database_name < database/migrations/001_add_delete_functions.sql
```

### Using MySQL Workbench

1. Open MySQL Workbench
2. Connect to your database
3. Open the SQL file: `File` → `Open SQL Script`
4. Select `001_add_delete_functions.sql`
5. Click the lightning bolt icon to execute

### Using Node.js

```javascript
const mysql = require('mysql2/promise');
const fs = require('fs');

async function runMigration() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'your_username',
    password: 'your_password',
    database: 'your_database',
    multipleStatements: true
  });

  const sql = fs.readFileSync('./database/migrations/001_add_delete_functions.sql', 'utf8');
  await connection.query(sql);
  console.log('Migration applied successfully');
  await connection.end();
}

runMigration();
```

## Usage Examples

### Delete a Specific Report
```sql
CALL delete_report_by_id('550e8400-e29b-41d4-a716-446655440000');
```

### Truncate All Reports (Keep Categories)
```sql
CALL truncate_all_reports();
```

### Truncate All Categories (Delete Everything)
```sql
-- ⚠️ WARNING: This deletes ALL data!
CALL truncate_all_categories();
```

### Check Counts
```sql
SELECT count_total_reports() as total_reports;
SELECT count_total_categories() as total_categories;
```

## Rollback

To remove these procedures and functions:

```bash
mysql -u your_username -p your_database_name < database/migrations/001_add_delete_functions.rollback.sql
```

## Integration with Backend

To call these procedures from your Express.js backend:

```javascript
// Delete a report
app.delete('/api/v1/report/:reportId', async (req, res) => {
  const { reportId } = req.params;
  try {
    await pool.query('CALL delete_report_by_id(?)', [reportId]);
    res.json({ success: true, message: 'Report deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Truncate all reports
app.delete('/api/v1/reports/truncate', async (req, res) => {
  try {
    await pool.query('CALL truncate_all_reports()');
    res.json({ success: true, message: 'All reports truncated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Truncate all categories
app.delete('/api/v1/categories/truncate', async (req, res) => {
  try {
    await pool.query('CALL truncate_all_categories()');
    res.json({ success: true, message: 'All categories truncated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
```

## Safety Notes

⚠️ **IMPORTANT:**
- Always backup your database before running truncate operations
- `truncate_all_categories()` will delete ALL data including categories, reports, and configurations
- `truncate_all_reports()` will delete all reports but preserve categories
- These operations cannot be undone (except by restoring from backup)
- Consider adding authentication/authorization before exposing these endpoints

## Testing

Before using in production, test on a development database:

```sql
-- Check current counts
SELECT count_total_reports(), count_total_categories();

-- Test delete (use a test report ID)
CALL delete_report_by_id('test-report-id');

-- Verify deletion worked
SELECT count_total_reports();
```
