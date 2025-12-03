@echo off
echo Starting Scoriet Development Environment...
echo.

REM Start Laravel Server in new window
start "Scoriet - Laravel Server" cmd /k "php artisan serve --host=10.0.0.8 --port=8000"

REM Wait 2 seconds
timeout /t 2 /nobreak > nul

REM Start Queue Worker in new window
start "Scoriet - Queue Worker" cmd /k "php artisan queue:listen --tries=1"

REM Wait 2 seconds
timeout /t 2 /nobreak > nul

REM Start Vite Dev Server in new window
start "Scoriet - Vite Dev" cmd /k "npm run dev"

echo.
echo All services started!
echo.
echo Windows opened:
echo  - Laravel Server (http://10.0.0.8:8000)
echo  - Queue Worker
echo  - Vite Dev Server
echo.
echo Press any key to exit this window...
pause > nul
