@echo off
REM Captures the dev server homepage so its inline styles can be compared with production.
curl -s -o d:\Portfolio\dev-home.html http://localhost:5173/
echo CURL_EXIT=%errorlevel% > d:\Portfolio\dev-fetch.txt
echo DONE >> d:\Portfolio\dev-fetch.txt