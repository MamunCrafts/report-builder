# Report Builder - API & Database Design

## Overview
This document outlines the API endpoints and database schema required for the Advanced Report Builder application, focusing on Category Selection and Category Reports management.

---

## Database Schema

### 1. **categories** Table
Stores all available report categories (e.g., Toyota, Nissan, BMW, Trucks, Vans, Sedan).

| Field Name | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| id | UUID/INT | PRIMARY KEY, AUTO_INCREMENT | Unique category identifier |
| name | VARCHAR(100) | NOT NULL, UNIQUE | Category name (e.g., "Toyota") |
| description | VARCHAR(255) | NULL | Category description |
| report_count | INT | DEFAULT 0 | Number of reports in this category |
| icon | VARCHAR(255) | NULL | Icon URL or identifier |
| display_order | INT | DEFAULT 0 | Order for displaying categories |
| is_active | BOOLEAN | DEFAULT TRUE | Whether category is active |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Creation timestamp |
| updated_at | TIMESTAMP | ON UPDATE CURRENT_TIMESTAMP | Last update timestamp |
| created_by | UUID/INT | FOREIGN KEY → users.id | User who created the category |

**Indexes:**
- PRIMARY KEY on `id`
- UNIQUE INDEX on `name`
- INDEX on `is_active`
- INDEX on `display_order`

---

### 2. **reports** Table
Stores individual reports within categories.

| Field Name | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| id | UUID/INT | PRIMARY KEY, AUTO_INCREMENT | Unique report identifier |
| category_id | UUID/INT | FOREIGN KEY → categories.id, NOT NULL | Associated category |
| name | VARCHAR(255) | NOT NULL | Report name (e.g., "Q1 Sales Report") |
| report_number | VARCHAR(50) | UNIQUE, NOT NULL | Unique report number (e.g., "RPT-018") |
| description | TEXT | NULL | Detailed report description |
| status | ENUM | DEFAULT 'draft' | Status: draft, active, archived, deleted |
| version | INT | DEFAULT 1 | Report version number |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Creation timestamp |
| updated_at | TIMESTAMP | ON UPDATE CURRENT_TIMESTAMP | Last update timestamp |
| created_by | UUID/INT | FOREIGN KEY → users.id | User who created the report |
| last_executed_at | TIMESTAMP | NULL | Last execution timestamp |
| execution_count | INT | DEFAULT 0 | Number of times executed |

**Indexes:**
- PRIMARY KEY on `id`
- UNIQUE INDEX on `report_number`
- INDEX on `category_id`
- INDEX on `status`
- INDEX on `created_by`
- COMPOSITE INDEX on (`category_id`, `status`)

---

### 3. **report_configurations** Table
Stores detailed configuration for each report (data sources, fields, filters, etc.).

| Field Name | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| id | UUID/INT | PRIMARY KEY, AUTO_INCREMENT | Unique configuration identifier |
| report_id | UUID/INT | FOREIGN KEY → reports.id, NOT NULL | Associated report |
| data_source | VARCHAR(255) | NOT NULL | Primary table/data source name |
| selected_fields | JSON | NOT NULL | Array of fields to display |
| print_order_fields | JSON | NULL | Array of fields in print order |
| summary_fields | JSON | NULL | Array of fields to summarize |
| filter_conditions | JSON | NULL | Array of filter conditions |
| aggregate_filters | JSON | NULL | Array of aggregate filters (HAVING) |
| sort_field | VARCHAR(100) | NULL | Field to sort by |
| sort_order | ENUM | DEFAULT 'ASC' | Sort order: ASC, DESC |
| group_by_fields | JSON | NULL | Array of fields to group by |
| show_groups_only | BOOLEAN | DEFAULT FALSE | Whether to show only grouped data |
| join_query | TEXT | NULL | Custom JOIN query |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Creation timestamp |
| updated_at | TIMESTAMP | ON UPDATE CURRENT_TIMESTAMP | Last update timestamp |

