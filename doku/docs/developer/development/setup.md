---
sidebar_position: 5
---

# Development Setup

Complete guide for setting up Scoriet development environment on your local machine.

## System Requirements

### Minimum Requirements

- **PHP**: 8.2 or later
- **Node.js**: 18.x or later (LTS recommended)
- **npm**: 9.x or later
- **MySQL/MariaDB**: 5.7 or later (or PostgreSQL, SQLite for testing)
- **RAM**: 4GB minimum (8GB recommended)
- **Disk Space**: 5GB free space

### Windows Setup Note

Development is performed on Windows. The database server is accessible via:
- **MySQL Host**: `localhost` (for standard tools)
- **MySQL Host (curl/API)**: `10.0.0.8` (required for curl commands)
- **Username**: `root`
- **Password**: `admin`

## Step 1: Clone Repository

```bash
git clone https://github.com/your-repo/scoriet.git
cd scoriet
```

## Step 2: Install Dependencies

### Backend Dependencies

```bash
composer install
```

This installs:
- Laravel framework and dependencies
- Laravel Passport for OAuth2
- PHPOffice for spreadsheet support
- Stripe and PayPal SDKs
- Pest testing framework

### Frontend Dependencies

```bash
npm install
```

This installs:
- React 19
- TypeScript
- Inertia.js
- Vite
- Tailwind CSS
- Ant Design Icons
- RC Dock

## Step 3: Environment Configuration

### Copy Environment File

```bash
cp .env.example .env
```

### Generate Application Key

```bash
php artisan key:generate
```

This generates a unique encryption key for your application.

### Configure Database

Edit `.env` and configure database connection:

#### Option A: MySQL (Recommended for Development)

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=scoriet_db
DB_USERNAME=root
DB_PASSWORD=admin
```

#### Option B: SQLite (for Testing)

```env
DB_CONNECTION=sqlite
DB_DATABASE=:memory:
```

### Configure Laravel Passport

Update `.env` with Passport OAuth2 credentials:

```env
VITE_PASSPORT_CLIENT_ID=1
VITE_PASSPORT_CLIENT_SECRET=your-secret-key-here
```

### Configure Vite

Ensure Vite configuration for development:

```env
VITE_APP_NAME=Scoriet
VITE_APP_VERSION=1.0.0.0
VITE_SHOW_DEMO_USERS=false
```

### Configure Cache (Optional but Recommended)

For faster template compilation, use Redis:

```env
CACHE_STORE=redis
TEMPLATE_CACHE_ENABLED=true
TEMPLATE_CACHE_TTL_HOURS=24
```

Or use file cache if Redis not available:

```env
CACHE_STORE=file
TEMPLATE_CACHE_ENABLED=true
```

## Step 4: Database Setup

### Run Migrations

```bash
php artisan migrate
```

This creates all database tables:
- users
- projects
- schemas
- templates
- code_adjustments
- generation_logs
- And more...

### Optional: Seed Demo Data

```bash
php artisan db:seed
```

This populates sample projects, templates, and schemas for testing.

## Step 5: Laravel Passport Setup

Passport handles OAuth2 authentication. Set it up with these commands:

### Install Passport

```bash
php artisan passport:install
```

This generates encryption keys used for token generation.

### Create Password Grant Client

```bash
php artisan passport:client --password \
  --name="Scoriet Password Grant Client" \
  --provider=users
```

**Output**:
```
Client ID:     1
Client secret: your-secret-here
```

Copy the **Client ID** and **Client secret** to your `.env`:

```env
VITE_PASSPORT_CLIENT_ID=1
VITE_PASSPORT_CLIENT_SECRET=your-secret-here
```

### Create Personal Access Client

```bash
php artisan passport:client --personal \
  --name="Scoriet Personal Access Client"
```

This allows the application to issue access tokens for API requests.

### Verify Passport Configuration

```bash
php artisan passport:keys
```

Should output your encryption keys (in `storage/oauth-*`).

## Step 6: Create Initial User

```bash
php artisan tinker
```

In the Tinker shell:

```php
>>> App\Models\User::create([
      'name' => 'Admin User',
      'email' => 'admin@example.com',
      'password' => bcrypt('password123'),
    ])
>>> exit
```

Or use artisan command:

```bash
php artisan make:user --name="Admin User" --email="admin@example.com"
```

## Step 7: Build Frontend

### Development Build

```bash
npm run dev
```

Starts Vite in development mode with hot reload. Keep this running in a terminal.

### Production Build (when ready)

```bash
npm run build
```

**Note**: Do NOT run `npm run build` during normal development - Vite handles hot reload automatically.

## Step 8: Start Development Servers

### Option A: All-in-One (Recommended)

Runs Laravel server, queue worker, and Vite together:

```bash
composer run dev
```

This command (from composer.json scripts) starts:
- Laravel development server (port 8000)
- Queue worker (processes background jobs)
- Vite dev server (for frontend hot reload)
- Laravel Reverb WebSocket server

Keep this running while developing. Access the application at `http://localhost:8000`

