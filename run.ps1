# Neues PowerShell-Fenster für npm
# Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; npm run dev"

# composer run dev

# Start-Process "chrome.exe" "http://10.0.0.8:8000"

# Start-ScheduledTask -TaskName "CMD elevated"

# Start-ScheduledTask -TaskName "Start Claude"

#npx concurrently -c "#93c5fd,#c4b5fd,#fdba74" "php artisan serve --host=10.0.0.8 --port=8000" "php artisan queue:listen --tries=1" "npm run dev" --names='server,queue,vite'

npx concurrently -c "#93c5fd,#fdba74" "php artisan serve --host=10.0.0.8 --port=8000" "npm run dev" --names='server,vite'