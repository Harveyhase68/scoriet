<div align="center">

# Scoriet

### Enterprise Code Generator with Intelligent Templating

![Scoriet - Enterprise Code Generator](github-social-preview.png)

[![Laravel](https://img.shields.io/badge/Laravel-12.x-red.svg?style=flat-square&logo=laravel)](https://laravel.com)
[![React](https://img.shields.io/badge/React-19.x-blue.svg?style=flat-square&logo=react)](https://reactjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue.svg?style=flat-square&logo=typescript)](https://www.typescriptlang.org)
[![Inertia.js](https://img.shields.io/badge/Inertia.js-2.0-purple.svg?style=flat-square)](https://inertiajs.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg?style=flat-square)](https://opensource.org/licenses/MIT)
[![Development Status](https://img.shields.io/badge/Status-🚧%20In%20Development-orange.svg?style=flat-square)](https://github.com/harveyhase68/scoriet)

[**🧪 Live Demo**](https://demo.scoriet.dev) • [**🚧 Alpha Preview**](https://scoriet.dev) • [**📋 Installation**](INSTALLATION.md) • [**Documentation**](#documentation) • [**Contributing**](#contributing)

> **⚠️ Development Status**: Scoriet is currently in **active development**. The application is functional but features are being added regularly. Expect frequent updates and breaking changes. Not recommended for production use yet.

</div>

---

## 🚀 About Scoriet

Scoriet is a modern enterprise code generator that revolutionizes development workflows through intelligent templating and automation. Built as a complete rewrite of the original WinDev application, it now leverages cutting-edge web technologies to provide a seamless, browser-based development experience.

## 🚧 Current Development Status

**We're currently in active development!** Here's what's working and what's coming:

### ✅ **Completed Features** (Alpha Ready)
- ✅ **Modern UI/UX**: Professional dark theme with dockable panels
- ✅ **Authentication System**: Complete OAuth2 login, registration, profiles
- ✅ **Internationalization (i18n)**: 5 languages with automatic browser detection
- ✅ **CSS Flag Icons**: Beautiful country flags using pure CSS gradients
- ✅ **Language Selector**: Elegant dropdown with flag icons and smooth UX
- ✅ **Demo System**: Instant demo access with `demo-admin` and `demo-user`
- ✅ **Professional Landing Page**: Marketing site with pricing tiers
- ✅ **CMS System**: Inertia-based CMS pages (Impressum, Help) with React components
- ✅ **Maintenance Mode**: Professional 503 page for updates
- ✅ **Responsive Design**: Works on desktop, tablet, and mobile
- ✅ **Environment-based Features**: Demo vs. Production mode
- ✅ **Development Tooling**: Full CI/CD, linting, testing setup
- ✅ **Accessibility**: WCAG compliant forms with proper autocomplete attributes
- ✅ **Database Designer**: Visual SQL schema creation and editing with control type detection
- ✅ **Control Type System**: Automatic UI control type detection (TEXT, COMBOBOX, DATEPICKER, etc.)
- ✅ **Link Fields**: Complete foreign key relationship support with display fields and ordering
- ✅ **Schema Translation**: Multi-language support for table and field descriptions
- ✅ **SQL Parser Engine**: Advanced MySQL schema parsing with relationship detection
- ✅ **Template Engine**: Powerful JavaScript-based code generation with conditionals
- ✅ **Debug Manual Generator**: Real-time template debugging and testing
- ✅ **ZIP Template Upload**: Upload complete template structures as ZIP files
- ✅ **File Path Organization**: Automatic directory structure for generated code
- ✅ **Project Management**: Teams, projects, and collaboration tools
- ✅ **Public Projects Gallery**: Clone and share projects with credit system
- ✅ **Production Ready**: Clean codebase with all debug statements removed

### 🚧 **In Progress** (Coming Soon)
- 🚧 **Multi-Language Templates**: Support for more programming languages
- 🚧 **Advanced Template Variables**: Custom template placeholders and helpers
- 🚧 **Payment Integration**: PayPal and Stripe subscription handling
- 🚧 **AI Integration**: Claude API for enhanced code generation
- 🚧 **Team Permissions**: Advanced role-based access control
- 🚧 **Version Control**: Template and project versioning system

### 📅 **Planned Features** (Roadmap)
- 📅 **Multi-Database Support**: PostgreSQL, SQLite, SQL Server support
- 📅 **Advanced Code Analysis**: Static analysis and code quality metrics
- 📅 **Template Marketplace**: Share and download community templates
- 📅 **API Ecosystem**: Public API for third-party integrations
- 📅 **Plugin System**: Extensible architecture for custom generators
- 📅 **Cloud Deployment**: One-click deployment to major cloud providers

### 🧪 **Try It Now**
- **Live Demo**: [demo.scoriet.dev](https://demo.scoriet.dev) - Full featured demo environment
- **Alpha Preview**: [scoriet.dev](https://scoriet.dev) - Latest development build

### ✨ Key Features

- **🌍 Internationalization** - 5 languages (English, German, French, Spanish, Italian) with automatic browser detection
- **🎨 CSS Flag Icons** - Beautiful country flags created with pure CSS gradients (no image dependencies)
- **🗄️ Advanced SQL Parser** - Parse MySQL schemas with intelligent relationship detection
- **🎯 Template Engine** - Powerful client-side template execution with JavaScript integration
- **📋 Database Designer** - Visual schema creation with drag-and-drop table editing
- **🎛️ Control Type System** - Automatic UI control detection (TEXT, COMBOBOX, DATEPICKER, CHECKBOX, etc.)
- **🔗 Link Fields** - Complete foreign key support with display fields, ordering, and relationship management
- **🌐 Schema Translation** - Multi-language descriptions for tables and fields
- **📄 CMS Pages** - Inertia-based content management with React components
- **🔧 Debug Manual Generator** - Real-time template debugging with live preview
- **📦 ZIP Template Upload** - Upload complete template structures as ZIP files
- **📁 File Path Organization** - Automatic directory structure for generated code (/components/, /services/, etc.)
- **🖥️ Modern MDI Interface** - Professional dock-based UI with floating panels
- **🔒 Enterprise Security** - Laravel Passport OAuth2 with Password Grant authentication
- **👤 User Management** - Complete registration, login, and profile management system
- **🔐 JWT Token Authentication** - Secure API access with Bearer tokens
- **⚡ Real-time Generation** - Instant code generation without server processing
- **🔧 Flexible Templates** - Stack multiple templates for complex application scaffolding
- **🏢 Project Management** - Teams, projects, and collaboration with credit system
- **🌐 Public Gallery** - Clone and share projects with the community
- **♿ Accessibility First** - WCAG compliant with screen reader support and proper form attributes

### 🏗️ Architecture

**Frontend Stack:**
- React 19 with TypeScript
- RC Dock for MDI interface
- Tailwind CSS 4.0 for styling
- Ant Design Icons
- Vite for lightning-fast builds

**Backend Stack:**
- Laravel 12 with PHP 8.2+
- Inertia.js for seamless SPA experience
- Laravel Passport for API security
- Multi-database support (MySQL, PostgreSQL, SQLite, SQL Server)

**Template System:**
- Client-side JavaScript execution with full ES6+ support
- Advanced placeholder system (`{projectname}`, `{tablename}`, `{item.name}`, `{item.type}`)
- Powerful loop constructs (`{for {nmaxitemsnokey}}`, `{endfor}`)
- Conditional logic (`{if condition}`, `{else}`, `{endif}`)
- Switch statements (`{switch variable}`, `{case value}`, `{break}`, `{endswitch}`)
- ZIP template upload for complete project structures
- Automatic file path organization (/components/, /services/, /data/, etc.)
- Real-time debugging with live preview
- Stackable template composition for complex scaffolding

## 📋 Requirements

- **PHP** ≥ 8.2 with extensions: `mbstring`, `xml`, `bcmath`, `pdo`, `tokenizer`
- **Composer** ≥ 2.0
- **Node.js** ≥ 18.0 & npm ≥ 9.0
- **Database**: MySQL 8.0+ / PostgreSQL 13+ / SQLite 3.8+ / SQL Server 2019+
- **Memory**: 512MB RAM minimum (2GB+ recommended)

## 🚀 Getting Started

> **📋 For detailed Windows installation instructions, see [INSTALLATION.md](INSTALLATION.md)**

## ⚡ Quick Start

### 1️⃣ Clone & Install

```bash
# Clone the repository
git clone https://github.com/harveyhase68/scoriet.git
cd scoriet

# Install dependencies
composer install
npm install
```

### 2️⃣ Environment Setup

```bash
# Copy environment file
cp .env.example .env

# Generate application key
php artisan key:generate

# Configure your database in .env
# Edit the following variables:
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=scoriet
DB_USERNAME=your_username
DB_PASSWORD=your_password
```

### 3️⃣ Database Setup

```bash
# Create database (MySQL example)
mysql -u root -p -e "CREATE DATABASE scoriet CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# Run migrations
php artisan migrate

# (Optional) Seed sample data
php artisan db:seed
```

### 4️⃣ Authentication Setup

```bash
# Install Laravel Passport for API authentication
php artisan passport:install

# Create OAuth clients for authentication
php artisan passport:client --password --name="Scoriet Password Grant Client"
php artisan passport:client --personal --name="Scoriet Personal Access Client"

# Update .env with the Password Grant Client credentials
# VITE_PASSPORT_CLIENT_ID=your-password-grant-client-id
# VITE_PASSPORT_CLIENT_SECRET=your-password-grant-client-secret

# For demo installations (optional)
# SCORIET_DEMO=true     # Disables registration, enables demo mode
# VITE_SCORIET_DEMO="${SCORIET_DEMO}"
```

## 🧪 Demo Access

### Instant Demo (No Registration Required)

Visit [demo.scoriet.dev](https://demo.scoriet.dev) and try either:

**Option 1: Click Demo Cards**
- Click on `demo-admin` or `demo-user` cards in the login modal
- Instant access to demo environment

**Option 2: Manual Login**
- Username: `demo-admin` or `demo-user`
- Password: Leave empty
- Click "Log In"

### Demo Users
- **demo-admin**: Full admin access, 2 teams, 3 projects
- **demo-user**: Team member access, assigned to 1 project

> **Note**: Demo resets automatically every 20 minutes. All changes are temporary.

## 🛠️ Development

### Start Development Server

```bash
# 🚀 All-in-one development server (recommended)
# Runs Laravel server + queue worker + Vite dev server
composer run dev

# 🔥 With Server-Side Rendering
composer run dev:ssr

# ⚙️ Manual start (for debugging)
php artisan serve --host=10.0.0.8 --port=8000  # Backend
php artisan queue:listen --tries=1              # Queue worker
npm run dev                                       # Frontend
```

### Access Points
- **Application**: http://10.0.0.8:8000
- **Vite Dev Server**: http://10.0.0.8:5173
- **Hot Module Replacement**: Enabled automatically

## 🎨 Template Engine Features

Scoriet's template engine is one of its most powerful features, offering advanced code generation capabilities:

### 🔧 Debug Manual Generator

The Debug Manual Generator provides real-time template debugging and testing:

- **Live Preview**: See generated code instantly as you edit templates
- **File Type Detection**: Automatically determines if templates need database or project context
- **Dynamic UI**: Shows/hides relevant dropdowns based on template requirements
- **Database Integration**: Select specific tables for database-driven templates
- **Project Context**: Choose projects for project-specific generation
- **Error Handling**: Clear error messages and validation feedback

### 📦 Template Features

#### Template Variables
```javascript
{projectname}        // Current project name
{tablename}          // Database table name
{item.name}          // Field name from database schema
{item.type}          // Field data type (VARCHAR, INT, etc.)
{item.typecast}      // PHP typecast ((int), (string), etc.)
{item.controltype}   // UI control type (14=int, 24=string, etc.)
```

#### Loop Constructs
```javascript
{for {nmaxitemsnokey}}
  // Loop through all database fields without key
  $p_{item.name} = {item.typecast}0;
{endfor}
```

#### Conditional Logic
```javascript
{if {item.typecast}=="(int)"}
  $p_{item.name} = {item.typecast}0;
{else}
  $p_{item.name} = {item.typecast}"";
{endif}
```

#### Switch Statements
```javascript
{switch {item.controltype}}
{case 14}
  // Integer field processing
  echo "Processing integer field: {item.name}";
{break}
{case 24}
  // String field processing
  echo "Processing string field: {item.name}";
{break}
{default}
  // Default processing
  echo "Processing other field: {item.name}";
{break}
{endswitch}
```

### 📁 File Organization

Templates now support automatic file organization with output paths:

```javascript
// Template files can specify target directories
Output Path: /components/     // React components
Output Path: /services/       // API helpers
Output Path: /app/Http/Controllers/  // Laravel controllers
Output Path: /database/migrations/   // Database migrations
Output Path: /data/           // Data models
Output Path: /meta/           // Metadata files
```

### 📦 ZIP Template Upload

Upload complete template structures as ZIP files:

- **Drag & Drop Interface**: Easy file upload with visual feedback
- **Structure Preservation**: Maintains directory structure from ZIP
- **Base64 Storage**: Secure storage in database as Base64-encoded text
- **Validation**: Ensures only valid ZIP files are accepted
- **Preview**: Shows uploaded file information and size

## 📋 Database Designer

Scoriet includes a powerful visual database designer for creating and editing schemas:

### 🎨 Visual Schema Creation

- **Drag & Drop Interface**: Create tables with intuitive drag-and-drop functionality
- **Field Management**: Add, edit, and remove database fields with ease
- **Data Type Selection**: Support for all common MySQL data types
- **Constraint Management**: Define primary keys, foreign keys, and indexes
- **Relationship Visualization**: See table relationships at a glance
- **Real-time Validation**: Instant feedback on schema validity

### 🎛️ Control Type System

Automatic UI control type detection for intelligent form generation:

**Supported Control Types:**
- `TEXT` - Single-line text input
- `TEXTAREA` - Multi-line text input
- `CHECKBOX` - Boolean toggle
- `COMBOBOX` - Dropdown select with foreign key support
- `LISTBOX` - Multi-select list
- `RADIOBUTTONS` - Radio button group
- `DATEPICKER` - Date selection
- `DATETIMEPICKER` - Date and time selection
- `TIMEPICKER` - Time selection
- `COLORPICKER` - Color selection
- `FILEUPLOAD` - File upload control

**Auto-Detection Rules:**
- `LONGTEXT/TEXT` types → TEXTAREA
- `BOOLEAN/TINYINT(1)` → CHECKBOX
- `DATETIME/TIMESTAMP` → DATETIMEPICKER
- `DATE` → DATEPICKER
- `TIME` → TIMEPICKER
- Fields ending with `_id` → COMBOBOX
- Fields containing "color" → COLORPICKER
- Fields containing "file/upload" → FILEUPLOAD

### 🔗 Link Field System

Complete foreign key relationship management:

**Link Field Properties:**
- **Link Table**: Target table for foreign key
- **Link Field** (Value Field): Primary key field in target table
- **Link Display Field**: Human-readable field to display (e.g., `name`, `title`)
- **Link Order Field**: Field to sort results by
- **Link Order Direction**: ASC or DESC sorting

**Example Usage:**
```typescript
{
  field_name: "category_id",
  control_type: "COMBOBOX",
  link_table: "categories",
  link_field: "id",              // Value to store
  link_display_field: "name",     // Value to show user
  link_order_field: "name",       // Sort by name
  link_order_direction: "ASC"     // A-Z order
}
```

This enables automatic generation of dropdown selects with proper foreign key relationships and user-friendly displays.

### 🌐 Schema Translation

Multi-language support for database schemas:

- **Table Translations**: Translate table names and descriptions
- **Field Translations**: Translate field labels and help text
- **Language Support**: All 5 supported languages (EN, DE, FR, ES, IT)
- **Fallback System**: Automatic fallback to default language
- **Template Integration**: Access translated names in code generation

### 🔧 Advanced Features

- **SQL Export**: Generate CREATE TABLE statements from visual designs
- **Schema Import**: Import existing database schemas for editing
- **Version Control**: Track schema changes over time
- **Team Collaboration**: Share schemas with team members
- **Template Integration**: Use schemas directly in template generation

### 🗄️ SQL Parser Engine

Advanced MySQL schema parsing capabilities:

- **Intelligent Analysis**: Automatically detect table relationships
- **Field Type Detection**: Recognize and categorize field types
- **Constraint Extraction**: Parse primary keys, foreign keys, and indexes
- **Metadata Generation**: Create rich metadata for template systems
- **Error Handling**: Graceful handling of malformed SQL
- **Performance Optimization**: Efficient parsing of large schemas

## 🏢 Project & Team Management

Comprehensive project and team collaboration features:

### 👥 Team Features

- **Team Creation**: Create and manage development teams
- **Member Management**: Invite users and assign roles
- **Project Assignment**: Organize projects within teams
- **Access Control**: Role-based permissions for team resources

### 📂 Project Management

- **Project Creation**: Set up new development projects
- **Schema Attachment**: Link database schemas to projects
- **Template Libraries**: Organize templates within projects
- **Collaboration Tools**: Share projects with team members

### 🌐 Public Gallery

- **Project Sharing**: Make projects publicly available
- **Cloning System**: Clone interesting projects to your account
- **Credit System**: Original creators receive credit for clones
- **Discovery**: Browse community projects and templates

### 🔐 Authentication System

Scoriet includes a complete authentication system with OAuth2 Password Grant:

#### Registration & Login
- **Registration**: Create new user accounts with email verification
- **Login**: Secure OAuth2 authentication with JWT tokens
- **Profile Management**: Update user details and change passwords
- **Token Management**: Automatic token refresh and secure storage

#### API Authentication
```bash
# Example: Login via OAuth2 Password Grant
curl -X POST http://10.0.0.8:8000/api/oauth/token \
  -H "Content-Type: application/json" \
  -d '{
    "grant_type": "password",
    "client_id": "your-client-id",
    "client_secret": "your-client-secret", 
    "username": "user@example.com",
    "password": "userpassword"
  }'

# Example: Access protected routes
curl -X GET http://10.0.0.8:8000/api/user \
  -H "Authorization: Bearer your-access-token"
```

#### Available Authentication Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/oauth/token` - OAuth2 token exchange
- `GET /api/user` - Get authenticated user
- `PUT /api/profile/update` - Update user profile
- `PUT /api/profile/password` - Change password
- `POST /api/auth/forgot-password` - Password reset request
- `POST /api/auth/reset-password` - Password reset confirmation

### 🌍 Internationalization Features

Scoriet includes comprehensive multilingual support:

#### Supported Languages
- **🇺🇸 English** (en) - Default language
- **🇩🇪 German** (de) - Deutsch
- **🇫🇷 French** (fr) - Français
- **🇪🇸 Spanish** (es) - Español
- **🇮🇹 Italian** (it) - Italiano

#### Language Features
- **🔍 Automatic Detection** - Browser language detected on first visit
- **💾 Persistent Selection** - Language choice saved in localStorage
- **🎨 CSS Flag Icons** - Beautiful flags using pure CSS gradients (no external images)
- **🖱️ Smooth UX** - Elegant language selector with instant switching
- **📱 Responsive Flags** - Scalable flags that work on all screen sizes
- **♿ Accessible** - Screen reader support with proper ARIA labels

#### Implementation Details
- Client-side translation system with TypeScript support
- Language data stored in `resources/js/utils/i18n.ts`
- Custom CSS flag components in `Components/CSSFlag.tsx`
- Language selector component with PrimeReact integration
- Automatic lobby language inheritance in registration forms

### Development Features
- ⚡ **Hot Reload** - Instant UI updates
- 🔍 **Debug Toolbar** - Laravel Debugbar (when enabled)
- 📝 **Logging** - Real-time logs with `php artisan pail`
- 🎨 **Live Styling** - Tailwind CSS with JIT compilation

## 🧪 Testing

```bash
# Run all tests with Pest PHP
composer run test

# Alternative command
php artisan test

# Run specific test suites
php artisan test --testsuite=Feature
php artisan test --testsuite=Unit

# Run tests with coverage
php artisan test --coverage

# Run tests in parallel (faster)
php artisan test --parallel
```

### Test Structure
- **Feature Tests**: `tests/Feature/` - End-to-end functionality
- **Unit Tests**: `tests/Unit/` - Individual component testing
- **Browser Tests**: Coming soon with Laravel Dusk

## 🚀 Production Deployment

### Build Assets

```bash
# Build for production
npm run build

# Build with Server-Side Rendering
npm run build:ssr

# Optimize Laravel
php artisan optimize
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

### Production Checklist

- [ ] Set `APP_ENV=production` in `.env`
- [ ] Set `APP_DEBUG=false` in `.env`
- [ ] Configure production database
- [ ] Set up proper `APP_URL`
- [ ] Configure mail settings
- [ ] Set up SSL certificate
- [ ] Configure proper file permissions
- [ ] Set up backup strategy
- [ ] Configure monitoring (logs, errors)

### Server Requirements

```bash
# Web server configuration
# Point document root to /public
# Enable mod_rewrite (Apache) or try_files (Nginx)

# File permissions
chmod -R 755 storage bootstrap/cache
chown -R www-data:www-data storage bootstrap/cache
```

## 🎯 Code Quality & Development Tools

### Frontend Quality Tools

```bash
# 🎨 Code formatting with Prettier
npm run format        # Format all files
npm run format:check  # Check formatting without changes

# 🔍 Linting with ESLint
npm run lint          # Lint and auto-fix issues

# 📝 TypeScript validation
npm run types         # Type checking without compilation
```

### Backend Quality Tools

```bash
# 🎨 PHP Code formatting with Laravel Pint
./vendor/bin/pint

# 🔍 Static analysis with PHPStan (if configured)
./vendor/bin/phpstan analyse

# 📋 Code style checking
php artisan pint --test
```

### Git Hooks & CI/CD

```bash
# Pre-commit hooks (recommended setup)
npm install --save-dev husky lint-staged
npx husky init

# Add to package.json:
# "lint-staged": {
#   "*.{js,jsx,ts,tsx}": ["eslint --fix", "prettier --write"],
#   "*.php": ["./vendor/bin/pint"]
# }
```

## 🔧 Troubleshooting

### Common Issues & Solutions

#### Permission Errors
```bash
# Fix Laravel permissions
chmod -R 755 storage bootstrap/cache
chown -R www-data:www-data storage bootstrap/cache  # Linux/Mac

# Windows (run as Administrator)
icacls storage /grant Users:F /T
icacls bootstrap/cache /grant Users:F /T
```

#### Dependency Issues
```bash
# Clear and reinstall Node dependencies
rm -rf node_modules package-lock.json
npm install

# Clear and reinstall Composer dependencies
rm -rf vendor composer.lock
composer install

# Regenerate autoload files
composer dump-autoload
```

#### Laravel Cache Issues
```bash
# Clear all Laravel caches
php artisan optimize:clear
php artisan cache:clear
php artisan config:clear
php artisan route:clear
php artisan view:clear
```

#### Database Issues
```bash
# Reset database
php artisan migrate:fresh --seed

# Check database connection
php artisan tinker
# In tinker: DB::connection()->getPdo();
```

#### Vite/Asset Issues
```bash
# Clear Vite cache
rm -rf node_modules/.vite
npm run dev

# Rebuild assets
npm run build
```

### Getting Help

- 📖 **Documentation**: Check the `/docs` folder (coming soon)
- 🐛 **Bug Reports**: [Create an issue](https://github.com/harveyhase68/scoriet/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/harveyhase68/scoriet/discussions)
- 📧 **Email**: [Contact us](mailto:support@scoriet.com)

---

## 📚 Documentation

### Project Structure
```
scoriet/
├── app/
│   ├── Http/Controllers/     # Laravel controllers
│   ├── Models/              # Eloquent models
│   └── Services/            # Business logic (SQL Parser, etc.)
├── resources/
│   ├── js/
│   │   ├── Components/      # React components
│   │   │   ├── AuthModals/  # Authentication modals
│   │   │   ├── Panels/      # RC Dock panels
│   │   │   ├── CSSFlag.tsx  # CSS-based flag icons
│   │   │   └── LanguageSelector.tsx  # i18n language picker
│   │   ├── pages/          # Inertia.js pages
│   │   ├── utils/          # Utility functions
│   │   │   └── i18n.ts     # Internationalization system
│   │   └── types/          # TypeScript definitions
│   └── css/                # Stylesheets
├── routes/                 # Laravel routes
├── tests/                 # Test files
└── database/              # Migrations, seeders, factories
```

### Key Technologies

- **[Laravel 12](https://laravel.com/docs)** - PHP framework
- **[React 19](https://react.dev)** - UI library  
- **[Inertia.js](https://inertiajs.com)** - Modern monolith bridge
- **[TypeScript](https://www.typescriptlang.org)** - Type safety
- **[Tailwind CSS](https://tailwindcss.com)** - Utility-first CSS
- **[RC Dock](https://github.com/ticlo/rc-dock)** - Docking layout system
- **[Vite](https://vitejs.dev)** - Build tool and dev server
- **[Pest PHP](https://pestphp.com)** - Testing framework

### API Reference

Coming soon - comprehensive API documentation with examples.

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Workflow

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Run tests: `composer run test`
5. Run quality checks: `npm run lint && npm run types`
6. Commit changes: `git commit -m 'Add amazing feature'`
7. Push to branch: `git push origin feature/amazing-feature`
8. Create a Pull Request

### Code Style

- **PHP**: Follow PSR-12 standards, use Laravel Pint
- **JavaScript/TypeScript**: Use ESLint + Prettier configuration
- **Commits**: Use conventional commit format

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with the assistance of Claude, ChatGPT, Gemini, and Builder.io AI
- Inspired by the original WinDev implementation
- Thanks to the Laravel and React communities

---

<div align="center">

**[⭐ Star this project](https://github.com/harveyhase68/scoriet)** if you find it helpful!

*Made with ❤️ for the developer community*

</div>