**Indexes:**
- PRIMARY KEY on `id`
- UNIQUE INDEX on `report_id`
- INDEX on `data_source`

---

### 4. **report_versions** Table
Tracks different versions of reports for audit and rollback purposes.

| Field Name | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| id | UUID/INT | PRIMARY KEY, AUTO_INCREMENT | Unique version identifier |
| report_id | UUID/INT | FOREIGN KEY → reports.id, NOT NULL | Associated report |
| version_number | INT | NOT NULL | Version number |
| configuration_snapshot | JSON | NOT NULL | Complete configuration snapshot |
| change_description | TEXT | NULL | Description of changes |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Version creation timestamp |
| created_by | UUID/INT | FOREIGN KEY → users.id | User who created version |

**Indexes:**
- PRIMARY KEY on `id`
- INDEX on `report_id`
- COMPOSITE INDEX on (`report_id`, `version_number`)

---

### 5. **report_executions** Table
Logs each report execution for analytics and debugging.

| Field Name | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| id | UUID/INT | PRIMARY KEY, AUTO_INCREMENT | Unique execution identifier |
| report_id | UUID/INT | FOREIGN KEY → reports.id, NOT NULL | Associated report |
| executed_by | UUID/INT | FOREIGN KEY → users.id | User who executed report |
| execution_time_ms | INT | NULL | Execution time in milliseconds |
| row_count | INT | NULL | Number of rows returned |
| status | ENUM | NOT NULL | Status: success, failed, timeout |
| error_message | TEXT | NULL | Error message if failed |
| parameters | JSON | NULL | Runtime parameters used |
| executed_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Execution timestamp |

**Indexes:**
- PRIMARY KEY on `id`
- INDEX on `report_id`
- INDEX on `executed_by`
- INDEX on `status`
- INDEX on `executed_at`

---

### 6. **users** Table (Reference)
Basic user information (if not already exists in your system).

| Field Name | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| id | UUID/INT | PRIMARY KEY, AUTO_INCREMENT | Unique user identifier |
| username | VARCHAR(100) | UNIQUE, NOT NULL | Username |
| email | VARCHAR(255) | UNIQUE, NOT NULL | Email address |
| full_name | VARCHAR(255) | NULL | Full name |
| role | ENUM | DEFAULT 'user' | Role: admin, manager, user |
| is_active | BOOLEAN | DEFAULT TRUE | Whether user is active |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Creation timestamp |

---

## API Endpoints

### **Category Management APIs**

#### 1. Get All Categories
```
GET /api/categories
```

**Query Parameters:**
- `is_active` (boolean, optional): Filter by active status
- `sort_by` (string, optional): Sort field (default: "display_order")
- `sort_order` (string, optional): "asc" or "desc" (default: "asc")

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Toyota",
      "description": "12 reports",
      "report_count": 12,
      "icon": "toyota-icon.svg",
      "display_order": 1,
      "is_active": true,
      "created_at": "2025-01-15T10:30:00Z",
      "updated_at": "2025-10-15T14:20:00Z"
    },
    {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "name": "Nissan",
      "description": "8 reports",
      "report_count": 8,
      "icon": "nissan-icon.svg",
      "display_order": 2,
      "is_active": true,
      "created_at": "2025-01-15T10:31:00Z",
      "updated_at": "2025-10-15T14:21:00Z"
    }
  ],
  "meta": {
    "total": 6,
    "page": 1,
    "per_page": 20
  }
}
```

---

#### 2. Get Single Category
```
GET /api/categories/:categoryId
```

**Path Parameters:**
- `categoryId` (UUID/INT, required): Category identifier

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Toyota",
    "description": "12 reports",
    "report_count": 12,
    "icon": "toyota-icon.svg",
    "display_order": 1,
    "is_active": true,
    "created_at": "2025-01-15T10:30:00Z",
    "updated_at": "2025-10-15T14:20:00Z"
  }
}
```

