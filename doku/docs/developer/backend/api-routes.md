---
sidebar_position: 5
title: API Route Reference
description: Complete API endpoint documentation
---

# API Route Reference

This document provides a comprehensive reference of all API endpoints in Scoriet. All endpoints use JSON for requests and responses.

## Base URL

```
http://localhost:8000/api
https://scoriet.com/api (production)
```

## Authentication

### Bearer Token
Include JWT token in all authenticated requests:

```
Authorization: Bearer {access_token}
```

### Obtaining Token

**POST** `/oauth/token`
```json
{
    "grant_type": "password",
    "client_id": "YOUR_CLIENT_ID",
    "client_secret": "YOUR_CLIENT_SECRET",
    "username": "user@example.com",
    "password": "password",
    "scope": "*"
}
```

## Authentication Routes

### Register User
**POST** `/auth/register`

Create new user account.

**Request**:
```json
{
    "name": "John Doe",
    "username": "johndoe",
    "email": "john@example.com",
    "password": "securepassword",
    "password_confirmation": "securepassword",
    "language": "en",
    "invitation_token": "optional_token"
}
```

**Response** (201):
```json
{
    "message": "Registration successful",
    "user": { /* user data */ },
    "email_verification_required": true,
    "has_pending_invitation": false
}
```

### Login User
**POST** `/auth/login`

Authenticate user and receive token.

**Request**:
```json
{
    "email": "john@example.com",
    "password": "password",
    "device_id": "optional_device_id"
}
```

**Response** (200):
```json
{
    "message": "Login successful",
    "user": { /* user data */ },
    "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
    "token_type": "Bearer",
    "expires_in": 86400,
    "has_pending_invitation": false,
    "monthly_credits_awarded": true
}
```

**2FA Required Response** (200):
```json
{
    "message": "Two-factor authentication required",
    "two_factor_required": true,
    "two_factor_token": "temp_token_xxx",
    "needs_reverification": false
}
```

### Two-Factor Authentication
**POST** `/auth/login-2fa`

Complete login with 2FA code.

**Request**:
```json
{
    "two_factor_token": "temp_token_xxx",
    "code": "123456",
    "trust_device": true,
    "device_id": "device_id",
    "browser": "Chrome"
}
```

**Response** (200):
```json
{
    "message": "Login successful",
    "user": { /* user data */ },
    "access_token": "...",
    "recovery_code_used": false,
    "recovery_codes_remaining": 10
}
```

### Forgot Password
**POST** `/auth/forgot-password`

Request password reset link.

**Request**:
```json
{
    "email": "john@example.com"
}
```

**Response** (200):
```json
{
    "message": "Password reset link sent to your email"
}
```

### Reset Password
**POST** `/auth/reset-password`

Reset password with token.

**Request**:
```json
{
    "token": "reset_token_xxx",
    "email": "john@example.com",
    "password": "newpassword",
    "password_confirmation": "newpassword"
}
```

**Response** (200):
```json
{
    "message": "Password reset successful"
}
```

### Verify Email
**POST** `/auth/email/verify/{id}/{hash}`

Confirm email address.

**Response** (200):
```json
{
    "message": "Email verified successfully",
    "user": { /* user data */ },
    "access_token": "...",
    "invitation_auto_accepted": false,
    "project_name": null
}
```

### Resend Verification Email
**POST** `/auth/email/resend`

Request new verification email. Requires authentication.

**Response** (200):
```json
{
    "message": "Verification email sent"
}
```

## User Routes

All user routes require authentication: `Authorization: Bearer {token}`

### Get Current User
**GET** `/user`

Retrieve authenticated user profile.

**Response** (200):
```json
{
    "id": 1,
    "name": "John Doe",
    "username": "johndoe",
    "email": "john@example.com",
    "language": "en",
    "theme": "dark",
    "email_verified_at": "2026-01-15T10:30:00Z",
    "is_seller": false,
    "created_at": "2026-01-15T10:30:00Z"
}
```

### Update Profile
**PUT** `/profile`

Update user profile information.

