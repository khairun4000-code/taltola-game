@echo off
title Taltola Game - Get Friend's Updates (Pull)
cd /d "%~dp0"
echo ========================================================
echo   Fetching and merging your friend's latest updates...
echo ========================================================
git pull --rebase origin main
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [!] Could not pull automatically. If you have unsaved changes,
    echo     run send-my-updates.bat first or check your GitHub link.
) else (
    echo.
    echo [OK] Your game is now 100%% up to date with your friend's work!
)
echo.
pause