**Response (404 Not Found):**
```json
{
  "success": false,
  "error": {
    "code": "CATEGORY_NOT_FOUND",
    "message": "Category not found"
  }
}
```

---

#### 3. Create Category
```
POST /api/categories
```

**Request Body:**
```json
{
  "name": "Electric Vehicles",
  "description": "0 reports",
  "icon": "ev-icon.svg",
  "display_order": 7,
  "is_active": true
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440007",
    "name": "Electric Vehicles",
    "description": "0 reports",
    "report_count": 0,
    "icon": "ev-icon.svg",
    "display_order": 7,
    "is_active": true,
    "created_at": "2025-10-19T15:30:00Z",
    "updated_at": "2025-10-19T15:30:00Z"
  }
}
```

---

#### 4. Update Category
```
PUT /api/categories/:categoryId
PATCH /api/categories/:categoryId
```

**Request Body:**
```json
{
  "name": "Toyota Motors",
  "description": "15 reports",
  "display_order": 1
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Toyota Motors",
    "description": "15 reports",
    "report_count": 15,
    "icon": "toyota-icon.svg",
    "display_order": 1,
    "is_active": true,
    "created_at": "2025-01-15T10:30:00Z",
    "updated_at": "2025-10-19T15:45:00Z"
  }
}
```

---

#### 5. Delete Category
```
DELETE /api/categories/:categoryId
```

**Query Parameters:**
- `force` (boolean, optional): Force delete even if category has reports

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Category deleted successfully"
}
```

**Response (400 Bad Request):**
```json
{
  "success": false,
  "error": {
    "code": "CATEGORY_HAS_REPORTS",
    "message": "Cannot delete category with existing reports. Use force=true to delete.",
    "details": {
      "report_count": 12
    }
  }
}
```

---

### **Report Management APIs**

#### 6. Get Reports by Category
```
GET /api/categories/:categoryId/reports
```

**Query Parameters:**
- `status` (string, optional): Filter by status (draft, active, archived)
- `page` (int, optional): Page number (default: 1)
- `per_page` (int, optional): Items per page (default: 20)
- `sort_by` (string, optional): Sort field (default: "created_at")
- `sort_order` (string, optional): "asc" or "desc" (default: "desc")
- `search` (string, optional): Search in report name and number

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "650e8400-e29b-41d4-a716-446655440100",
      "category_id": "550e8400-e29b-41d4-a716-446655440000",
      "category_name": "Toyota",
      "name": "Q1 Sales Report",
      "report_number": "RPT-018",
      "description": "Quarterly sales analysis for Toyota division",
      "status": "active",
      "version": 3,
      "created_at": "2025-01-20T09:00:00Z",
      "updated_at": "2025-10-15T10:30:00Z",
      "created_by": {
        "id": "450e8400-e29b-41d4-a716-446655440010",
        "username": "john.doe",
        "full_name": "John Doe"
      },
      "last_executed_at": "2025-10-18T14:25:00Z",
      "execution_count": 45
    },
    {
      "id": "650e8400-e29b-41d4-a716-446655440101",
      "category_id": "550e8400-e29b-41d4-a716-446655440000",
      "category_name": "Toyota",
      "name": "Inventory Summary",
      "report_number": "RPT-102",
      "description": "Current inventory levels and trends",
      "status": "active",
      "version": 1,
      "created_at": "2025-02-10T11:30:00Z",
      "updated_at": "2025-02-10T11:30:00Z",
      "created_by": {
        "id": "450e8400-e29b-41d4-a716-446655440011",
        "username": "jane.smith",
        "full_name": "Jane Smith"
      },
      "last_executed_at": "2025-10-17T09:15:00Z",
      "execution_count": 23
    }
  ],
  "meta": {
    "total": 12,
    "page": 1,
    "per_page": 20,
    "total_pages": 1
  }
}
```

---

