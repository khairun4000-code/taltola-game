#!/bin/bash
cd "$(dirname "$0")"
echo "========================================================"
echo "  Fetching your friend's latest updates on Mac..."
echo "========================================================"
git pull --rebase origin main
echo ""
echo "[OK] Your Mac game is now 100% up to date!"
read -p "Press Enter to close..."
