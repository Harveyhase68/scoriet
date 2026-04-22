---
sidebar_position: 3
title: Project Structure
---

# Project Structure

Scoriet follows Laravel and React conventions for organizing code. This document describes the directory layout and explains the purpose of each major section.

## Directory Tree Overview

```
scoriet/
├── app/                           # Backend application code
├── bootstrap/                     # Framework bootstrapping
├── config/                        # Configuration files
├── database/                      # Database migrations and factories
├── resources/                     # Frontend and view resources
├── routes/                        # Application routing
├── storage/                       # File storage and logs
├── tests/                         # Test files
├── vendor/                        # Composer dependencies
├── node_modules/                  # NPM dependencies
├── public/                        # Web server root
├── .env                           # Environment variables (not in git)
├── .env.example                   # Environment template
├── composer.json                  # PHP dependencies
├── package.json                   # JavaScript dependencies
├── vite.config.ts                 # Vite configuration
├── tailwind.config.js             # Tailwind CSS configuration
├── tsconfig.json                  # TypeScript configuration
├── eslint.config.js               # ESLint configuration
├── CLAUDE.md                      # This project's development guidelines
└── README.md                      # Project introduction
```

## Backend Structure (`/app`)

### Core Application Directory

```
app/
├── Http/                          # HTTP handling layer
│   ├── Controllers/               # Request handlers
│   │   ├── Auth/                  # Authentication endpoints
│   │   │   ├── RegisterController.php
│   │   │   ├── LoginController.php
│   │   │   ├── ForgotPasswordController.php
│   │   │   └── ProfileController.php
│   │   ├── Api/                   # Main API controllers
│   │   │   ├── GeneratorController.php      # Code generator CRUD
│   │   │   ├── TemplateController.php       # Template management
│   │   │   ├── SqlParserController.php      # Database parsing
│   │   │   ├── ProjectController.php        # Project management
│   │   │   ├── DeploymentController.php     # Deployment operations
│   │   │   └── ...
│   │   ├── Admin/                 # Admin panel operations
│   │   │   ├── UserManagementController.php
│   │   │   ├── BillingController.php
│   │   │   └── ...
│   │   ├── Settings/              # User settings
│   │   │   ├── PreferencesController.php
│   │   │   ├── NotificationsController.php
│   │   │   └── ApiTokenController.php
│   │   ├── Cli/                   # Command-line operations
│   │   │   └── CodeGeneratorController.php
│   │   └── Traits/                # Reusable controller logic
│   │       ├── ApiResponseTrait.php         # Consistent API responses
│   │       └── AuthorizationTrait.php       # Permission checks
│   ├── Middleware/                # Request/response middleware
│   │   ├── Authenticate.php
│   │   ├── VerifyApiToken.php
│   │   ├── CheckTeamAccess.php
│   │   └── RateLimiter.php
│   └── Requests/                  # Form request validation
│       ├── StoreGeneratorRequest.php
│       ├── StoreTemplateRequest.php
│       └── ...
├── Models/                        # Data models (Eloquent ORM)
│   ├── User.php                   # User model with Passport traits
│   ├── Team.php                   # Team management
│   ├── Generator.php              # Code generator definitions
│   ├── Template.php               # Code templates
│   ├── Project.php                # Project container
│   ├── Database.php               # Connected database configs
│   ├── Deployment.php             # Deployment records
│   ├── GeneratedCode.php          # Generated code artifacts
│   ├── Payment.php                # Payment records (Stripe/PayPal)
│   ├── ApiToken.php               # User API tokens
│   └── ...
├── Services/                      # Business logic services
│   ├── MySQLParser.php            # Main SQL parsing service
│   ├── SqlParser.php              # Core SQL parsing logic
│   ├── SQLTokenizer.php           # SQL tokenization
│   ├── CodeGeneratorService.php   # Code generation engine
│   ├── TemplateEngineService.php  # Template processing
│   ├── DatabaseConnectionService.php       # Database connectivity
│   ├── DeploymentService.php      # Deployment automation
│   ├── PaymentService.php         # Stripe/PayPal integration
│   ├── GitService.php             # Git operations
│   ├── TeamService.php            # Team management logic
│   └── ...
├── Events/                        # Event definitions
│   ├── CodeGenerated.php
│   ├── DatabaseParsed.php
│   ├── DeploymentCompleted.php
│   └── ...
├── Listeners/                     # Event listeners
│   ├── SendDeploymentNotification.php
│   ├── LogActivity.php
│   └── ...
├── Jobs/                          # Queued background jobs
│   ├── ParseDatabaseSchema.php
│   ├── GenerateCode.php
│   ├── DeployCode.php
│   ├── ProcessPayment.php
│   └── ...
├── Policies/                      # Authorization policies
│   ├── GeneratorPolicy.php        # Who can edit/delete generators
│   ├── TemplatePolicy.php
│   ├── ProjectPolicy.php
│   └── ...
├── Enums/                         # Enumeration classes
│   ├── DatabaseType.php           # MySQL, PostgreSQL, MSSQL, etc.
│   ├── GeneratorStatus.php        # Draft, Published, Archived
│   ├── DeploymentMethod.php       # Git, FTP, SSH
│   └── ...
├── Providers/                     # Service providers
│   ├── AppServiceProvider.php     # Passport & Reverb configuration
│   ├── AuthServiceProvider.php    # Authorization policies
│   ├── EventServiceProvider.php   # Event/listener mapping
│   └── RouteServiceProvider.php   # Route registration
├── Casts/                         # Attribute casting
│   └── JsonArrayCast.php
├── Exceptions/                    # Custom exceptions
│   ├── DatabaseConnectionException.php
│   ├── CodeGenerationException.php
│   └── ...
└── Console/                       # Artisan commands
    └── Commands/
        ├── GenerateCode.php       # CLI code generation
        ├── ParseDatabase.php      # CLI database parsing
        └── ...
```

