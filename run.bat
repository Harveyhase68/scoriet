cd C:\wamp\www\scoriet

start chrome.exe http://10.0.0.8:8000
schtasks /run /tn "CMD elevated"
%SystemRoot%\explorer.exe "C:\wamp\www\scoriet\"
start "" code "C:\wamp\www\scoriet\scoriet.code-workspace"

"C:\Program Files\PowerShell\7\pwsh.exe" -noexit .\run.ps1

pause