**Request**:
```json
{
    "name": "John Doe Updated",
    "email": "newemail@example.com",
    "language": "de",
    "kanban_initials": "JD",
    "kanban_color": "#FF5733"
}
```

**Response** (200):
```json
{
    "message": "Profile updated successfully",
    "user": { /* updated user data */ }
}
```

### Update Password
**PUT** `/profile/password`

Change user password.

**Request**:
```json
{
    "current_password": "oldpassword",
    "password": "newpassword",
    "password_confirmation": "newpassword"
}
```

**Response** (200):
```json
{
    "message": "Password changed successfully"
}
```

### Update Language
**PUT** `/profile/language`

Change preferred language.

**Request**:
```json
{
    "language": "de"
}
```

**Response** (200):
```json
{
    "message": "Language updated",
    "language": "de"
}
```

### Update Theme
**PUT** `/profile/theme`

Change theme preference.

**Request**:
```json
{
    "theme": "dark"
}
```

**Response** (200):
```json
{
    "message": "Theme updated",
    "theme": "dark"
}
```

### Delete Account
**DELETE** `/profile`

Permanently delete user account.

**Request**:
```json
{
    "password": "password"
}
```

**Response** (200):
```json
{
    "message": "Account deleted successfully"
}
```

### Update Seller Profile
**PUT** `/profile/seller`

Configure seller account settings.

**Request**:
```json
{
    "is_seller": true,
    "company_name": "Acme Corp",
    "company_address": "123 Main St",
    "company_country": "US",
    "vat_id": "VAT123456",
    "payout_method": "bank_transfer",
    "bank_iban": "DE89370400440532013000",
    "bank_account_holder": "Acme Corp"
}
```

**Response** (200):
```json
{
    "message": "Seller profile updated",
    "user": { /* updated user data */ }
}
```

## Project Routes

### List Projects
**GET** `/projects`

List all projects owned by user.

**Query Parameters**:
- `public` (boolean) - Show public projects gallery instead
- `page` (integer) - Page number
- `per_page` (integer) - Results per page

**Response** (200):
```json
{
    "data": [
        {
            "id": 1,
            "name": "Mobile App Backend",
            "description": "REST API",
            "owner": { "id": 1, "name": "John", "username": "john" },
            "is_public": false,
            "teams_count": 1,
            "schemas_count": 3,
            "templates_count": 5,
            "subscription": {
                "expires_at": "2026-05-15T00:00:00Z",
                "is_expired": false,
                "days_remaining": 30
            }
        }
    ],
    "meta": { "current_page": 1, "total": 10, "per_page": 15 }
}
```

### Get Project
**GET** `/projects/{projectId}`

Retrieve single project with all details.

**Response** (200):
```json
{
    "id": 1,
    "name": "Mobile App Backend",
    "description": "REST API for mobile app",
    "owner_id": 1,
    "is_public": false,
    "is_locked": false,
    "teams": [ /* team data */ ],
    "schemas_count": 3,
    "templates_count": 5,
    "forms_count": 2,
    "reports_count": 1,
    "kanban_boards_count": 1,
    "subscription": { /* subscription data */ }
}
```

### Create Project
**POST** `/projects`

Create new project.

**Request**:
```json
{
    "name": "New Project",
    "description": "Project description",
    "is_public": false
}
```

**Response** (201):
```json
{
    "message": "Project created successfully",
    "project": { /* project data */ }
}
```

### Update Project
**PUT** `/projects/{projectId}`

Update project settings.

**Request**:
```json
{
    "name": "Updated Name",
    "description": "New description",
    "is_public": true,
    "allow_join_requests": true,
    "join_code": "ABC123"
}
```

**Response** (200):
```json
{
    "message": "Project updated successfully",
    "project": { /* updated project data */ }
}
```

### Delete Project
**DELETE** `/projects/{projectId}`

Soft-delete a project.

**Response** (200):
```json
{
    "message": "Project deleted successfully"
}
```

### Lock Project
**POST** `/projects/{projectId}/lock`

Prevent modifications to project.

**Response** (200):
```json
{
    "message": "Project locked successfully"
}
```

### Unlock Project
**POST** `/projects/{projectId}/unlock`

Allow modifications to project.