### Backend Configuration (`/config`)

```
config/
├── app.php                        # Application settings
├── auth.php                       # Authentication configuration
├── database.php                   # Database connections
├── cache.php                      # Cache backend configuration
├── queue.php                      # Job queue configuration
├── session.php                    # Session configuration
├── logging.php                    # Logging configuration
├── filesystems.php                # File storage configuration
├── mail.php                       # Email configuration
├── services.php                   # Third-party service credentials
├── passport.php                   # OAuth2 configuration
├── reverb.php                     # WebSocket configuration
└── ...
```

### Database Structure (`/database`)

```
database/
├── migrations/                    # Schema migration files
│   ├── 0001_01_01_create_users_table.php
│   ├── 0001_01_02_create_teams_table.php
│   ├── 0001_01_03_create_projects_table.php
│   ├── 0001_01_04_create_generators_table.php
│   ├── 0001_01_05_create_templates_table.php
│   ├── 0001_01_06_create_databases_table.php
│   ├── 0001_01_07_create_deployments_table.php
│   ├── 0001_01_08_create_payments_table.php
│   ├── 0001_01_09_create_schema_tables.php
│   ├── 0001_01_10_create_schema_fields.php
│   ├── 0001_01_11_create_schema_indexes.php
│   └── ...
├── factories/                     # Model factories for testing
│   ├── UserFactory.php
│   ├── GeneratorFactory.php
│   ├── TemplateFactory.php
│   └── ...
├── seeders/                       # Database seeders
│   ├── DatabaseSeeder.php         # Main seeder
│   ├── UserSeeder.php
│   ├── TemplateSeeder.php
│   └── ...
└── schema.dump                    # Database schema snapshot
```

## Frontend Structure (`/resources`)

### JavaScript & React Components

