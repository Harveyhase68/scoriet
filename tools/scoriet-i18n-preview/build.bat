@echo off
echo ========================================
echo Building i18n Inline Preview (.vsix)
echo ========================================
echo.

cd /d "%~dp0"

echo Generating icon...
rem node generate-icon.js
echo.

echo Packaging extension...
call npx --yes @vscode/vsce package --allow-missing-repository
echo.

if exist *.vsix (
    echo ========================================
    echo Build successful!
    echo ========================================
    echo.
    for %%f in (*.vsix) do echo Output: %%f
    echo.
    echo To install: Open VS Code, Ctrl+Shift+P
    echo   "Extensions: Install from VSIX..."
    echo.
    echo To share: Upload the .vsix file
) else (
    echo ========================================
    echo Build failed! Check errors above.
    echo ========================================
)

echo.
pause