**Response** (200):
```json
{
    "message": "Project unlocked successfully"
}
```

## Schema Routes

### List Schemas
**GET** `/projects/{projectId}/schemas`

List all schemas in project.

**Response** (200):
```json
{
    "data": [
        {
            "id": 1,
            "name": "MySQL Database",
            "database_type": "MySQL",
            "tables_count": 5,
            "created_at": "2026-01-15T10:30:00Z"
        }
    ]
}
```

### Get Schema
**GET** `/projects/{projectId}/schemas/{schemaId}`

Get schema with all tables and fields.

**Response** (200):
```json
{
    "id": 1,
    "name": "Database Schema",
    "database_type": "MySQL",
    "tables": [
        {
            "id": 1,
            "table_name": "users",
            "fields": [
                {
                    "id": 1,
                    "field_name": "id",
                    "field_type": "INT",
                    "is_nullable": false,
                    "is_auto_increment": true
                },
                {
                    "id": 2,
                    "field_name": "email",
                    "field_type": "VARCHAR",
                    "length": 255,
                    "is_nullable": false
                }
            ],
            "constraints": [ /* foreign keys, unique keys */ ]
        }
    ]
}
```

### Create Schema (Parse SQL)
**POST** `/projects/{projectId}/schemas`

Create schema from SQL.

**Request**:
```json
{
    "name": "New Database",
    "sql_text": "CREATE TABLE users (id INT AUTO_INCREMENT PRIMARY KEY, email VARCHAR(255))",
    "database_type": "MySQL"
}
```

**Response** (201):
```json
{
    "message": "Schema created successfully",
    "schema": { /* schema data with parsed tables */ }
}
```

### Update Schema
**PUT** `/projects/{projectId}/schemas/{schemaId}`

Update schema.

**Request**:
```json
{
    "name": "Updated Name",
    "sql_text": "..."
}
```

**Response** (200):
```json
{
    "message": "Schema updated successfully",
    "schema": { /* updated schema */ }
}
```

### Delete Schema
**DELETE** `/projects/{projectId}/schemas/{schemaId}`

Delete schema.

**Response** (200):
```json
{
    "message": "Schema deleted successfully"
}
```

### Export Schema
**GET** `/projects/{projectId}/schemas/{schemaId}/export`

Export schema as SQL.

**Query Parameters**:
- `format` - sql (default), json

**Response**: File download (SQL or JSON)

### Compare Schemas
**POST** `/projects/{projectId}/schemas/compare`

Find differences between schemas.

**Request**:
```json
{
    "schema_id_1": 1,
    "schema_id_2": 2
}
```

**Response** (200):
```json
{
    "differences": {
        "added_tables": ["new_table"],
        "removed_tables": [],
        "modified_tables": {
            "users": {
                "added_columns": ["username"],
                "removed_columns": [],
                "modified_columns": ["email"]
            }
        }
    },
    "migration_sql": "ALTER TABLE users ADD COLUMN username VARCHAR(255);"
}
```

## Template Routes

### List Templates
**GET** `/projects/{projectId}/templates`

List all templates in project.

**Response** (200):
```json
{
    "data": [
        {
            "id": 1,
            "name": "Laravel Model",
            "description": "Generate Laravel Eloquent models",
            "engine_type": "ultimate",
            "created_at": "2026-01-15T10:30:00Z"
        }
    ]
}
```

### Get Template
**GET** `/projects/{projectId}/templates/{templateId}`

Get template with variables and files.

**Response** (200):
```json
{
    "id": 1,
    "name": "Laravel Model",
    "description": "Generate Laravel models",
    "content": "class {:classname:} { ... }",
    "engine_type": "ultimate",
    "variables": [
        {
            "id": 1,
            "name": "classname",
            "description": "Name of the class",
            "type": "string",
            "required": true,
            "default_value": null
        }
    ],
    "files": [
        {
            "id": 1,
            "file_name": "app/Models/{:classname:}.php",
            "order": 1
        }
    ]
}
```

### Create Template
**POST** `/projects/{projectId}/templates`

Create new template.