#### 7. Get Single Report
```
GET /api/reports/:reportId
```

**Query Parameters:**
- `include_configuration` (boolean, optional): Include full configuration (default: false)

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "650e8400-e29b-41d4-a716-446655440100",
    "category_id": "550e8400-e29b-41d4-a716-446655440000",
    "category_name": "Toyota",
    "name": "Q1 Sales Report",
    "report_number": "RPT-018",
    "description": "Quarterly sales analysis for Toyota division",
    "status": "active",
    "version": 3,
    "created_at": "2025-01-20T09:00:00Z",
    "updated_at": "2025-10-15T10:30:00Z",
    "created_by": {
      "id": "450e8400-e29b-41d4-a716-446655440010",
      "username": "john.doe",
      "full_name": "John Doe"
    },
    "last_executed_at": "2025-10-18T14:25:00Z",
    "execution_count": 45,
    "configuration": {
      "data_source": "Waste_Management_Data",
      "selected_fields": ["customer", "weight_kg", "date_recorded"],
      "print_order_fields": ["customer", "weight_kg", "date_recorded"],
      "summary_fields": ["weight_kg", "volume_l"],
      "filter_conditions": [
        {
          "field": "waste_zone",
          "operator": "equal_to",
          "value": "North"
        }
      ],
      "aggregate_filters": [
        {
          "field": "weight_kg",
          "operator": "greater_than",
          "value": "250"
        }
      ],
      "sort_field": "date_recorded",
      "sort_order": "DESC",
      "group_by_fields": ["customer"],
      "show_groups_only": true,
      "join_query": null
    }
  }
}
```

---

#### 8. Create Report
```
POST /api/reports
```

**Request Body:**
```json
{
  "category_id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Q4 Performance Report",
  "description": "Q4 2025 performance metrics",
  "status": "draft"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "650e8400-e29b-41d4-a716-446655440200",
    "category_id": "550e8400-e29b-41d4-a716-446655440000",
    "category_name": "Toyota",
    "name": "Q4 Performance Report",
    "report_number": "RPT-825",
    "description": "Q4 2025 performance metrics",
    "status": "draft",
    "version": 1,
    "created_at": "2025-10-19T16:00:00Z",
    "updated_at": "2025-10-19T16:00:00Z",
    "created_by": {
      "id": "450e8400-e29b-41d4-a716-446655440010",
      "username": "john.doe",
      "full_name": "John Doe"
    },
    "last_executed_at": null,
    "execution_count": 0
  }
}
```

---

#### 9. Update Report
```
PUT /api/reports/:reportId
PATCH /api/reports/:reportId
```

**Request Body:**
```json
{
  "name": "Q4 Performance Report - Updated",
  "description": "Q4 2025 comprehensive performance analysis",
  "status": "active"
}
```

**Response (200 OK):** Similar to Create Report response

---

#### 10. Delete Report
```
DELETE /api/reports/:reportId
```

**Query Parameters:**
- `soft_delete` (boolean, optional): Soft delete (archive) instead of permanent delete (default: true)

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Report deleted successfully"
}
```

---

#### 11. Update Report Configuration
```
PUT /api/reports/:reportId/configuration
PATCH /api/reports/:reportId/configuration
```

