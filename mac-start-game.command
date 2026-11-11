#!/bin/bash
cd "$(dirname "$0")"
echo "========================================================"
echo "  Starting Taltola 3D Game on Mac..."
echo "========================================================"
if [ ! -d "node_modules" ]; then
  echo "Installing game packages for the first time..."
  npm install
fi
(sleep 2 && open "http://localhost:5100/") &
npm run dev -- --port 5100
