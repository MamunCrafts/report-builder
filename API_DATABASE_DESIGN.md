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
