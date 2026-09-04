#!/bin/bash
# Double-click this file on a Mac to start StreamDesk Desk.
cd "$(dirname "$0")"
echo "Starting StreamDesk Desk…"
echo "Then open http://localhost:8790/ to arrange apps for your phone."
echo ""
if ! command -v node >/dev/null 2>&1; then
  echo "Node.js 22+ is required. Install from https://nodejs.org and try again."
  read -r -p "Press Enter to close…"
  exit 1
fi
export STREAMDESK_PORT="${STREAMDESK_PORT:-8790}"
node ./desk.mjs
read -r -p "Press Enter to close…"
