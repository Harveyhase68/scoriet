@echo off
echo Stopping Scoriet Development Environment...
echo.

REM Kill Laravel Server
taskkill /FI "WindowTitle eq Scoriet - Laravel Server*" /T /F 2>nul
if %errorlevel% equ 0 echo ✓ Laravel Server stopped

REM Kill Queue Worker
taskkill /FI "WindowTitle eq Scoriet - Queue Worker*" /T /F 2>nul
if %errorlevel% equ 0 echo ✓ Queue Worker stopped

REM Kill Vite Dev Server
taskkill /FI "WindowTitle eq Scoriet - Vite Dev*" /T /F 2>nul
if %errorlevel% equ 0 echo ✓ Vite Dev Server stopped

echo.
echo All services stopped!
echo.
timeout /t 3 /nobreak > nul