### Option B: Manual Start (if all-in-one doesn't work)

In separate terminal windows:

**Terminal 1 - Laravel Server**:
```bash
php artisan serve
```

**Terminal 2 - Queue Worker**:
```bash
php artisan queue:listen
```

**Terminal 3 - Vite Dev Server**:
```bash
npm run dev
```

**Terminal 4 - Reverb WebSocket** (optional):
```bash
php artisan reverb:start
```

## Step 9: Access Application

Open your browser and navigate to:

```
http://localhost:8000
```

### Demo Login (if enabled)

If `VITE_SHOW_DEMO_USERS=true` in `.env`, you'll see demo user buttons in login modal:
- Email: `demo-admin@example.com` / Password: `password`
- Email: `demo-user@example.com` / Password: `password`

Or login with your created user:
- Email: `admin@example.com` / Password: `password123`

## Verification Checklist

After setup, verify everything works:

```bash
# ✅ Check PHP version
php --version                    # Should be 8.2+

# ✅ Check Node version
node --version                   # Should be 18+
npm --version                    # Should be 9+

# ✅ Check database connection
php artisan tinker
  >>> DB::connection()->getPDO()
  >>> exit

# ✅ Check Passport setup
php artisan passport:keys

# ✅ Check Laravel can serve
php artisan serve               # Should start on http://localhost:8000

# ✅ Check npm dependencies
npm list                        # Should show dependency tree

# ✅ Check code quality
npm run lint                    # Should pass linting
npm run types                   # Should have no type errors
```

## Optional Setup

### Code Quality Tools

#### ESLint with Auto-Fix

```bash
npm run lint
```

Checks and auto-fixes JavaScript/TypeScript code style.

#### Prettier Code Formatting

```bash
npm run format
```

Formats code to project standards.

#### TypeScript Type Checking

```bash
npm run types
```

Checks for TypeScript type errors without compiling.

### Laravel Pint (PHP Code Quality)

```bash
composer run lint
```

Checks and fixes PHP code style (optional).

### Testing

Run Pest PHP tests:

```bash
composer run test
```

Or with coverage:

```bash
composer run test -- --coverage
```

## Common Issues & Solutions

### Issue: "Module not found" in npm

**Solution**:
```bash
rm -rf node_modules package-lock.json
npm install
```

### Issue: Laravel can't connect to database

**Verify** `.env` database settings:
```bash
php artisan tinker
  >>> DB::connection()->getPDO()
```

Should not throw an error.

### Issue: "Class not found" errors

**Solution**:
```bash
composer dump-autoload
```

Regenerates Composer autoload files.

### Issue: Passport showing "invalid_client"

**Verify** Passport setup:
```bash
php artisan passport:install
```

And check `.env` has correct `VITE_PASSPORT_CLIENT_ID` and `VITE_PASSPORT_CLIENT_SECRET`.

### Issue: Vite not compiling changes

**Solution**: Stop and restart:
```bash
npm run dev
```

Or if using `composer run dev`:
```bash
composer run dev
```

### Issue: "localhost connection refused" for curl

**For API calls**, use instead of localhost:
```bash
curl http://10.0.0.8:8000/api/...
```

This is required on Windows development machines per project guidelines.

## IDE Setup

### VS Code

**Recommended Extensions**:
```
- PHP Intelephense (PHP development)
- Laravel Extension Pack (Laravel)
- Tailwind CSS IntelliSense
- ESLint
- Prettier - Code formatter
- Thunder Client (API testing)
```

**.vscode/settings.json**:
```json
{
  "[php]": {
    "editor.defaultFormatter": "bmewburn.vscode-intelephense-client"
  },
  "[javascript][typescript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "editor.formatOnSave": true
}
```

### Laravel IDE Helper (Optional)

```bash
composer require --dev barryvdh/laravel-ide-helper
php artisan ide-helper:generate
```

Generates IDE helper files for better autocomplete.

## Next Steps

1. Read [Commands Reference](commands.md) for development commands
2. Read [Code Conventions](conventions.md) for coding standards
3. Create your first template in the UI
4. Test code generation with a sample schema
5. Review existing code in `/app/Services/` to understand patterns

## Additional Resources

- [Laravel Documentation](https://laravel.com/docs/)
- [React Documentation](https://react.dev)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [Inertia.js Documentation](https://inertiajs.com/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Vite Documentation](https://vitejs.dev/)

## Support

If you encounter issues:

1. Check logs: `storage/logs/laravel.log`
2. Enable debug mode: `APP_DEBUG=true` in `.env`
3. Run `composer run test` to check for regressions
4. Review error messages carefully (they often suggest solutions)
