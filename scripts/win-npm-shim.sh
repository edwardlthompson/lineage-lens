#!/usr/bin/env bash
# Prefer Windows Node npm when Git Bash would otherwise hit a broken WSL npm.
set -euo pipefail
NODE_WIN="/mnt/c/Program Files/nodejs/node.exe"
NPM_CLI="/mnt/c/Program Files/nodejs/node_modules/npm/bin/npm-cli.js"
if [[ -x "$NODE_WIN" && -f "$NPM_CLI" ]]; then
  exec "$NODE_WIN" "$NPM_CLI" "$@"
fi
exec npm "$@"