**Request**:
```json
{
    "name": "New Template",
    "description": "Template description",
    "content": "Template content with {:placeholders:}",
    "engine_type": "ultimate"
}
```

**Response** (201):
```json
{
    "message": "Template created successfully",
    "template": { /* template data */ }
}
```

### Update Template
**PUT** `/projects/{projectId}/templates/{templateId}`

Update template.

**Request**:
```json
{
    "name": "Updated Name",
    "content": "Updated content"
}
```

**Response** (200):
```json
{
    "message": "Template updated successfully",
    "template": { /* updated template */ }
}
```

### Delete Template
**DELETE** `/projects/{projectId}/templates/{templateId}`

Delete template.

**Response** (200):
```json
{
    "message": "Template deleted successfully"
}
```

### Execute Template
**POST** `/projects/{projectId}/templates/{templateId}/execute`

Run template with variables to generate code.

**Request**:
```json
{
    "classname": "User",
    "properties": [
        { "name": "id", "type": "int" },
        { "name": "email", "type": "string" }
    ]
}
```

**Response** (200):
```json
{
    "output": "class User { ... }",
    "files": {
        "app/Models/User.php": "class User { ... }"
    }
}
```

### Preview Template
**POST** `/projects/{projectId}/templates/{templateId}/preview`

Preview template output without saving.

**Request**: Same as execute

**Response** (200):
```json
{
    "preview": "Generated output preview",
    "warnings": []
}
```

## Team Routes

### List Teams
**GET** `/teams`

List teams user is member of.

**Response** (200):
```json
{
    "data": [
        {
            "id": 1,
            "name": "Development Team",
            "owner_id": 1,
            "members_count": 5,
            "projects_count": 3
        }
    ]
}
```

### Create Team
**POST** `/teams`

Create new team.

**Request**:
```json
{
    "name": "New Team",
    "description": "Team description"
}
```

**Response** (201):
```json
{
    "message": "Team created successfully",
    "team": { /* team data */ }
}
```

### Update Team
**PUT** `/teams/{teamId}`

Update team settings.

**Request**:
```json
{
    "name": "Updated Team Name",
    "description": "New description"
}
```

**Response** (200):
```json
{
    "message": "Team updated successfully",
    "team": { /* updated team */ }
}
```

### Delete Team
**DELETE** `/teams/{teamId}`

Delete team.

**Response** (200):
```json
{
    "message": "Team deleted successfully"
}
```

### List Team Members
**GET** `/teams/{teamId}/members`

Get team members.

**Response** (200):
```json
{
    "data": [
        {
            "id": 1,
            "user": { "id": 1, "name": "John", "email": "john@example.com" },
            "role": { "id": 1, "name": "editor" },
            "joined_at": "2026-01-15T10:30:00Z"
        }
    ]
}
```

### Add Team Member
**POST** `/teams/{teamId}/members`

Add user to team.

**Request**:
```json
{
    "email": "newmember@example.com",
    "role_id": 2
}
```

**Response** (201):
```json
{
    "message": "Member added successfully"
}
```

### Remove Team Member
**DELETE** `/teams/{teamId}/members/{userId}`

Remove user from team.

**Response** (200):
```json
{
    "message": "Member removed successfully"
}
```

## Kanban Routes

### List Kanban Boards
**GET** `/projects/{projectId}/kanban`

List kanban boards in project.

**Response** (200):
```json
{
    "data": [
        {
            "id": 1,
            "name": "Development Tasks",
            "columns": [
                {
                    "id": 1,
                    "name": "To Do",
                    "cards": [
                        {
                            "id": 1,
                            "title": "Implement feature",
                            "description": "Add new feature",
                            "priority": "high",
                            "due_date": "2026-02-15",
                            "assignee": { "id": 1, "name": "John" }
                        }
                    ]
                }
            ]
        }
    ]
}
```

### Create Board
**POST** `/projects/{projectId}/kanban`

Create new kanban board.

**Request**:
```json
{
    "name": "New Board",
    "columns": ["To Do", "In Progress", "Done"]
}
```

**Response** (201):
```json
{
    "message": "Board created successfully",
    "board": { /* board data */ }
}
```

