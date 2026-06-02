#!/usr/bin/env bash
# Run from project root: bash scripts/setup-github.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ ! -f package.json ]]; then
  echo "ERROR: No package.json in $ROOT"
  echo "Restore the full DxFlow source before running this script."
  exit 1
fi

if [[ -d .git ]]; then
  echo "Git already initialized."
else
  git init
  echo "Initialized git repository."
fi

git add .
if git diff --cached --quiet; then
  echo "Nothing to commit (working tree clean or empty)."
else
  git commit -m "Initial commit: DxFlow clinical reasoning app"
  echo "Created initial commit."
fi

git branch -M main 2>/dev/null || true

echo ""
echo "Next steps:"
echo "  1. Create an empty repo on GitHub (no README/.gitignore)"
echo "  2. Run:"
echo "     git remote add origin https://github.com/YOUR_USERNAME/dxflow.git"
echo "     git push -u origin main"
echo ""
echo "Or with GitHub CLI (after: brew install gh && gh auth login):"
echo "     gh repo create dxflow --private --source=. --remote=origin --push"
