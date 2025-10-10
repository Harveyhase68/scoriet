@echo off
setlocal enabledelayedexpansion

:: ----------------------------------------------------
:: 1. Commit-Nachricht erfassen und dynamischen Branch-Namen festlegen
:: ----------------------------------------------------
if "%~1"=="" (
    set /p commitMessage=Please enter a commit message: 
    
    :: Verwende die ganze Zeile, keine Manipulation notwendig
    set commitMessage=!commitMessage!
    if "!commitMessage!"=="" (
        echo Commit message cannot be empty!
        exit /b 1
    )
) else (
    set "commitMessage=%~1"
)

:: Erzeuge einen dynamischen Branch-Namen aus dem aktuellen Datum/Zeit und dem ersten Wort des Commits
:: Dies ist wichtig, da du sonst bei jeder Ausführung versuchst, den GLEICHEN Branch zu erstellen.
for /f "tokens=1" %%a in ("%commitMessage%") do set "branchName=feature/%%a-!time:~6,2!!time:~9,2!"
set "branchName=!branchName: =_!" 

set prBody="Automated feature merge from the CLI."

:: ----------------------------------------------------
:: 2. Branch erstellen und Code bearbeiten
:: ----------------------------------------------------
echo.
echo === Erstelle und wechsle zu Branch: !branchName! ===
:: Hier stellen wir sicher, dass wir auf dem Branch sind, BEVOR wir add/commit machen
git checkout -b !branchName!

echo.
echo === Commit und Push auf !branchName! ===
git add .
git commit -m "%commitMessage%"
git push --set-upstream origin !branchName!

:: ----------------------------------------------------
:: 3. Pull Request erstellen und mergen (mit gh CLI)
:: ----------------------------------------------------
echo.
echo === Erstelle und merge Pull Request ===

:: PR erstellen
gh pr create --base main --head !branchName! --title "%commitMessage%" --body %prBody% --draft=false

:: WICHTIG: Korrigierter Merge-Befehl
:: Wir lassen das fehlerhafte Branchnamen-Argument weg und nutzen -y und -m für non-interaktiven Merge.
gh pr merge --squash --delete-branch -m "Squashed commit: %commitMessage%" -y

:: ----------------------------------------------------
:: 4. Lokalen Branch aufräumen
:: ----------------------------------------------------
echo.
echo === Aktualisiere main-Branch und lösche lokalen Feature-Branch ===
git switch main
git pull origin main

:: Lösche den lokalen Feature-Branch
git branch -d !branchName!

echo.
echo === Workflow erfolgreich abgeschlossen. Code ist in main! ===