```
resources/
├── js/
│   ├── app.tsx                    # Inertia.js entry point
│   ├── pages/
│   │   └── Index.tsx              # Main MDI workspace layout
│   │       └── Contains:
│   │           - DockLayout component
│   │           - Panel router (loadTab function)
│   │           - Hotkey handlers
│   │           - Layout persistence logic
│   ├── Components/
│   │   ├── Panels/                # 57 lazy-loaded panel components
│   │   │   ├── NavigationPanel.tsx        # Top navigation bar
│   │   │   ├── PanelT1.tsx               # Sidebar/tree navigator
│   │   │   ├── PanelT2.tsx               # Main content area
│   │   │   ├── PanelT5.tsx               # Database explorer
│   │   │   ├── ProjectsPanel.tsx         # Project management
│   │   │   ├── GeneratorsPanel.tsx       # Generator list
│   │   │   ├── TemplatesPanel.tsx        # Template management
│   │   │   ├── SqlEditorPanel.tsx        # SQL query editor
│   │   │   ├── CodePreviewPanel.tsx      # Generated code preview
│   │   │   ├── DeploymentPanel.tsx       # Deployment tools
│   │   │   ├── ReportDesignerPanel.tsx   # Report builder
│   │   │   ├── FormDesignerPanel.tsx     # Form builder
│   │   │   ├── KanbanPanel.tsx           # Kanban board
│   │   │   ├── MessagingPanel.tsx        # Team chat
│   │   │   ├── SettingsPanel.tsx         # User preferences
│   │   │   ├── ApiTokensPanel.tsx        # API token management
│   │   │   ├── BillingPanel.tsx          # Subscription & invoices
│   │   │   ├── TeamManagementPanel.tsx   # Team settings
│   │   │   └── ... (47 more panels)
│   │   ├── Modals/                # Dialog components
│   │   │   ├── ConfirmDialog.tsx
│   │   │   ├── ProgressDialog.tsx
│   │   │   ├── FileUploadDialog.tsx
│   │   │   └── ...
│   │   ├── Common/                # Reusable components
│   │   │   ├── DataTable.tsx      # Wrapper around PrimeReact DataTable
│   │   │   ├── FormBuilder.tsx    # Dynamic form generator
│   │   │   ├── CodeEditor.tsx     # CodeMirror wrapper
│   │   │   ├── Tab.tsx            # Tab container
│   │   │   ├── Toolbar.tsx        # Action toolbar
│   │   │   ├── StatusBar.tsx      # Bottom status display
│   │   │   ├── Sidebar.tsx        # Navigation sidebar
│   │   │   └── ...
│   │   ├── AuthModals/            # Authentication dialogs
│   │   │   ├── LoginModal.tsx
│   │   │   ├── RegisterModal.tsx
│   │   │   ├── ForgotPasswordModal.tsx
│   │   │   └── ResetPasswordModal.tsx
│   │   └── Utils/                 # Helper components
│   │       ├── Loading.tsx        # Loading spinner
│   │       ├── ErrorBoundary.tsx  # Error handling
│   │       ├── Notification.tsx   # Toast notifications
│   │       └── ...
│   ├── hooks/                     # Custom React hooks
│   │   ├── useApi.ts              # API request hook
│   │   ├── useAuth.ts             # Authentication state
│   │   ├── useTeam.ts             # Team context
│   │   ├── usePersistentState.ts  # localStorage state
│   │   ├── useWindowSize.ts       # Responsive sizing
│   │   └── ...
│   ├── services/                  # Client-side services
│   │   ├── ApiService.ts          # API communication
│   │   ├── AuthService.ts         # Auth token management
│   │   ├── StorageService.ts      # localStorage wrapper
│   │   ├── WebSocketService.ts    # WebSocket/Reverb connection
│   │   ├── TemplateEngine.ts      # Client-side template processing
│   │   ├── CodeGenerator.ts       # JavaScript code generation
│   │   └── ...
│   ├── types/                     # TypeScript type definitions
│   │   ├── index.ts               # Main type exports
│   │   ├── auth.ts                # Auth-related types
│   │   ├── generator.ts           # Generator types
│   │   ├── template.ts            # Template types
│   │   ├── database.ts            # Database types
│   │   └── ...
│   ├── utils/                     # Utility functions
│   │   ├── formatting.ts          # String/date formatting
│   │   ├── validation.ts          # Input validation
│   │   ├── api.ts                 # API helpers
│   │   ├── storage.ts             # localStorage helpers
│   │   └── ...
│   ├── constants/                 # Application constants
│   │   ├── endpoints.ts           # API endpoint paths
│   │   ├── messages.ts            # User-facing messages
│   │   ├── themes.ts              # UI theme definitions
│   │   └── ...
│   ├── context/                   # React Context providers
│   │   ├── AuthContext.tsx        # User authentication state
│   │   ├── TeamContext.tsx        # Team/workspace state
│   │   ├── UIContext.tsx          # UI state (panels, layout, etc.)
│   │   └── NotificationContext.tsx # Toast notifications
│   └── i18n/                      # Internationalization
│       ├── config.ts              # i18next configuration
│       ├── locales/
│       │   ├── en/
│       │   │   ├── common.json    # Common translations
│       │   │   ├── panels.json    # Panel-specific translations
│       │   │   ├── errors.json    # Error messages
│       │   │   └── ...
│       │   └── de/
│       │       ├── common.json
│       │       ├── panels.json
│       │       └── ...
│       └── hooks.ts               # i18n React hooks
└── views/
    └── app.blade.php              # Inertia root blade template
```

