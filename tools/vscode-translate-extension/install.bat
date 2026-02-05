@echo off
echo Installing Scoriet Translate Extension...

set TARGET=%USERPROFILE%\.vscode\extensions\scoriet-translate

if exist "%TARGET%" (
    echo Removing old version...
    rmdir /s /q "%TARGET%"
)

echo Copying files...
mkdir "%TARGET%"
copy /y "package.json" "%TARGET%\"
copy /y "extension.js" "%TARGET%\"
copy /y "README.md" "%TARGET%\"

echo.
echo ========================================
echo Installation complete!
echo ========================================
echo.
echo Please restart VS Code.
echo.
echo Usage: Select text and press CTRL+M
echo.
echo Configure API URL in VS Code Settings:
echo   scorietTranslate.apiUrl
echo.
pause