**Request Body:**
```json
{
  "data_source": "Waste_Management_Data",
  "selected_fields": ["customer", "weight_kg", "date_recorded", "waste_zone"],
  "print_order_fields": ["customer", "weight_kg", "date_recorded"],
  "summary_fields": ["weight_kg", "volume_l", "cost_usd"],
  "filter_conditions": [
    {
      "field": "waste_zone",
      "operator": "equal_to",
      "value": "North"
    },
    {
      "field": "date_recorded",
      "operator": "greater_than",
      "value": "2025-01-01"
    }
  ],
  "aggregate_filters": [
    {
      "field": "weight_kg",
      "operator": "greater_than",
      "value": "250"
    }
  ],
  "sort_field": "date_recorded",
  "sort_order": "DESC",
  "group_by_fields": ["customer", "waste_zone"],
  "show_groups_only": true,
  "join_query": "LEFT JOIN Customer_Record cr ON Waste_Management_Data.customer = cr.customer_id"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "750e8400-e29b-41d4-a716-446655440300",
    "report_id": "650e8400-e29b-41d4-a716-446655440100",
    "data_source": "Waste_Management_Data",
    "selected_fields": ["customer", "weight_kg", "date_recorded", "waste_zone"],
    "print_order_fields": ["customer", "weight_kg", "date_recorded"],
    "summary_fields": ["weight_kg", "volume_l", "cost_usd"],
    "filter_conditions": [...],
    "aggregate_filters": [...],
    "sort_field": "date_recorded",
    "sort_order": "DESC",
    "group_by_fields": ["customer", "waste_zone"],
    "show_groups_only": true,
    "join_query": "LEFT JOIN Customer_Record cr ON Waste_Management_Data.customer = cr.customer_id",
    "created_at": "2025-10-19T16:15:00Z",
    "updated_at": "2025-10-19T16:15:00Z"
  },
  "message": "Configuration updated successfully. New version created."
}
```

---

#### 12. Execute Report
```
POST /api/reports/:reportId/execute
```

**Request Body (optional):**
```json
{
  "parameters": {
    "start_date": "2025-01-01",
    "end_date": "2025-12-31",
    "limit": 1000
  },
  "format": "json"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "execution_id": "850e8400-e29b-41d4-a716-446655440400",
    "report_id": "650e8400-e29b-41d4-a716-446655440100",
    "execution_time_ms": 245,
    "row_count": 156,
    "results": [
      {
        "customer": "Acme Corp",
        "weight_kg": 1250.5,
        "date_recorded": "2025-10-15"
      },
      {
        "customer": "Global Industries",
        "weight_kg": 980.3,
        "date_recorded": "2025-10-14"
      }
    ],
    "executed_at": "2025-10-19T16:20:00Z"
  }
}
```

---

#### 13. Get Report Versions
```
GET /api/reports/:reportId/versions
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "950e8400-e29b-41d4-a716-446655440500",
      "report_id": "650e8400-e29b-41d4-a716-446655440100",
      "version_number": 3,
      "change_description": "Added new filter conditions and summary fields",
      "created_at": "2025-10-15T10:30:00Z",
      "created_by": {
        "id": "450e8400-e29b-41d4-a716-446655440010",
        "username": "john.doe",
        "full_name": "John Doe"
      }
    },
    {
      "id": "950e8400-e29b-41d4-a716-446655440501",
      "report_id": "650e8400-e29b-41d4-a716-446655440100",
      "version_number": 2,
      "change_description": "Updated sort order",
      "created_at": "2025-05-10T14:20:00Z",
      "created_by": {
        "id": "450e8400-e29b-41d4-a716-446655440010",
        "username": "john.doe",
        "full_name": "John Doe"
      }
    }
  ]
}
```

---

#### 14. Get Report Execution History
```
GET /api/reports/:reportId/executions
```

