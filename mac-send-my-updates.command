#!/bin/bash
cd "$(dirname "$0")"
echo "========================================================"
echo "  Uploading your Mac updates to the central GitHub game"
echo "========================================================"
read -p "Write a short note about what you updated (or press Enter): " MSG
if [ -z "$MSG" ]; then
  MSG="Mac game update $(date '+%Y-%m-%d %H:%M')"
fi

git add -A
git commit -m "$MSG"
git pull --rebase origin main
git push -u origin main
echo ""
echo "[OK] Done! Your friend on Windows can now click get-friend-updates.bat to get your changes!"
read -p "Press Enter to close..."
