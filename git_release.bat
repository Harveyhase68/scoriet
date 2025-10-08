@echo off
setlocal enabledelayedexpansion

:: ----------------------------------------------------
:: 1. Version erfassen
:: ----------------------------------------------------
set /p tagVersion=Bitte geben Sie die neue Versionsnummer (z.B. v1.0.0) ein: 
if "!tagVersion!"=="" (
    echo Version kann nicht leer sein!
    exit /b 1
)

set /p releaseTitle=Bitte geben Sie den Titel für das Release ein: 
if "!releaseTitle!"=="" (
    set "releaseTitle=%tagVersion% Release"
)

git switch main
git pull origin main

rem git tag -a v1.0.0 -m "Initial stable release of the Laravel/React app"

rem gh release create !tagVersion! --title "!releaseTitle!" --notes-start-tag "" --notes "Die erste stabile Version von Scoriet. Enthält Basisfunktionen für Laravel, React und Inertia.js." --latest

gh release create !tagVersion! --title "!releaseTitle!" --notes "The first stable version of Scoriet. Contains basic functionality for Laravel, React, and Inertia.js. The manual generator works, and the lint bugs have been fixed." --latest