**Query Parameters:**
- `page` (int, optional): Page number
- `per_page` (int, optional): Items per page
- `status` (string, optional): Filter by execution status

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "850e8400-e29b-41d4-a716-446655440400",
      "report_id": "650e8400-e29b-41d4-a716-446655440100",
      "executed_by": {
        "id": "450e8400-e29b-41d4-a716-446655440010",
        "username": "john.doe",
        "full_name": "John Doe"
      },
      "execution_time_ms": 245,
      "row_count": 156,
      "status": "success",
      "error_message": null,
      "executed_at": "2025-10-19T16:20:00Z"
    }
  ],
  "meta": {
    "total": 45,
    "page": 1,
    "per_page": 20,
    "total_pages": 3
  }
}
```

---

## Additional Endpoints

#### 15. Get Available Data Sources
```
GET /api/data-sources
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "name": "Waste_Management_Data",
      "display_name": "Waste Management Data",
      "type": "table",
      "description": "Primary waste management records"
    },
    {
      "name": "Customer_Records",
      "display_name": "Customer Records",
      "type": "table",
      "description": "Customer information and profiles"
    },
    {
      "name": "Inventory_Items",
      "display_name": "Inventory Items",
      "type": "table",
      "description": "Inventory management data"
    }
  ]
}
```

---

#### 16. Get Available Fields for Data Source
```
GET /api/data-sources/:dataSourceName/fields
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "name": "record_number",
      "display_name": "Record Number",
      "type": "string",
      "is_numeric": false,
      "is_sortable": true,
      "is_filterable": true,
      "is_aggregatable": false
    },
    {
      "name": "weight_kg",
      "display_name": "Weight (kg)",
      "type": "decimal",
      "is_numeric": true,
      "is_sortable": true,
      "is_filterable": true,
      "is_aggregatable": true
    },
    {
      "name": "waste_zone",
      "display_name": "Waste Zone",
      "type": "string",
      "is_numeric": false,
      "is_sortable": true,
      "is_filterable": true,
      "is_aggregatable": false
    }
  ]
}
```

---

## Error Response Format

All API errors follow this format:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {
      "field": "Additional error context"
    }
  }
}
```

### Common Error Codes:
- `CATEGORY_NOT_FOUND` - Category doesn't exist
- `REPORT_NOT_FOUND` - Report doesn't exist
- `VALIDATION_ERROR` - Invalid request data
- `UNAUTHORIZED` - Authentication required
- `FORBIDDEN` - Insufficient permissions
- `DUPLICATE_ENTRY` - Unique constraint violation
- `CATEGORY_HAS_REPORTS` - Cannot delete category with reports
- `INVALID_CONFIGURATION` - Report configuration is invalid
- `EXECUTION_FAILED` - Report execution failed
- `SERVER_ERROR` - Internal server error

---

## Summary

### Total API Endpoints: **16**

1. GET /api/categories
2. GET /api/categories/:categoryId
3. POST /api/categories
4. PUT/PATCH /api/categories/:categoryId
5. DELETE /api/categories/:categoryId
6. GET /api/categories/:categoryId/reports
7. GET /api/reports/:reportId
8. POST /api/reports
9. PUT/PATCH /api/reports/:reportId
10. DELETE /api/reports/:reportId
11. PUT/PATCH /api/reports/:reportId/configuration
12. POST /api/reports/:reportId/execute
13. GET /api/reports/:reportId/versions
14. GET /api/reports/:reportId/executions
15. GET /api/data-sources
16. GET /api/data-sources/:dataSourceName/fields

### Total Database Tables: **6**

1. **categories** - Category management
2. **reports** - Report metadata
3. **report_configurations** - Report configuration details
4. **report_versions** - Version history
5. **report_executions** - Execution logs
6. **users** - User management

---

## Technology Stack Recommendations

### Backend:
- **Framework**: Node.js (Express/NestJS) or Python (FastAPI/Django) or Java (Spring Boot)
- **Database**: PostgreSQL (recommended for JSON support) or MySQL
- **ORM**: Prisma (Node.js), SQLAlchemy (Python), or JPA (Java)
- **Authentication**: JWT tokens with refresh mechanism
- **Caching**: Redis for frequently accessed data

### API Features:
- RESTful API design
- Rate limiting (e.g., 100 requests/minute per user)
- Request validation (using Joi, Zod, or similar)
- Pagination for list endpoints
- Sorting and filtering support
- API versioning (e.g., /api/v1/)
- Comprehensive logging and monitoring
- OpenAPI/Swagger documentation

---

## Security Considerations

