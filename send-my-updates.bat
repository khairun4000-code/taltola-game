@echo off
title Taltola Game - Send My Updates to Friend (Sync & Push)
cd /d "%~dp0"
echo ========================================================
echo   Saving and uploading your game updates to GitHub...
echo ========================================================
set /p MSG="Write a short note about what you updated (or press Enter): "
if "%MSG%"=="" set MSG=Game update %DATE% %TIME%

git add -A
git commit -m "%MSG%"
echo.
echo Syncing with friend's latest changes...
git pull --rebase origin main
echo.
echo Uploading to central GitHub repository...
git push -u origin main
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [!] Upload failed. Make sure your GitHub repository URL is connected.
) else (
    echo.
    echo [OK] Done! Your friend can now double-click get-friend-updates.bat to get your changes!
)
echo.
pause
