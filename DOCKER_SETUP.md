**Docker Setup for Scoriet**

**Troubleshooting**

**What was the problem?**

- **Missing Passport Migrations**: The standard Laravel Passport migrations were missing.
- **Incorrect Sequence**: The entrypoint.sh was executing operations in the wrong order.
- **No Error Handling**: If an error occurred, the script continued anyway.
- **Incorrect Permissions**: OAuth keys did not have the correct file permissions.

**Implemented Solution**

**1\. Added Passport Migrations**

New migration files were created:

- database/migrations/2026_01_01_000000_create_oauth_clients_table.php
- database/migrations/2026_01_01_000001_create_oauth_personal_access_clients_table.php
- database/migrations/2026_01_01_000002_create_oauth_access_tokens_table.php
- database/migrations/2026_01_01_000003_create_oauth_refresh_tokens_table.php
- database/migrations/2026_01_01_000004_create_oauth_auth_codes_table.php

These include the redirect column and all other required fields.

**2\. Restructured entrypoint.sh**

- ✓ Improved error handling with Try-Catch logic.
- ✓ Clear steps with logging output.
- ✓ Idempotent operations (can be called multiple times without errors).
- ✓ Passport Client is only created if it doesn't already exist.
- ✓ APP_KEY is only generated if missing.
- ✓ Correct sequence: DB Connection → Migrations → Keys → Client.

**3\. Improved docker-compose.yml**

- ✓ Health-check for MySQL DB (waits until DB is ready).
- ✓ Removed volume mounting of .env.docker (insecure).
- ✓ Named volumes for persistent storage.
- ✓ Environment variables defined directly in docker-compose.

**4\. Maintained Dockerfile**

The Dockerfile was already correct and remains unchanged.

**Usage**

**Start New Container (Fresh Start)**

Bash

\# Delete old containers/volumes (optional, if a full reset is desired)

docker-compose down -v

\# Build and start containers

docker-compose up --build

**Start Container (Normal Start)**

Bash

docker-compose up

**Stop Container**

Bash

docker-compose down

**What is executed automatically at startup?**

- **Wait for DB** (max. 30 attempts, every 2 seconds)
- **Create .env** (if not present)
- **Generate APP_KEY** (if not present)
- **Run Migrations** (all tables are created)
- **Generate Passport Keys** (if not present)
- **Create Passport OAuth Client** (idempotent - only if it doesn't exist)
- **Clear Caches**
- **Set Permissions**
- **Start Apache**

**Access after Startup**

- **App URL**: <http://localhost:8888>
- **Database** (External): localhost:3306
  - Username: root
  - Password: admin
  - Database: scoriet

**Test Call from Local Machine**

If you are using curl, use 10.0.0.8 instead of localhost (as mentioned in CLAUDE.md):

Bash

\# API Health-Check

curl -X GET <http://10.0.0.8:8888/api/health>

\# Login with test user

curl -X POST <http://10.0.0.8:8888/api/oauth/token> \\

\-H "Content-Type: application/json" \\

\-d '{

"grant_type": "password",

"client_id": "99999999-9999-9999-a9999-999999999999",

"client_secret": "9999999999999999999999999999999999999999",

"username": "<user@example.com>",

"password": "password",

"scope": "\*"

}'

**Troubleshooting**

**"Unknown column 'redirect' in 'field list'"**

✓ **FIXED** - Passport migrations are now correctly created.

**"oauth_client exists" Error during Migration**

✓ **FIXED** - Migrations now run in the correct sequence.

**Container starts but DB is unreachable**

- Start Docker: docker-compose up (it waits automatically via Health-check).
- The app waits for a maximum of 30 seconds for the DB in entrypoint.sh.

**Volumes not persistent**

✓ **FIXED** - Named volumes in docker-compose are now persistent.

**Environment Variables**

These are set in the docker-compose.yml:

Code-Snippet

DB_HOST=db

DB_PORT=3306

DB_USER=root

DB_PASSWORD=admin

DB_DATABASE=scoriet

AUTO_MIGRATE=true

To change these: simply adjust them in docker-compose.yml and run docker-compose restart.

**Pro-Tips**

- **View Logs**: docker-compose logs -f app
- **DB Logs**: docker-compose logs -f db
- **Enter Container**: docker exec -it scoriet-app bash
- **Artisan Commands**: docker exec -it scoriet-app php artisan migrate:status
- **Fresh Start**: docker-compose down -v && docker-compose up --build

**Production Configuration**

For production, you should:

- Update .env.docker with real-world values.
- Use secure port mappings in docker-compose.yml.
- Configure HTTPS/SSL.
- Use strong passwords for the database.
- Set up a backup strategy for the db_data volume.

**Created**: 2026-05-10 as a fix for Docker/Database initialization issues. **Version**: 1.0