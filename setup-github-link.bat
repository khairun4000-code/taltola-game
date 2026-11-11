@echo off
title Taltola Game - Connect to GitHub (One-Time Setup)
cd /d "%~dp0"
echo ====================================================================
echo   TALTOLA GAME - ONE-TIME GITHUB CONNECTION SETUP
echo ====================================================================
echo 1. Go to https://github.com/new and create a repository (e.g. taltola-game)
echo 2. Copy the repository link (e.g. https://github.com/yourname/taltola-game.git)
echo.
set /p REPO_URL="Paste your GitHub repository URL here: "
if "%REPO_URL%"=="" (
    echo [!] No URL entered. Exiting.
    pause
    exit /b 1
)

git remote remove origin 2>nul
git remote add origin %REPO_URL%
git branch -M main
echo.
echo Uploading your project to GitHub for the first time...
git push -u origin main
echo.
echo [OK] Connected! From now on:
echo  - Double-click send-my-updates.bat after you make changes
echo  - Double-click get-friend-updates.bat to get your friend's changes
echo.
pause
