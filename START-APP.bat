@echo off
cd /d "%~dp0"
title SEO Booster
echo.
echo  Welcome to SEO Booster
echo  ---------------------
echo.
echo  Building...
call npm run build
if errorlevel 1 (
  echo.
  echo  Oops! Build failed. Run: npm install
  pause
  exit /b 1
)
echo  Done! Starting...
echo.
start "SEO Booster" node server.js
ping -n 4 127.0.0.1 >nul
start http://localhost:3001
echo  Your browser should open at http://localhost:3001
echo.
echo  To stop: close the "SEO Booster" window
echo.
pause