1. **Authentication**: JWT-based authentication for all endpoints
2. **Authorization**: Role-based access control (RBAC)
   - Admin: Full access
   - Manager: Create, read, update categories and reports
   - User: Read and execute reports only
3. **Input Validation**: Validate all user inputs
4. **SQL Injection Prevention**: Use parameterized queries
5. **Rate Limiting**: Prevent API abuse
6. **CORS**: Configure appropriate CORS policies
7. **Audit Logging**: Track all create, update, delete operations

---

## Next Steps

1. Set up database with migrations
2. Implement authentication/authorization system
3. Create API endpoints following this specification
4. Write comprehensive API documentation (Swagger/OpenAPI)
5. Implement unit and integration tests
6. Set up monitoring and logging
7. Deploy with proper DevOps practices

---

*Document Version: 1.0*  
*Last Updated: October 19, 2025*


        {(isCreatingNewReport || isEditingReport) && (
          <div className={`overflow-hidden transition-all duration-500 ease-in-out ${isCreatingNewReport || isEditingReport ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'}`}>
            <SectionCard
              step={2}
              title={isEditingReport ? `Edit Report: ${editingReportName}` : "Create New Report"}
              description={isEditingReport ? "Update the report configuration." : "Enter details for your new report category and name."}
              footer={
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (isEditingReport) {
                        handleCancelEdit()
                      } else {
                        setIsCreatingNewReport(false)
                        setNewCategoryName('')
                        setNewReportName('')
                      }
                    }}
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-sm font-medium text-slate-200 transition hover:border-slate-600 hover:bg-slate-900"
                  >
                    {isEditingReport ? 'Cancel' : 'Hide Form'}
                  </button>
                </div>
              }
            >
              <div className="space-y-6">
                {!isEditingReport && (
                  <FieldGroup label="New Category Name">
                    <input
                      type="text"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      placeholder="Enter category name"
                      className="w-full rounded-lg border border-slate-800 bg-slate-950/80 px-3 py-2 text-sm text-slate-200 shadow-inner shadow-slate-950/40 placeholder:text-slate-500 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/40"
                    />
                  </FieldGroup>
                )}
                <FieldGroup label={isEditingReport ? "Report Name" : "Report Name"}>
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
          </div>
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
                          <button
                            type="button"
                            onClick={() => handleViewReport(report.id, report.name)}
                            className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 focus-visible:ring-emerald-300"
                          >
                            View
                          </button>
                          <button
                            type="button"
                            onClick={() => handleEditReport(report.id, report.name)}
                            className="inline-flex items-center justify-center rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-sky-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 focus-visible:ring-sky-300"
                          >
                            Edit
                          </button>
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
        <div className={`overflow-hidden transition-all duration-500 ease-in-out ${showJoinSections ? 'max-h-[5000px] opacity-100' : 'max-h-0 opacity-0'}`}>
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
      </div>
    </main>

    <div className="fixed bottom-0 left-0 right-0 z-10 border-t border-slate-800 bg-slate-950/80 py-6 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6 lg:px-8">
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

    {/* SQL Query Modal */}
    {isViewingSQLQuery && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
        <div className="relative w-full max-w-5xl max-h-[90vh] flex flex-col rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
            <h2 className="text-2xl font-bold text-slate-100">Generated SQL Query</h2>
            <button
              type="button"
              onClick={() => setIsViewingSQLQuery(false)}
              className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-800 hover:text-slate-200"
              aria-label="Close modal"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto px-6 py-4">
            <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-6">
              <pre className="overflow-x-auto text-base leading-relaxed text-emerald-400 whitespace-pre-wrap">
                <code>{currentSQLQuery}</code>
              </pre>
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t border-slate-800 px-6 py-4">
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(currentSQLQuery)
                toast.success('SQL query copied to clipboard!')
              }}
              className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-300"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Copy Query
            </button>
            <button
              type="button"
              onClick={() => setIsViewingSQLQuery(false)}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-slate-600 hover:bg-slate-800"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    )}