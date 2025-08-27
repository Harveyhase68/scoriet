# 🚀 Scoriet - Windows Installation Guide

**Scoriet** is an Enterprise Code Generator built with Laravel and React. This guide helps you set up the development environment on Windows.

## 📋 Prerequisites

### Required Software

1. **WAMP Server** (Apache, MySQL, PHP)
   - Download: https://www.wampserver.com/en/
   - Includes PHP 8.2+, MySQL 8.0+, Apache
   - Alternative: XAMPP (https://www.apachefriends.org/)

2. **Node.js** (JavaScript Runtime)
   - Download: https://nodejs.org (LTS Version)
   - Minimum: Node.js 18+ with npm

3. **Composer** (PHP Package Manager)
   - Download: https://getcomposer.org/download/
   - Install globally for system-wide access

4. **Git** (Version Control)
   - Download: https://git-scm.com/download/win
   - Required for cloning the repository

## 🔧 Installation Steps

### Step 1: Clone Repository
```bash
git clone https://github.com/Harveyhase68/scoriet.git
cd scoriet
```

### Step 2: Install PHP Dependencies
```bash
composer install
```

### Step 3: Install JavaScript Dependencies
```bash
npm install
```

### Step 4: Environment Setup
```bash
# Copy environment file
copy .env.example .env

# Generate application key
php artisan key:generate
```

### Step 5: Database Setup

#### Option A: MySQL (Recommended)
1. Start WAMP Server
2. Open phpMyAdmin (http://localhost/phpmyadmin)
3. Create database: `scoriet`
4. Update `.env` file:
```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=scoriet
DB_USERNAME=root
DB_PASSWORD=
```

#### Option B: SQLite (Simple Testing)
1. Update `.env` file:
```env
DB_CONNECTION=sqlite
DB_DATABASE=database/database.sqlite
```
2. Create database file:
```bash
touch database/database.sqlite
```

### Step 6: Run Database Migrations
```bash
php artisan migrate
```

### Step 7: Laravel Passport OAuth2 Setup
```bash
# Install Passport
php artisan passport:install

# Create Password Grant Client
php artisan passport:client --password --name="Scoriet Password Grant Client"

# Create Personal Access Client
php artisan passport:client --personal --name="Scoriet Personal Access Client"
```

**Important:** Copy the Client ID and Secret from the Password Grant Client output.

### Step 8: Configure Frontend Authentication
Add the OAuth2 credentials to your `.env` file:
```env
VITE_PASSPORT_CLIENT_ID=your-password-grant-client-id
VITE_PASSPORT_CLIENT_SECRET=your-password-grant-client-secret
```

### Step 9: Start Development Servers

#### Option A: All-in-One (Recommended)
```bash
composer run dev
```

#### Option B: Separate Commands
Open 3 terminal windows:
```bash
# Terminal 1: Laravel Server
php artisan serve

# Terminal 2: Queue Worker
php artisan queue:listen

# Terminal 3: Vite Dev Server
npm run dev
```

## 🧪 Verification

### Run Tests
```bash
# PHP Tests (6 tests should pass)
php artisan test

# Linting
npm run lint

# Type Checking
npm run types
```

### Browser Test
1. Open: http://localhost:8000
2. Test Features:
   - ✅ User Registration
   - ✅ User Login
   - ✅ Main Panel (Database Visualization)
   - ✅ Interactive Panel (Template Management)
   - ✅ Navigation between panels

## 🛠️ Troubleshooting

### Common Issues

#### "Target class does not exist"
```bash
composer dump-autoload
php artisan config:clear
php artisan cache:clear
```

#### "Key path does not exist"
```bash
php artisan passport:keys
```

#### "Database connection failed"
1. Ensure WAMP/XAMPP is running
2. Check MySQL service is started
3. Verify database exists in phpMyAdmin
4. Check `.env` database credentials

#### "Permission denied" (Storage)
```bash
# Windows Command Prompt (Run as Administrator)
icacls storage /grant Users:F /t
icacls bootstrap\cache /grant Users:F /t
```

#### "npm install fails"
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rmdir /s node_modules
npm install
```

#### Laravel Passport Authentication Issues
1. Ensure Passport clients are created correctly
2. Check `.env` file has correct CLIENT_ID and CLIENT_SECRET
3. Clear config cache: `php artisan config:clear`

### Development Commands

```bash
# Database
php artisan migrate:fresh          # Reset database
php artisan db:seed                # Seed test data (if available)

# Code Quality
npm run format                     # Format code with Prettier
npm run build                      # Production build

# Laravel
php artisan route:list             # Show all routes
php artisan tinker                 # Interactive PHP shell
```

## 🏗️ Architecture Overview

- **Backend:** Laravel 12 with PHP 8.2+
- **Frontend:** React 19 with TypeScript
- **Bridge:** Inertia.js 2.0 for seamless SPA experience
- **UI:** RC Dock for Multi-Document Interface
- **Auth:** Laravel Passport OAuth2
- **Database:** MySQL/SQLite support
- **Build:** Vite 7.0 with hot reload

## 📚 Key Features

- **SQL Parser:** Parse MySQL database schemas
- **Template Engine:** JavaScript-powered code generation
- **MDI Interface:** Dockable panels with rc-dock
- **Modern Auth:** Complete OAuth2 system
- **Real-time UI:** Hot reload development

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Run tests: `php artisan test && npm run lint`
5. Commit: `git commit -m 'Add amazing feature'`
6. Push: `git push origin feature/amazing-feature`
7. Open a Pull Request

## 📧 Support

For issues or questions:
- GitHub Issues: https://github.com/Harveyhase68/scoriet/issues
- Email: [Your email for Scoriet users]

## 📄 License

[Add your license information here]

---

**Happy Coding! 🚀**