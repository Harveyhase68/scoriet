@echo off
echo ======================================
echo    NUCLEAR Laravel Reset (Last Resort)
echo ======================================
echo WARNING: This will aggressively clear everything!
echo.
pause

echo [1/6] Terminating ALL related processes...
taskkill /f /im php.exe >nul 2>&1
taskkill /f /im node.exe >nul 2>&1
taskkill /f /im npm.exe >nul 2>&1
taskkill /f /im composer.exe >nul 2>&1
timeout /t 5 /nobreak >nul

echo [2/6] Nuclear cache deletion...
rmdir /s /q "bootstrap\cache" >nul 2>&1
mkdir "bootstrap\cache" >nul 2>&1
rmdir /s /q "storage\framework\cache" >nul 2>&1
mkdir "storage\framework\cache" >nul 2>&1
mkdir "storage\framework\cache\data" >nul 2>&1
rmdir /s /q "storage\framework\views" >nul 2>&1
mkdir "storage\framework\views" >nul 2>&1

echo [3/6] Deleting vendor and regenerating...
rmdir /s /q "vendor" >nul 2>&1
del composer.lock >nul 2>&1

echo [4/6] Fresh composer install...
composer install

echo [5/6] Laravel cache clearing...
php artisan optimize:clear
php artisan route:clear
php artisan config:clear
php artisan cache:clear
php artisan view:clear

echo [6/6] Testing...
php artisan tinker --execute="echo 'DB: ' . DB::connection()->getDatabaseName() . PHP_EOL;"

echo.
echo ======================================
echo    ☢️ NUCLEAR Reset Complete!
echo ======================================
pause