### Move Card
**POST** `/projects/{projectId}/kanban/cards/{cardId}/move`

Move card to different column.

**Request**:
```json
{
    "column_id": 2,
    "order": 1
}
```

**Response** (200):
```json
{
    "message": "Card moved successfully"
}
```

## Message Routes

### List Message Threads
**GET** `/messages/threads`

List all message threads user is in.

**Response** (200):
```json
{
    "data": [
        {
            "id": 1,
            "subject": "Feature Discussion",
            "project_id": 1,
            "created_by": 1,
            "messages_count": 5,
            "latest_message_at": "2026-01-20T15:30:00Z"
        }
    ]
}
```

### Get Thread Messages
**GET** `/messages/threads/{threadId}`

Get messages in a thread.

**Response** (200):
```json
{
    "id": 1,
    "subject": "Feature Discussion",
    "messages": [
        {
            "id": 1,
            "user_id": 1,
            "user": { "id": 1, "name": "John" },
            "body": "Great idea!",
            "created_at": "2026-01-20T15:30:00Z",
            "attachments": []
        }
    ]
}
```

### Send Message
**POST** `/messages/threads/{threadId}`

Post new message in thread.

**Request**:
```json
{
    "body": "This is my message"
}
```

**Response** (201):
```json
{
    "message": "Message sent successfully",
    "message_data": { /* message data */ }
}
```

### Upload Message Attachment
**POST** `/messages/{messageId}/attachments`

Attach file to message.

**Request**: Multipart form with `file` field

**Response** (201):
```json
{
    "message": "File attached successfully",
    "attachment": { /* attachment data */ }
}
```

## Subscription Routes

### List Subscriptions
**GET** `/subscriptions`

List user's subscriptions.

**Response** (200):
```json
{
    "data": [
        {
            "id": 1,
            "project_id": 1,
            "plan_id": 1,
            "started_at": "2026-01-15T00:00:00Z",
            "expires_at": "2026-04-15T00:00:00Z",
            "credits_allocated": 1000,
            "credits_used": 250,
            "is_expired": false
        }
    ]
}
```

### Purchase Credits
**POST** `/credits/purchase`

Buy credit package.

**Request**:
```json
{
    "package_id": 1,
    "payment_method": "stripe"
}
```

**Response** (201):
```json
{
    "message": "Purchase successful",
    "transaction": { /* transaction data */ }
}
```

## Webhooks

### Stripe Webhook
**POST** `/stripe/webhook`

Webhook endpoint for Stripe events. No authentication required but signature validated.

**Handles**:
- `payment_intent.succeeded` - Payment completed
- `payment_intent.payment_failed` - Payment failed
- `charge.refunded` - Refund processed

### PayPal Webhook
**POST** `/paypal/webhook`

Webhook endpoint for PayPal events.

## Error Responses

### Validation Error (422)
```json
{
    "message": "Validation failed",
    "errors": {
        "email": ["The email field is required"],
        "password": ["The password must be at least 8 characters"]
    }
}
```

### Unauthorized (401)
```json
{
    "message": "Unauthorized"
}
```

### Forbidden (403)
```json
{
    "message": "You do not have permission to access this resource"
}
```

### Not Found (404)
```json
{
    "message": "Resource not found"
}
```

### Server Error (500)
```json
{
    "message": "An error occurred while processing your request"
}
```

## Rate Limiting

API requests are limited per user:
- Authenticated requests: 1000 requests per hour
- Public requests: 100 requests per hour

Rate limit headers:
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1642345234
```

## Pagination

List endpoints support pagination:

**Query Parameters**:
- `page` (integer, default: 1) - Page number
- `per_page` (integer, default: 15) - Items per page

**Response**:
```json
{
    "data": [ /* items */ ],
    "links": {
        "first": "...",
        "last": "...",
        "next": "...",
        "prev": "..."
    },
    "meta": {
        "current_page": 1,
        "total": 100,
        "per_page": 15,
        "last_page": 7
    }
}
```

## Next Steps

- Read [Controllers](./controllers.md) for implementation details
- Read [Services](./services.md) for business logic
- Read [Models](./models.md) for data relationships
