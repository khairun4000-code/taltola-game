@echo off
title Taltola Game - Friend's First-Time Download & Setup
echo ====================================================================
echo   TALTOLA 3D GAME - AUTOMATIC DOWNLOAD AND SETUP FOR FRIEND
echo ====================================================================
echo.
where git >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [!] Git is not installed. Please install Git from https://git-scm.com/
    pause
    exit /b 1
)
where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [!] Node.js is not installed. Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

if not exist "taltola-game" (
    echo Downloading Taltola Game from GitHub...
    git clone https://github.com/khairun4000-code/taltola-game.git
)
cd taltola-game
echo Installing game packages...
call npm install
echo.
echo [OK] Setup Complete! Starting the game now...
start "" "http://localhost:5100/"
call npm run dev -- --port 5100
pause
