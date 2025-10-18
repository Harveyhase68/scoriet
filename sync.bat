@echo off
REM ===================================
REM Scheduled Sync zu Qsync (Silent Mode)
REM Optimiert für Windows Aufgabenplanung
REM ===================================

setlocal

set SOURCE=C:\wamp\www
set DEST=C:\Users\Alex\Qsync\www
set LOGFILE=C:\wamp\www\storage\logs\qsync-backup.log

REM Erstelle Log-Verzeichnis falls nicht vorhanden
if not exist "C:\wamp\www\storage\logs" mkdir "C:\wamp\www\storage\logs"

REM Log-Eintrag
echo [%date% %time%] Sync gestartet >> "%LOGFILE%"

REM Robocopy mit Silent Mode
robocopy "%SOURCE%" "%DEST%" /MIR /FFT /Z /W:5 /R:3 ^
    /XD "node_modules" ".git" "vendor" "storage\framework\cache" "storage\framework\sessions" "storage\framework\views" "storage\logs" "public\build" ".vite" ^
    /XF ".env" "*.log" ".DS_Store" "Thumbs.db" "desktop.ini" ^
    /NFL /NDL /NJH /NJS /NP >> "%LOGFILE%" 2>&1

set EXITCODE=%errorlevel%

if %EXITCODE% leq 3 (
    echo [%date% %time%] Sync erfolgreich (Exit: %EXITCODE%) >> "%LOGFILE%"
) else (
    echo [%date% %time%] Sync FEHLER (Exit: %EXITCODE%) >> "%LOGFILE%"
)

echo. >> "%LOGFILE%"

endlocal
exit /b 0
