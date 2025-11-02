# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Scoriet is an Enterprise Code Generator built with modern web technologies. It's a complete rewrite of a WinDev application, now implemented as a Laravel-React application using Inertia.js for seamless monolithic development.

**Core Purpose**: Automate code generation through intelligent templating, reducing repetitive development tasks and ensuring consistency across projects.

**Key Features**:
- SQL Parser for MySQL database schemas
- Template-based code generation with JavaScript execution
- Client-side template processing (browser-based)
- Modern dock-based UI using rc-dock
- Complete OAuth2 authentication system with Laravel Passport
- User registration, login, and profile management
- JWT token-based API authentication

## Technology Stack

- **Backend**: Laravel 12 with PHP 8.2+
- **Frontend**: React 19 with TypeScript
- **Bridge**: Inertia.js 2.0
- **UI Library**: RC Dock for MDI interface + Ant Design Icons
- **Styling**: Tailwind CSS 4.0
- **Build**: Vite 7.0 with Laravel Vite Plugin
- **Auth**: Laravel Passport OAuth2 with Password Grant authentication
- **Database**: MySQL/PostgreSQL/SQLite/MS-SQL support
- **Testing**: Pest PHP

## Architecture

### Frontend Structure
- `resources/js/app.tsx` - Main Inertia app entry point
- `resources/js/pages/Index.tsx` - Main MDI dock layout with panels
- `resources/js/Components/Panels/` - Dock panel components
  - `NavigationPanel.tsx` - Top navigation bar
  - `PanelT1.tsx` - Left sidebar tree view
  - `PanelT2.tsx` - Main content panel
  - `PanelT3.tsx` - Interactive panel
  - `PanelT5.tsx` - Database explorer

### Backend Structure
- `app/Services/MySQLParser.php` - Main SQL parsing service
- `app/Services/SQLParser.php` - Core SQL parsing logic
- `app/Services/SQLTokenizer.php` - SQL tokenization
- `app/Models/Schema*.php` - Database schema models
- `app/Http/Controllers/SqlParserController.php` - SQL parsing API endpoints
- `app/Http/Controllers/AuthController.php` - Authentication endpoints
- `app/Models/User.php` - User model with Passport traits
- `app/Providers/AppServiceProvider.php` - Passport configuration

### Key Patterns
- **MDI Interface**: Uses rc-dock for multi-document interface with floating/dockable panels
- **Panel Communication**: Panels communicate through React refs and state management
- **Hotkey System**: Alt+key combinations for panel operations (Alt+P update, Alt+M maximize, Alt+N new tab)
- **Resizable Panels**: Custom resize handlers for left sidebar width adjustment

## Development Commands

### Installation & Setup
```bash
composer install
npm install
cp .env.example .env
php artisan key:generate
php artisan migrate

# Authentication Setup (Required)
php artisan passport:install
php artisan passport:client --password --name="Scoriet Password Grant Client" 
php artisan passport:client --personal --name="Scoriet Personal Access Client"

# Update .env with OAuth client credentials:
# VITE_PASSPORT_CLIENT_ID=your-password-grant-client-id
# VITE_PASSPORT_CLIENT_SECRET=your-password-grant-client-secret
```

### Development Server
```bash
# All-in-one (recommended) - runs Laravel server, queue, and Vite
composer run dev

# With SSR
composer run dev:ssr

# Manual start
php artisan serve
php artisan queue:listen
npm run dev
```

### Code Quality
```bash
npm run lint      # ESLint with auto-fix
npm run format    # Prettier formatting
npm run types     # TypeScript type checking
```

### Testing
```bash
composer run test
# or
php artisan test
```

### Build
```bash
npm run build          # Production build
npm run build:ssr      # With SSR support
```

## Important Development Notes

### Authentication System
- **OAuth2 Implementation**: Uses Laravel Passport with Password Grant flow
- **Frontend Login**: Located in `resources/js/Components/Panels/LoginPanel.tsx`
- **Token Management**: JWT tokens stored in localStorage with refresh capability
- **Protected Routes**: All `/api/*` routes except auth endpoints require Bearer token
- **Password Grant Client**: Must be created and configured in `.env` for login to work

### Critical Auth Configuration
- `Passport::enablePasswordGrant()` must be called in `AppServiceProvider::boot()`
- API guard uses `passport` driver in `config/auth.php`
- User model uses `HasApiTokens` trait from Laravel Passport
- Environment variables `VITE_PASSPORT_CLIENT_ID` and `VITE_PASSPORT_CLIENT_SECRET` required

### RC Dock Integration
- Panel loading is handled by `loadTab()` function in Index.tsx
- New panels must be registered in the loadTab switch statement
- Panel groups define behavior (floatable, closable, panelExtra buttons)
- Layout changes trigger `onLayoutChange` callback

### SQL Parser Service
- Located in `app/Services/MySQLParser.php`
- Uses tokenizer → parser → schema models pipeline
- Stores parsed schemas in dedicated database tables
- Supports MySQL syntax with planned multi-database support

### Alias Configuration
- `@/` aliases to `resources/js/` (configured in vite.config.ts)
- Import components using `@/Components/...`

### Database Models
Schema-related models follow naming convention:
- `SchemaTable`, `SchemaField`, `SchemaConstraint` etc.
- Located in `app/Models/`

### Routing
- Main route in `routes/web.php` renders Index page
- API routes in `routes/api.php` include:
  - Public: `/api/auth/register`, `/api/oauth/token`, `/api/auth/forgot-password`
  - Protected: `/api/user`, `/api/profile/*`, `/api/sql-parse*` (require auth:api middleware)

## Template System (Future)
The application is designed around a template-based code generation system:
- Templates support placeholders like `{projectname}`
- Loop constructs: `{for %}{endfor}` and `{for {nmaxitems}}{item.name}{endfor}`
- JavaScript integration for complex generation logic
- Client-side execution for security and performance
- "wenn du curl verwendest, immer 10.0.0.8 verwenden, localhost geht auf meinem computer nicht"
- "Always remmeber: we are developing on Windows not Linux"
- wenn dein code irgendwo nicht ganz funktioniert, bitte füge keinen "hack" code ein, der nur das aktuelle problem löst, sondern analysiere das problem akademisch und löse das problem, so dass es in 10 jahren immer noch keine probleme mehr macht, erstelle einen stabilen code ohne einen "hack" und der unter allen umständen funktioniert und dann später beim debuggen nicht zu problemen führt
- neue fenster oder panele, nimm immer als vorlage ein bestehendes fenster oder panel als vorlage, das spart zeit und nerven, auch sehen die panele und fenster dann gleich aus und wir müssen nicht das rad neu erfinden
- keine regex bitte verwenden, das ist nicht effizient und auch die fehlersuche ist der horror, bitte vermeide regex, bzw. nur wenn es kleine bereiche sind, die wirklich sinn machen oder den code an dieser stelle kürzer machen
- wenn du neue tabellen erstellst, bitte schau, dass die tabellen untereinander mit foreign keys verbunden sind, die master tabelle nur mit BIGINT auto-increment als foreign key verwenden, keine textkeys
- mach kein npm run build, da wir ja mit vite live arbeiten
- führe keinen upload zu github durch, das mache ich selbst, also kein git push usw. aber du darfst github/git als zwischenspeicher verwenden, wenn du das brauchst, aber nicht auf auf den branch direkt pushen bitte