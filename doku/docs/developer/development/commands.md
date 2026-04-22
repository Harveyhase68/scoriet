---
sidebar_position: 6
---

# Development Commands Reference

Common commands used during Scoriet development. All commands assume you're in the project root directory.

## Server & Build Commands

### Start Development Environment (All-in-One)

```bash
composer run dev
```

**What it does:**
- Starts Laravel development server (port 8000)
- Starts queue worker for background jobs
- Starts Vite dev server with hot reload
- Starts Laravel Reverb WebSocket server

**Output:**
```
  Laravel development server started: http://localhost:8000
  Queue worker listening...
  VITE v7.0.0 ready in 1234 ms
  Reverb server started...
```

**Access point**: `http://localhost:8000`

### Start with Server-Side Rendering (SSR)

```bash
composer run dev:ssr
```

Similar to `composer run dev` but with SSR support for faster initial page loads.

### Manual Server Start (if needed)

```bash
# Terminal 1: Laravel server
php artisan serve

# Terminal 2: Queue worker (in separate terminal)
php artisan queue:listen

# Terminal 3: Vite dev server (in separate terminal)
npm run dev

# Terminal 4: WebSocket server (optional)
php artisan reverb:start
```

## Code Quality Commands

### Run ESLint (JavaScript/TypeScript)

```bash
npm run lint
```

**Checks:**
- Code style violations
- Unused variables
- Syntax errors

**With auto-fix:**
```bash
npm run lint -- --fix
```

Automatically fixes most style issues.

### Format Code with Prettier

```bash
npm run format
```

**Formats:**
- JavaScript/TypeScript files
- JSON files
- CSS/SCSS
- HTML templates

### TypeScript Type Checking

```bash
npm run types
```

**Checks:**
- Type mismatches
- Missing type definitions
- Unused variables
- Function signature errors

**Output example:**
```
src/Components/MyComponent.tsx:15:5
  Type 'string' is not assignable to type 'number'
```

### PHP Code Quality (Optional)

```bash
composer run lint
```

Checks PHP code style using Laravel Pint.

## Database Commands

### Run Migrations

```bash
php artisan migrate
```

**Applies pending migrations** in order. Creates tables, modifies schemas, etc.

### Rollback Last Batch

```bash
php artisan migrate:rollback
```

**Reverses** the most recent migration batch.

### Rollback All

```bash
php artisan migrate:reset
```

**Removes all database tables**. Use carefully!

### Fresh Migration (Reset + Migrate)

```bash
php artisan migrate:fresh
```

**Removes all tables and re-runs all migrations**. Same as reset + migrate.

### Fresh with Seeding

```bash
php artisan migrate:fresh --seed
```

Resets database and populates with demo data.

### Create New Migration

```bash
php artisan make:migration create_table_name_table
php artisan make:migration add_column_to_table_name_table
```

**Creates** a new migration file in `database/migrations/`.

### Seed Database

```bash
php artisan db:seed
```

**Populates database** with demo data from seeders.

## Testing Commands

### Run All Tests

```bash
composer run test
```

**Runs** Pest PHP tests. Reports passes and failures.

### Run Tests with Coverage

```bash
composer run test -- --coverage
```

Shows which code is covered by tests (percentage).

### Run Specific Test

```bash
php artisan test tests/Feature/TemplateEngineTest.php
```

### Run Tests in Watch Mode

```bash
php artisan test --watch
```

Automatically re-runs tests when files change.

## Laravel Artisan Commands

### Generate Application Key

```bash
php artisan key:generate
```

**Required** during setup. Generates unique encryption key for `.env`.

### Tinker (Interactive Shell)

```bash
php artisan tinker
```

**Interactive PHP shell** for testing code and querying database:

```php
>>> App\Models\User::all()
>>> App\Models\Project::count()
>>> DB::table('users')->first()
>>> exit
```

### Create Admin User

```bash
php artisan tinker
>>> App\Models\User::create([
      'name' => 'Admin',
      'email' => 'admin@example.com',
      'password' => bcrypt('password123')
    ])
>>> exit
```

### Clear Cache

```bash
php artisan cache:clear
```

**Clears** all cached data. Use if cache is stale.

### Clear Config Cache

```bash
php artisan config:clear
```

**Clears** cached configuration.

### Regenerate Autoload

```bash
composer dump-autoload
```

**Regenerates** Composer autoload files. Use if "Class not found" errors occur.

## Passport (OAuth2) Commands

### Install Passport

```bash
php artisan passport:install
```

**Generates** encryption keys. Required during setup.

### Create Password Grant Client

```bash
php artisan passport:client --password --name="Scoriet Password Grant"
```

**Creates OAuth2 client** for password grant flow (login).

### Create Personal Access Client

```bash
php artisan passport:client --personal --name="Scoriet Personal Access"
```

**Creates OAuth2 client** for personal access tokens.

### Regenerate Keys

```bash
php artisan passport:keys
```

**Regenerates** encryption keys if compromised.

### List Clients

```bash
php artisan passport:clients
```

**Shows** all created OAuth2 clients with IDs and secrets.

## File System Commands

### Publish Assets

```bash
php artisan vendor:publish
```

**Publishes** vendor package assets to public directory.

### Storage Link

```bash
php artisan storage:link
```

**Creates symbolic link** from `storage/app/public` to `public/storage`.