## Routing Structure (`/routes`)

### Web Routes
```
routes/web.php
├── Middleware: web (CSRF, sessions)
├── / (root)
│   └── GET → Index page (Inertia)
├── /dashboard → Main application workspace
├── /auth/* → Authentication routes
│   ├── /login
│   ├── /register
│   ├── /forgot-password
│   └── /reset-password/{token}
├── /settings/* → User settings
│   ├── /profile
│   ├── /preferences
│   └── /api-tokens
└── /admin/* → Admin-only routes (if applicable)
    ├── /users
    ├── /billing
    └── ...
```

### API Routes
```
routes/api.php
├── Middleware: api (stateless)
├── /auth
│   ├── POST /register (public)
│   ├── POST /oauth/token (public, password grant)
│   ├── POST /logout (auth:api)
│   └── POST /forgot-password (public)
├── /user
│   ├── GET / (auth:api, current user)
│   ├── PUT / (auth:api, update profile)
│   └── DELETE / (auth:api, close account)
├── /projects
│   ├── GET / (auth:api, list user's projects)
│   ├── POST / (auth:api, create project)
│   ├── GET /{id} (auth:api)
│   ├── PUT /{id} (auth:api)
│   └── DELETE /{id} (auth:api)
├── /generators
│   ├── GET / (auth:api)
│   ├── POST / (auth:api)
│   ├── GET /{id} (auth:api)
│   ├── PUT /{id} (auth:api)
│   ├── DELETE /{id} (auth:api)
│   └── POST /{id}/execute (auth:api, run generator)
├── /templates
│   ├── GET / (auth:api)
│   ├── POST / (auth:api)
│   ├── GET /{id} (auth:api)
│   └── PUT /{id} (auth:api)
├── /sql-parse
│   ├── POST / (auth:api, parse SQL schema)
│   └── GET /{id}/schema (auth:api, retrieve parsed schema)
├── /deployments
│   ├── GET / (auth:api)
│   ├── POST / (auth:api, start deployment)
│   ├── GET /{id} (auth:api)
│   └── GET /{id}/logs (auth:api)
├── /teams
│   ├── GET / (auth:api, user's teams)
│   ├── POST / (auth:api, create team)
│   ├── GET /{id} (auth:api)
│   ├── PUT /{id} (auth:api)
│   ├── POST /{id}/members (auth:api)
│   └── DELETE /{id}/members/{userId} (auth:api)
├── /billing
│   ├── GET /subscription (auth:api)
│   ├── POST /subscription (auth:api, update plan)
│   ├── GET /invoices (auth:api)
│   └── POST /payment-method (auth:api)
└── /admin
    ├── GET /users (admin)
    ├── GET /billing-report (admin)
    └── ...
```

## Storage Structure (`/storage`)

```
storage/
├── app/
│   ├── public/                    # Publicly accessible files
│   │   ├── generated-code/        # Generated code downloads
│   │   ├── uploads/               # User uploaded files
│   │   └── exports/               # Report exports
│   └── private/                   # Private application data
│       ├── templates/             # Template files (code backups)
│       ├── schemas/               # Parsed schema JSON
│       └── temp/                  # Temporary work files
├── logs/
│   ├── laravel.log                # Application log
│   ├── queue.log                  # Job queue log
│   └── access.log                 # API access log
└── cache/
    ├── data/                      # File-based cache
    └── views/                     # Compiled view cache
```

## Configuration Files (Root)

### Build & Development
```
vite.config.ts                     # Vite bundler configuration
tsconfig.json                      # TypeScript compiler options
tailwind.config.js                 # Tailwind CSS configuration
eslint.config.js                   # ESLint rules
prettier.config.js                 # Code formatter config
```

