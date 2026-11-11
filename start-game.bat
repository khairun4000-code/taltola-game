@echo off
title Taltola Game - Start Dev Server
cd /d "%~dp0"
if not exist "node_modules" (
    echo Installing required packages for the first time...
    call npm install
)
echo Starting Taltola Game at http://localhost:5100/ ...
start "" "http://localhost:5100/"
call npm run dev -- --port 5100
pause