## Queue Commands

### Listen to Queue

```bash
php artisan queue:listen
```

**Processes** queued jobs. Keep this running in development.

### Process Single Batch

```bash
php artisan queue:work
```

Processes one batch of jobs then stops.

### View Failed Jobs

```bash
php artisan queue:failed
```

**Lists** all jobs that failed.

### Retry Failed Job

```bash
php artisan queue:retry
```

**Retries** failed jobs.

## Building for Production

### Build Frontend

```bash
npm run build
```

**Compiles** JavaScript/TypeScript and CSS for production. Outputs to `public/build/`.

**Note:** Do NOT run this during development - Vite handles this automatically.

### Build with SSR

```bash
npm run build:ssr
```

**Builds** with Server-Side Rendering support.

## NPM Package Management

### Install All Dependencies

```bash
npm install
```

**Installs** all packages listed in `package.json` and `package-lock.json`.

### Add New Package

```bash
npm install package-name
```

**Installs** and saves package to `package.json`.

### Add Development Package

```bash
npm install --save-dev package-name
```

**Installs** as dev dependency (testing, build tools, etc).

### Update Packages

```bash
npm update
```

**Updates** all packages to latest compatible versions.

### Check for Vulnerabilities

```bash
npm audit
```

**Reports** security vulnerabilities in dependencies.

### Fix Vulnerabilities

```bash
npm audit fix
```

**Automatically fixes** vulnerable dependencies.

## Composer Package Management

### Install Dependencies

```bash
composer install
```

**Installs** all packages in `composer.json`.

### Update Dependencies

```bash
composer update
```

**Updates** packages to latest compatible versions.

### Add New Package

```bash
composer require vendor/package
```

**Installs** and adds package to `composer.json`.

### Add Development Package

```bash
composer require --dev vendor/package
```

**Installs** as development dependency.

### Check Installed Packages

```bash
composer show
```

**Lists** all installed packages and versions.

### Check for Updates

```bash
composer outdated
```

**Shows** packages with newer versions available.

## Useful Aliases

Add these to your shell profile (`.bashrc`, `.zshrc`, etc.) for faster typing:

```bash
alias dev='composer run dev'
alias test='composer run test'
alias lint='npm run lint'
alias format='npm run format'
alias migrate='php artisan migrate'
alias tinker='php artisan tinker'
alias queue='php artisan queue:listen'
alias serve='php artisan serve'
alias mfs='php artisan migrate:fresh --seed'
```

Then use:
```bash
dev                 # instead of composer run dev
test                # instead of composer run test
lint                # instead of npm run lint
mfs                 # instead of php artisan migrate:fresh --seed
```

## Git Workflow Commands

**Note:** Do not push to remote repository. Push only to local branches for version control.

```bash
# View changes
git status
git diff

# Stage changes
git add .

# Commit changes
git commit -m "Description of changes"

# View commit history
git log --oneline -n 10

# Create local branch
git checkout -b feature/my-feature

# Switch branches
git checkout develop
```

**Remember:** The project owner pushes to the remote repository. Focus on:
- Using git as a version control backup
- Creating branches for different features
- Writing clear commit messages

## Common Development Workflows

### Start Work on New Feature

```bash
# Update your local repo
git pull origin develop

# Create feature branch
git checkout -b feature/my-new-feature

# Start dev servers
composer run dev
```

### After Making Changes

```bash
# Check code quality
npm run lint -- --fix
npm run format
npm run types

# Run tests
composer run test

# Commit changes
git add .
git commit -m "Implement my new feature"
```

### Testing New Template

```bash
# Start servers
composer run dev

# In browser:
# 1. Create new project
# 2. Upload schema
# 3. Create template
# 4. Generate code
# 5. Download and review

# In shell - check generated files
ls -la generated/
```

### Database Debugging

```bash
# See what's in database
php artisan tinker
>>> DB::table('projects')->get()
>>> DB::table('templates')->get()
>>> exit

# Reset database to clean state
php artisan migrate:fresh --seed

# Check migration status
php artisan migrate:status
```

## Troubleshooting Commands

### Check System Setup

```bash
# Check PHP version
php --version

# Check Node version
node --version

# Check npm version
npm --version

# Check database connection
php artisan tinker
>>> DB::connection()->getPDO()
>>> exit

# Check Composer
composer diagnose
```

### Clear All Caches

```bash
# Clear all caches
php artisan cache:clear
php artisan config:clear
php artisan route:clear
php artisan view:clear

# Rebuild autoload
composer dump-autoload

# Reinstall node modules (if issues)
rm -rf node_modules package-lock.json
npm install
```

### Check Logs

```bash
# View Laravel error log
tail -f storage/logs/laravel.log

# View browser console (in developer tools)
# F12 → Console tab
```

## Performance Profiling

### Enable Debug Toolbar

Set in `.env`:
```env
APP_DEBUG=true
DEBUGBAR_ENABLED=true
```

Shows performance metrics, queries, logs in application.

### Check Query Count

```php
// In routes/web.php for testing
use Illuminate\Support\Facades\DB;

DB::enableQueryLog();
// ... your code ...
dd(DB::getQueryLog());
```

Shows all database queries executed.

### Monitor Queue Performance

```bash
php artisan queue:monitor
```

Shows queue worker stats and performance.