### Package Management
```
package.json                       # NPM dependencies & scripts
composer.json                      # PHP dependencies
composer.lock                      # Locked dependency versions
```

### Environment & Documentation
```
.env                               # Environment variables (local)
.env.example                       # Environment template
.gitignore                         # Git exclusions
.eslintignore                      # ESLint exclusions
CLAUDE.md                          # Development guidelines
README.md                          # Project introduction
```

## Key File Relationships

### Authentication Flow Files
```
resources/js/Components/AuthModals/LoginModal.tsx
  ↓ (submits to)
routes/api.php (/oauth/token endpoint)
  ↓ (handled by)
app/Http/Controllers/Auth/LoginController.php
  ↓ (uses)
app/Services/AuthService.php
  ↓ (communicates via)
Laravel Passport
  ↓ (returns)
JWT Token → Stored in localStorage
```

### Code Generation Flow Files
```
resources/js/Components/Panels/GeneratorsPanel.tsx
  ↓ (user selects template & database)
resources/js/services/CodeGenerator.ts (client-side)
  ↓ (sends request to)
routes/api.php (/generators/{id}/execute endpoint)
  ↓ (handled by)
app/Http/Controllers/Api/GeneratorController.php@execute
  ↓ (uses)
app/Services/CodeGeneratorService.php
  ↓ (processes template)
app/Services/TemplateEngineService.php
  ↓ (returns)
Generated code artifact
  ↓ (displayed in)
resources/js/Components/Panels/CodePreviewPanel.tsx
```

### Database Parsing Flow Files
```
resources/js/Components/Panels/SqlEditorPanel.tsx
  ↓ (user pastes SQL)
routes/api.php (/sql-parse endpoint)
  ↓ (handled by)
app/Http/Controllers/Api/SqlParserController.php
  ↓ (uses)
app/Services/MySQLParser.php
  ↓ (tokenizes with)
app/Services/SQLTokenizer.php
  ↓ (parses with)
app/Services/SQLParser.php
  ↓ (creates)
app/Models/SchemaTable, SchemaField, etc.
  ↓ (displayed in)
resources/js/Components/Panels/PanelT5.tsx (Database Explorer)
```

## Directory Naming Conventions

| Directory | Naming | Example |
|-----------|--------|---------|
| Controllers | Singular, Controller suffix | `GeneratorController` |
| Models | Singular, PascalCase | `Generator`, `User` |
| Migrations | Timestamp + action | `2024_01_15_create_generators_table` |
| Component folders | PascalCase | `NavigationPanel`, `CodeEditor` |
| Component files | PascalCase + .tsx | `LoginModal.tsx` |
| Services | Singular, Service suffix | `CodeGeneratorService` |
| Utilities | camelCase | `formatDate.ts`, `validateEmail.ts` |
| Hooks | camelCase, use prefix | `useApi.ts`, `useAuth.ts` |
| Types | Singular, .ts extension | `generator.ts`, `auth.ts` |

## Asset Organization

### Public Assets
```
public/
├── favicon.ico
├── images/                        # Static images
│   ├── logo.png
│   ├── icons/
│   └── ...
└── fonts/                         # Web fonts
```

### Built Assets (Generated by Vite)
```
public/build/                      # Vite build output
├── assets/                        # Minified JS/CSS
│   ├── app-[hash].js
│   ├── vendor-[hash].js
│   └── styles-[hash].css
└── manifest.json                  # Asset manifest
```

## Development Workflow

### Adding a New Feature

1. **Create Backend Model** (`app/Models/`)
2. **Create Migration** (`database/migrations/`)
3. **Create Controller** (`app/Http/Controllers/Api/`)
4. **Create Service** (`app/Services/`)
5. **Add API Routes** (`routes/api.php`)
6. **Create Frontend Components** (`resources/js/Components/`)
7. **Add TypeScript Types** (`resources/js/types/`)
8. **Create API Service** (`resources/js/services/`)
9. **Test Backend** (`tests/Feature/`)
10. **Test Frontend** (`tests/Frontend/` if using Jest)

---

**Understanding this structure is key to navigating and extending Scoriet.** The organization balances pragmatic monolithic simplicity with proper separation of concerns.
