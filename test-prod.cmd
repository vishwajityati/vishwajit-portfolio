@echo off
REM Starts the production server, captures the rendered homepage, then stops it.
cd /d d:\Portfolio\portfolio
start /b "" cmd /c "npm start > d:\Portfolio\prod-server.log 2>&1"
timeout /t 12 /nobreak > nul
curl -s -o d:\Portfolio\prod-home.html -D d:\Portfolio\prod-headers.txt http://localhost:3000/
echo CURL_EXIT=%errorlevel% >> d:\Portfolio\prod-headers.txt
taskkill /f /im node.exe > nul 2>&1
echo DONE >> d:\Portfolio\prod-headers.txt