# Scoriet CLI API Documentation

Complete API documentation for the Scoriet CLI client backend.

**Base URL:** `http://10.0.0.8/cli`

---

## 📋 Table of Contents

1. [Authentication](#authentication)
2. [Projects](#projects)
3. [Database Management](#database-management)
4. [Templates](#templates)
5. [Code Generation](#code-generation)
6. [System Info](#system-info)

---

## 🔐 Authentication

### 1. Authorize (Get Access Token)

**Endpoint:** `POST /cli/auth/authorize`

**Description:** Create a Personal Access Token for CLI authentication.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "client_name": "My MacBook Pro" // Optional
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Authorization successful",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "user@example.com",
    "user_type": "premium"
  },
  "token": {
    "access_token": "eyJ0eXAiOiJKV1QiLC...",
    "token_type": "Bearer",
    "expires_at": "2025-12-18T10:30:00.000000Z"
  }
}
```

**Usage in Postman:**
1. Save `access_token` to environment variable
2. Add to all subsequent requests: `Authorization: Bearer {{access_token}}`

---

### 2. Get Current User (whoami)

**Endpoint:** `GET /cli/auth/whoami`

**Headers:** `Authorization: Bearer {token}`

**Response (200):**
```json
{
  "success": true,
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "user@example.com",
    "user_type": "premium",
    "email_verified_at": "2025-01-10T10:00:00.000000Z",
    "created_at": "2025-01-01T10:00:00.000000Z"
  }
}
```

---

### 3. Verify Token

**Endpoint:** `GET /cli/auth/verify`

**Headers:** `Authorization: Bearer {token}`

**Response (200):**
```json
{
  "success": true,
  "valid": true,
  "token": {
    "expires_at": "2025-12-18T10:30:00.000000Z",
    "revoked": false,
    "scopes": ["cli"]
  },
  "user": {
    "id": 1,
    "email": "user@example.com"
  }
}
```

---

### 4. Logout (Revoke Token)

**Endpoint:** `POST /cli/auth/logout`

**Headers:** `Authorization: Bearer {token}`

**Response (200):**
```json
{
  "success": true,
  "message": "Token revoked successfully"
}
```

---

## 📁 Projects

### 1. List All Projects

**Endpoint:** `GET /cli/projects`

**Headers:** `Authorization: Bearer {token}`

**Response (200):**
```json
{
  "success": true,
  "projects": [
    {
      "id": 1,
      "name": "MyShopApp",
      "description": "E-commerce application",
      "is_owner": true,
      "access_type": "owner",
      "created_at": "2025-01-01T10:00:00.000000Z",
      "updated_at": "2025-01-15T12:30:00.000000Z",
      "counts": {
        "templates": 2,
        "schemas": 1,
        "databases": 1,
        "teams": 0,
        "members": 1
      }
    }
  ],
  "total": 1
}
```

---

### 2. Create Project

**Endpoint:** `POST /cli/projects`

**Headers:** `Authorization: Bearer {token}`

**Request Body:**
```json
{
  "name": "MyNewProject",
  "description": "Project description",
  "is_public": false,
  "allow_join_requests": false
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Project created successfully",
  "project": {
    "id": 42,
    "name": "MyNewProject",
    "description": "Project description",
    "is_public": false,
    "created_at": "2025-11-18T10:00:00.000000Z"
  }
}
```

---

### 3. Get Project Details

**Endpoint:** `GET /cli/projects/{id}`

**Headers:** `Authorization: Bearer {token}`

**Response (200):**
```json
{
  "success": true,
  "project": {
    "id": 1,
    "name": "MyShopApp",
    "description": "E-commerce application",
    "owner": {
      "id": 1,
      "name": "John Doe",
      "email": "user@example.com"
    },
    "is_public": false,
    "allow_join_requests": false,
    "created_at": "2025-01-01T10:00:00.000000Z",
    "updated_at": "2025-01-15T12:30:00.000000Z",
    "counts": {
      "templates": 2,
      "schemas": 1,
      "databases": 1,
      "teams": 0,
      "members": 1
    },
    "schemas": [
      {
        "id": 5,
        "name": "shop_database",
        "created_at": "2025-01-10T10:00:00.000000Z"
      }
    ],
    "templates": [
      {
        "id": 9,
        "name": "Laravel API",
        "language": "PHP"
      }
    ]
  }
}
```

---

### 4. Update Project

**Endpoint:** `PUT /cli/projects/{id}`

**Headers:** `Authorization: Bearer {token}`

**Request Body:**
```json
{
  "name": "UpdatedProjectName",
  "description": "Updated description"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Project updated successfully",
  "project": {
    "id": 1,
    "name": "UpdatedProjectName",
    "description": "Updated description",
    "is_public": false,
    "updated_at": "2025-11-18T10:30:00.000000Z"
  }
}
```

---

### 5. Delete Project

**Endpoint:** `DELETE /cli/projects/{id}`

**Headers:** `Authorization: Bearer {token}`

**Response (200):**
```json
{
  "success": true,
  "message": "Project deleted successfully"
}
```

---

### 6. Get Project Settings

**Endpoint:** `GET /cli/projects/{id}/settings`

**Headers:** `Authorization: Bearer {token}`

**Response (200):**
```json
{
  "success": true,
  "settings": {
    "base_namespace": "App",
    "archive_format": "zip",
    "is_public": false,
    "allow_join_requests": false
  }
}
```

---

## 🗄️ Database Management

### 1. Import Database Schema (SQL)

**Endpoint:** `POST /cli/database/import-sql`

**Headers:** `Authorization: Bearer {token}`

**Request Body:**
```json
{
  "project_id": 1,
  "schema_name": "my_database",
  "sql_content": "CREATE TABLE users (\n  id INT PRIMARY KEY AUTO_INCREMENT,\n  name VARCHAR(255) NOT NULL\n);",
  "description": "User database schema"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Database schema imported successfully",
  "schema": {
    "id": 5,
    "name": "my_database",
    "version": 1,
    "tables_count": 1
  }
}
```

---

### 2. Export Database Schema

**Endpoint:** `POST /cli/database/export`

**Headers:** `Authorization: Bearer {token}`

**Request Body:**
```json
{
  "schema_id": 5,
  "version_id": 12,  // Optional
  "format": "mysql"  // Optional: mysql, postgresql, sqlite
}
```

**Response (200):**
```json
{
  "success": true,
  "schema": {
    "id": 5,
    "name": "my_database",
    "version": 1,
    "tables_count": 137
  },
  "sql": "-- Schema: my_database\n-- Version: 1\n\nCREATE TABLE users (\n  ...);"
}
```

---

### 3. List Databases/Schemas

**Endpoint:** `GET /cli/database/list?project_id=1`

**Headers:** `Authorization: Bearer {token}`

**Response (200):**
```json
{
  "success": true,
  "schemas": [
    {
      "id": 5,
      "name": "my_database",
      "description": "User database schema",
      "version": 2,
      "version_id": 15,
      "tables_count": 137,
      "created_at": "2025-01-10T10:00:00.000000Z"
    }
  ],
  "total": 1
}
```

---

### 4. Get Database Structure

**Endpoint:** `GET /cli/database/{schemaId}/structure`

**Headers:** `Authorization: Bearer {token}`

**Response (200):**
```json
{
  "success": true,
  "schema": {
    "id": 5,
    "name": "my_database",
    "version": 1
  },
  "tables": [
    {
      "name": "users",
      "fields": [
        {
          "name": "id",
          "type": "INT",
          "length": null,
          "nullable": false,
          "default": null,
          "auto_increment": true
        },
        {
          "name": "name",
          "type": "VARCHAR",
          "length": 255,
          "nullable": false,
          "default": null,
          "auto_increment": false
        }
      ],
      "constraints": [
        {
          "type": "PRIMARY KEY",
          "name": "PRIMARY",
          "field": "id",
          "referenced_table": null,
          "referenced_field": null
        }
      ]
    }
  ]
}
```

---

## 📦 Templates

### 1. List All Templates

**Endpoint:** `GET /cli/templates`

**Headers:** `Authorization: Bearer {token}`

**Response (200):**
```json
{
  "success": true,
  "templates": [
    {
      "id": 9,
      "name": "Laravel API",
      "description": "REST API template with Laravel",
      "language": "PHP",
      "framework": "Laravel",
      "is_system": true,
      "is_public": true,
      "is_owned": false,
      "created_at": "2025-01-01T10:00:00.000000Z"
    }
  ],
  "total": 1
}
```

---

### 2. Get Template Details

**Endpoint:** `GET /cli/templates/{id}`

**Headers:** `Authorization: Bearer {token}`

**Response (200):**
```json
{
  "success": true,
  "template": {
    "id": 9,
    "name": "Laravel API",
    "description": "REST API template with Laravel",
    "language": "PHP",
    "framework": "Laravel",
    "is_system": true,
    "is_public": true,
    "files_count": 25,
    "files": [
      {
        "id": 123,
        "filename": "UserController.php",
        "filepath": "app/Http/Controllers/UserController.php",
        "content_size": 2048
      }
    ],
    "created_at": "2025-01-01T10:00:00.000000Z"
  }
}
```

---

### 3. Link Template to Project

**Endpoint:** `POST /cli/templates/{id}/link`

**Headers:** `Authorization: Bearer {token}`

**Request Body:**
```json
{
  "project_id": 1
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Template linked to project successfully",
  "template": {
    "id": 9,
    "name": "Laravel API"
  },
  "project": {
    "id": 1,
    "name": "MyShopApp"
  }
}
```

---

### 4. Unlink Template from Project

**Endpoint:** `POST /cli/templates/{id}/unlink`

**Headers:** `Authorization: Bearer {token}`

**Request Body:**
```json
{
  "project_id": 1
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Template unlinked from project successfully"
}
```

---

### 5. List Project Templates

**Endpoint:** `GET /cli/templates/project/{projectId}`

**Headers:** `Authorization: Bearer {token}`

**Response (200):**
```json
{
  "success": true,
  "project": {
    "id": 1,
    "name": "MyShopApp"
  },
  "templates": [
    {
      "id": 9,
      "name": "Laravel API",
      "description": "REST API template with Laravel",
      "language": "PHP",
      "framework": "Laravel"
    }
  ],
  "total": 1
}
```

---

## 🚀 Code Generation

### 1. Generate Code

**Endpoint:** `POST /cli/generate`

**Headers:** `Authorization: Bearer {token}`

**Request Body:**
```json
{
  "project_id": 1,
  "template_id": 9,
  "output_format": "zip"  // Optional: zip, tar, tar.gz
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Code generation completed successfully",
  "job_id": "a3f2e1d4-5c6b-7a8e-9f0d-1c2b3a4e5f6g",
  "project": {
    "id": 1,
    "name": "MyShopApp"
  },
  "template": {
    "id": 9,
    "name": "Laravel API"
  },
  "generation": {
    "files_count": 247,
    "gtree_nodes": 350
  },
  "download_url": "/cli/generate/download/a3f2e1d4-5c6b-7a8e-9f0d-1c2b3a4e5f6g"
}
```

---

### 2. Get Generation Progress

**Endpoint:** `GET /cli/generate/progress/{jobId}`

**Headers:** `Authorization: Bearer {token}`

**Response (200):**
```json
{
  "success": true,
  "job_id": "a3f2e1d4-5c6b-7a8e-9f0d-1c2b3a4e5f6g",
  "status": "completed",
  "progress": 100,
  "files_count": 247,
  "created_at": "2025-11-18T10:30:00.000000Z"
}
```

---

### 3. Download Generated Files

**Endpoint:** `GET /cli/generate/download/{jobId}`

**Headers:** `Authorization: Bearer {token}`

**Response:** Binary ZIP file download

**Note:** This endpoint returns a ZIP file for download, not JSON.

---

### 4. Cancel Generation Job

**Endpoint:** `POST /cli/generate/cancel/{jobId}`

**Headers:** `Authorization: Bearer {token}`

**Response (200):**
```json
{
  "success": true,
  "message": "Job already completed (cannot cancel)",
  "status": "completed"
}
```

---

## ℹ️ System Info

### 1. Get API Version

**Endpoint:** `GET /cli/system/version`

**Headers:** `Authorization: Bearer {token}`

**Response (200):**
```json
{
  "version": "1.0.0",
  "api_version": "1.0",
  "scoriet_version": "1.0.0"
}
```

---

### 2. Health Check

**Endpoint:** `GET /cli/system/health`

**Headers:** `Authorization: Bearer {token}`

**Response (200):**
```json
{
  "status": "healthy",
  "timestamp": "2025-11-18T10:30:00.000000Z"
}
```

---

## 🔧 Postman Setup

### Quick Start

1. **Create New Environment in Postman:**
   - Name: `Scoriet CLI`
   - Variables:
     - `base_url`: `http://10.0.0.8/cli`
     - `access_token`: (leave empty, will be set after authorization)

2. **Authorize:**
   - Call `POST /cli/auth/authorize`
   - Copy `access_token` from response
   - Save to environment variable

3. **Set Authorization Header:**
   - For all protected endpoints, add header:
     - Key: `Authorization`
     - Value: `Bearer {{access_token}}`

4. **Test Endpoints:**
   - Start with `GET /cli/auth/whoami` to verify authentication
   - Then test other endpoints as needed

---

## 🛡️ Error Responses

All endpoints return consistent error responses:

**401 Unauthorized:**
```json
{
  "success": false,
  "message": "Unauthenticated."
}
```

**403 Forbidden:**
```json
{
  "success": false,
  "message": "Access denied"
}
```

**404 Not Found:**
```json
{
  "success": false,
  "message": "Resource not found"
}
```

**422 Validation Error:**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": {
    "email": ["The email field is required."]
  }
}
```

**500 Server Error:**
```json
{
  "success": false,
  "message": "Internal server error",
  "error": "Detailed error message"
}
```

---

## 🎯 Complete Workflow Example

### Scenario: Create project, import database, link template, generate code

```bash
# 1. Authorize
POST /cli/auth/authorize
Body: { "email": "user@example.com", "password": "password" }
→ Save access_token

# 2. Create project
POST /cli/projects
Body: { "name": "MyApp", "description": "My application" }
→ project_id: 42

# 3. Import database
POST /cli/database/import-sql
Body: {
  "project_id": 42,
  "schema_name": "myapp_db",
  "sql_content": "CREATE TABLE users (...);"
}
→ schema_id: 15

# 4. List available templates
GET /cli/templates
→ Select template_id: 9

# 5. Link template to project
POST /cli/templates/9/link
Body: { "project_id": 42 }

# 6. Generate code
POST /cli/generate
Body: { "project_id": 42, "template_id": 9 }
→ job_id: "abc-123-def-456"

# 7. Download generated files
GET /cli/generate/download/abc-123-def-456
→ Downloads ZIP file
```

---

## 📝 Notes

- All timestamps are in ISO 8601 format (UTC)
- Personal Access Tokens expire after a configured period (default: 1 year)
- Generated files are stored temporarily and should be downloaded promptly
- For production use, consider implementing rate limiting
- The CLI API uses the same database as the web application

---

**Generated:** 2025-11-18
**API Version:** 1.0.0
