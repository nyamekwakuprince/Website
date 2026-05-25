@echo off
echo ===========================================
echo Starting Lara LuxeStudio Local Server
echo ===========================================

echo Installing/checking dependencies...
python -m pip install -r requirements.txt >nul 2>&1

echo Starting Flask Server...
start "Lara LuxeStudio" python server.py

echo Waiting for server to start...
timeout /t 3 /nobreak >nul

echo Opening browser...
start http://localhost:7700

echo Server is running! Close the new command window to stop.
pause
