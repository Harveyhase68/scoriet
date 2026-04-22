---
sidebar_position: 1
title: Controllers Overview
description: Overview of all controller classes in Scoriet
---

# Controllers Overview

Controllers in Scoriet handle all incoming HTTP requests and coordinate with services, models, and middleware to produce responses. The application uses two main organizational patterns: traditional controllers for web/form routes and API controllers for REST endpoints.

## Directory Structure

```
app/Http/Controllers/
├── (Root Level)          # Web and main controllers
├── Api/                  # RESTful API endpoints
├── Admin/                # Admin panel controllers
├── Settings/             # User settings controllers
└── Cli/                  # CLI-related controllers (if applicable)
```

## Root Level Controllers

### AuthController
**File**: `app/Http/Controllers/AuthController.php`

Handles all authentication-related operations including user registration, login, password management, and email verification.

**Key Methods**:
- `register(Request $request)` - Create new user account with validation
- `login(Request $request)` - Authenticate user with email/password
- `loginWith2FA(Request $request)` - Complete login after 2FA verification
- `completeLogin()` - Generate JWT token and return user data
- `forgotPassword(Request $request)` - Send password reset link
- `resetPassword(Request $request)` - Reset password with token
- `updateProfile(Request $request)` - Update user profile information
- `updatePassword(Request $request)` - Change user password
- `verifyEmail(Request $request)` - Confirm email address
- `deleteAccount(Request $request)` - Delete user account
- `updateLanguage(Request $request)` - Change user's preferred language
- `updateTheme(Request $request)` - Change user's theme preference

**Authentication Flow**:
1. User submits email/password
2. System validates credentials
3. If 2FA enabled: creates temporary 2FA token
4. If 2FA not needed: creates personal access token
5. Returns user data and access token

**Example**:
```php
// User registration with validation
public function register(Request $request)
{
    $validator = Validator::make($request->all(), [
        'name' => 'required|string|max:255',
        'username' => 'required|string|max:30|unique:users|regex:/^[a-z0-9_-]+$/',
        'email' => 'required|string|email|max:255|unique:users',
        'password' => 'required|string|min:8|confirmed',
        'language' => 'nullable|string|in:en,de,fr',
    ]);
    
    // Honeypot protection against bots
    if ($request->filled('math_check')) {
        return response()->json(['message' => 'Success'], 201);
    }
    
    // Create user with hashed password
    $user = User::create([
        'name' => $request->name,
        'password' => Hash::make($request->password),
    ]);
    
    return response()->json($user, 201);
}
```

### CustomTokenController
**File**: `app/Http/Controllers/CustomTokenController.php`

OAuth2 token endpoint implementation for issuing personal access tokens with custom email verification checks.

### SchemaController
**File**: `app/Http/Controllers/SchemaController.php`

Manages database schemas (non-API version).

### SqlParserController
**File**: `app/Http/Controllers/SqlParserController.php`

Handles SQL parsing requests and schema analysis.

### TemplateController
**File**: `app/Http/Controllers/TemplateController.php`

Manages code templates (non-API version).

### UserController
**File**: `app/Http/Controllers/UserController.php`

User management operations including profile retrieval and updates.

### TeamController
**File**: `app/Http/Controllers/TeamController.php`

Team CRUD operations and team member management.

### TeamInvitationController
**File**: `app/Http/Controllers/TeamInvitationController.php`

Handles team invitations - sending, accepting, and declining.

### ProjectInvitationController
**File**: `app/Http/Controllers/ProjectInvitationController.php`

Manages project-level invitations for sharing projects with other users.

### ProjectApplicationController
**File**: `app/Http/Controllers/ProjectApplicationController.php`

Handles join requests for public projects.

### PublicProjectController
**File**: `app/Http/Controllers/PublicProjectController.php`

Manages public project visibility and access.

### SchemaExportController
**File**: `app/Http/Controllers/SchemaExportController.php`

Exports database schemas in various formats (SQL, JSON, etc).

### DiagramLayoutController
**File**: `app/Http/Controllers/DiagramLayoutController.php`

Manages diagram layout configurations for visual representation of schemas.

### TwoFactorController
**File**: `app/Http/Controllers/TwoFactorController.php`

