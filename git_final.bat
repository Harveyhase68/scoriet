@echo off
setlocal enabledelayedexpansion

:: git_final.bat - Aufraeumen nach GitHub PR Merge

set "TARGET_BRANCH=feature/new-feature"

echo.
echo ===========================================
echo :: Git Final - Lokal aufraeumen nach PR Merge
echo ===========================================
echo.

:: 1. Pruefe aktuellen Branch
for /f "tokens=*" %%a in ('git rev-parse --abbrev-ref HEAD') do (
set CURRENT_BRANCH=%%a
)

echo Aktueller Branch: !CURRENT_BRANCH!
echo.

:: 2. Wechsel zu main (falls nicht schon dort)
if not "!CURRENT_BRANCH!"=="main" (
echo ^> git switch main
git switch main
if errorlevel 1 (
echo [FEHLER] Konnte nicht zu main wechseln!
exit /b 1
)
echo.
)

:: 3. Pull neueste Aenderungen von main (inkl. merged PR)
echo ^> git pull origin main
git pull origin main
if errorlevel 1 (
echo [FEHLER] Pull fehlgeschlagen!
exit /b 1
)
echo.

:: 4. Loesche lokalen Feature-Branch
echo ^> git branch -d !TARGET_BRANCH!
git branch -d !TARGET_BRANCH!
if errorlevel 1 (
echo [WARNUNG] Branch !TARGET_BRANCH! konnte nicht geloescht werden.
echo Entweder existiert er nicht oder hat ungemergte Commits.
echo Zum Forcieren: git branch -D !TARGET_BRANCH!
echo.
)

:: 5. Loesche Remote-Tracking-Branch (falls vorhanden)
echo ^> git remote prune origin
git remote prune origin

echo.
echo ===========================================
echo :: FERTIG! Lokales Repository aufgeraeumt.
echo :: Du bist auf main mit den neuesten Aenderungen.
echo :: Bereit fuer naechste Aenderungen!
echo ===========================================
echo.

endlocal
