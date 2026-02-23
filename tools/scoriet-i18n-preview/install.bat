@echo off
echo Installing i18n Inline Preview Extension...

set TARGET=%USERPROFILE%\.vscode\extensions\i18n-inline-preview

if exist "%TARGET%" (
    echo Removing old version...
    rmdir /s /q "%TARGET%"
)

echo Copying files...
mkdir "%TARGET%"
copy /y "package.json" "%TARGET%\"
copy /y "extension.js" "%TARGET%\"
copy /y "README.md" "%TARGET%\"
copy /y "icon.png" "%TARGET%\"

echo.
echo ========================================
echo Installation complete!
echo ========================================
echo.
echo Please restart VS Code.
echo.
echo Usage:
echo   Inline translation previews appear automatically
echo   in files containing t.key or __('key') patterns.
echo.
echo   Press CTRL+SHIFT+L to cycle language, then OFF
echo.
echo Settings (VS Code Settings JSON):
echo   i18nInlinePreview.languages       - configure languages
echo   i18nInlinePreview.localeFiles      - configure locale file paths
echo   i18nInlinePreview.dotPatterns      - configure property patterns
echo   i18nInlinePreview.functionPatterns - configure function patterns
echo.
pause
