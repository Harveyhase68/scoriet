@echo off
echo ======================================
echo    Laravel FULL Development Reset
echo ======================================
echo.

echo [1/8] Clearing ALL caches...
php artisan optimize:clear

echo [2/8] Clearing route cache...
php artisan route:clear

echo [3/8] Clearing config cache...
php artisan config:clear

echo [4/8] Clearing application cache...
php artisan cache:clear

echo [5/8] Clearing view cache...
php artisan view:clear

echo [6/8] Fresh database migration...
rem php artisan migrate:fresh

echo [7/8] Optimizing autoloader...
composer dump-autoload

echo [8/8] Testing database connection...
php artisan tinker --execute="echo 'DB: ' . DB::connection()->getDatabaseName() . PHP_EOL;"

echo.
echo ======================================
echo    ✅ Full Reset Complete!
echo ======================================
echo.

echo Testing API endpoint:
curl -X POST http://localhost:8000/api/sql-parse -H "Content-Type: text/plain" --data-raw "CREATE TABLE test (id INT);"

echo.
pause