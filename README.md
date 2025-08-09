# Scoriet [see old site](https://www.scoriet.com)

An Enterprise Code Generator prepared and created with the help of Claude, ChatGPT, Gemini, and Builder.io AI.

A complete rewrite of Scoriet, which was developed with WinDev (https://www.windev.com) a powerful, RAD tool, but not accepted by the community.

Scoriet is a powerful application designed to optimize code generation through automation and intelligent templating. It aims to simplify developers' work by reducing repetitive tasks and ensuring consistency across their projects.

**Core Features**

Scoriet offers a range of features that make it a comprehensive tool for code generation:

* SQL Parser for MySQL: Easily parses MySQL database schemas to facilitate code generation based on your database structure.
* Template-Based Code Generator: Utilizes flexible templates to generate customized code.

**Modern Technology Stacks:**

* Laravel 12: Provides a robust backend framework.
* React 19: Enables dynamic and responsive user interfaces.
* Inertia.js: Seamlessly connects Laravel and React for monolithic application development.
* React Theme from Builder.io: Ensures a professional and appealing design.

**Client-Side Template Execution: All templates are executed directly in the client's browser using JavaScript, ensuring fast and secure generation without server load.**

**Secure Authentication:**

* Passport for Internal API: Guarantees secure authentication for your internal APIs.
* Passkey for User Login/Password Storage: Offers a modern and secure method for user authentication and password management.

**Flexible Template Options**

Scoriet provides various ways to manage and utilize templates, ensuring maximum flexibility:

* Local Files: Templates can be stored and used as individual local files.
* Local Directories: Entire directories containing template files can be included.
* One-Time Project Template: A central template that can be used for initializing an entire project.
* Table-Specific Templates: Create specific templates for each database table to automate the generation of CRUD operations or models.
* Each Template, which is compatible, can be stacked together, so you can have a CRUD template and a login/profile poilerplate template, both together generates a complete CRUD app with login and a user profile!

**Powerful Template Syntax**

* Scoriet's templates are highly flexible and allow for complex generation logic:
* Placeholders: Simple placeholders like {projectname} enable dynamic insertion of project information.
* Loop Constructs: With syntax like {for %}{endfor} or {for {nmaxitems}}{item.name}{endfor}, you can iterate over collections, for example, to process all fields in a file.
* Advanced Logic with JavaScript: Combine template code with JavaScript to implement sophisticated generation logic and gain full control over the generated code.

**Getting Started**

To start using Scoriet, simply clone the repository and follow the instructions in the documentation...

# Installation

## Requirements
- **PHP** ≥ 8.2  
- **Composer**  
- **Node.js** ≥ 18 & npm/yarn  
- **MySQL**, **PostgreSQL**, **SQLite** or **MS-SQL**

## Setup

# 1. Clone repository
```bash
git clone harveyhase68/scoriet
cd scoriet
```

# 2. Install PHP dependencies
```bash
composer install```

# 3. Configure environment
```bash
cp .env.example .env
php artisan key:generate```

# 4. Configure database in .env
```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=your_database_name
DB_USERNAME=your_username
DB_PASSWORD=your_password```

# 5. Run migrations
```bash
php artisan migrate```

# 6. Install Node.js dependencies
```bash
npm install```

# 7. (Optional) Install Laravel Passport
```bash
php artisan passport:install```

# Development

# All-in-one (recommended)
```bash
composer run dev```

# With SSR
```bash
composer run dev:ssr```

# Manual start
```bash
php artisan serve          # Laravel
php artisan queue:listen   # Queue (optional)
npm run dev                # Frontend```

# Testing
```bash
composer run test```

# or
```bash
php artisan test```

# Production
```bash
npm run build
npm run build:ssr    # With SSR```

# Code Quality
```bash
npm run format   # Format
npm run lint     # Lint
npm run types    # TypeScript check```

# Troubleshooting
```bash
chmod -R 755 storage bootstrap/cache
rm -rf node_modules && npm install
composer dump-autoload```