Two-factor authentication setup and management.

### PageController
**File**: `app/Http/Controllers/PageController.php`

CMS page management and retrieval.

### QueueTestController
**File**: `app/Http/Controllers/QueueTestController.php`

Testing endpoint for queue functionality.

### RegistrationInviteController
**File**: `app/Http/Controllers/RegistrationInviteController.php`

Invitation-only registration functionality.

### DbSchemaController
**File**: `app/Http/Controllers/DbSchemaController.php`

Low-level database schema operations.

## Admin Controllers

### Admin\PageController
**File**: `app/Http/Controllers/Admin/PageController.php`

CMS administration for landing pages and popups.

### Admin\UserManagementController
**File**: `app/Http/Controllers/Admin/UserManagementController.php`

Administrative user management functions.

## Settings Controllers

### Settings\PasswordController
**File**: `app/Http/Controllers/Settings/PasswordController.php`

Dedicated password change endpoint for user settings.

### Settings\ProfileController
**File**: `app/Http/Controllers/Settings/ProfileController.php`

Dedicated profile management endpoint for user settings.

## Controller Best Practices

### 1. Request Validation
Always validate incoming requests using Laravel validators:

```php
$validator = Validator::make($request->all(), [
    'field' => 'required|string|max:255',
]);

if ($validator->fails()) {
    return response()->json([
        'message' => 'Validation failed',
        'errors' => $validator->errors()
    ], 422);
}
```

### 2. Authorization
Check user permissions before processing:

```php
private function userHasProjectAccess(Project $project, $user = null): bool
{
    $user = $user ?? Auth::user();
    
    // Owner check
    if ((string)$project->owner_id === (string)$user->id) {
        return true;
    }
    
    // Team member check
    return $project->teams()->whereHas('members', function($query) use ($user) {
        $query->where('user_id', $user->id);
    })->exists();
}
```

### 3. Response Format
Maintain consistent JSON response structure:

```php
return response()->json([
    'message' => 'Operation successful',
    'data' => $user,
], 200);
```

### 4. Error Handling
Provide meaningful error messages with appropriate HTTP status codes:

- **400**: Bad Request (validation errors)
- **401**: Unauthorized (authentication required)
- **403**: Forbidden (insufficient permissions)
- **404**: Not Found (resource doesn't exist)
- **422**: Unprocessable Entity (validation failed)
- **500**: Server Error (unexpected exception)

### 5. Dependency Injection
Inject services through constructor:

```php
public function __construct(RegistrationValidationService $registrationValidator)
{
    $this->registrationValidator = $registrationValidator;
}
```

## Common Patterns

### Pagination
When listing resources, support pagination:

```php
$projects = Project::where('owner_id', $user->id)
    ->paginate($request->get('per_page', 15));
```

### Eager Loading
Use eager loading to avoid N+1 queries:

```php
$projects = Project::with(['owner', 'teams', 'schemas'])
    ->where('owner_id', $user->id)
    ->get();
```

### Transaction Handling
Wrap critical operations in database transactions:

```php
DB::transaction(function () {
    $project = Project::create($data);
    $project->teams()->attach($teamId);
});
```

## Authentication Middleware

All API controllers are protected by the `auth:api` middleware (configured in routes), which:
1. Validates JWT token from Authorization header
2. Hydrates `Auth::user()` with authenticated user
3. Returns 401 if token is invalid or missing

**Protected Routes Pattern**:
```php
Route::middleware('auth:api')->group(function () {
    // All routes in this group require authentication
});
```

**Public Routes Pattern**:
```php
// These routes don't require authentication
Route::post('/auth/login', [AuthController::class, 'login']);
Route::post('/auth/register', [AuthController::class, 'register']);
```

## Accessing Authenticated User

```php
$user = Auth::user();              // Get current user
$userId = auth()->id();            // Get current user ID
$request->user();                  // Get user from request
```

## Response Headers

Controllers should ensure proper headers are set:
- `Content-Type: application/json`
- `X-Request-ID: {unique-id}` (for tracing)

## Next Steps

- Read [API Controllers](./api-controllers.md) for detailed REST endpoint documentation
- Read [Services](./services.md) for business logic layer
- Read [Models](./models.md) for data layer
