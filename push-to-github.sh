#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────────────────────
# VaultLua — GitHub push helper
#
# Run this script from your local machine (NOT inside the sandbox) to create
# a GitHub repo and push the VaultLua project to it.
#
# Usage:
#   1. Install GitHub CLI:    https://cli.github.com/
#   2. Authenticate once:     gh auth login
#   3. Run this script:       ./push-to-github.sh [repo-name] [visibility]
#
# Arguments (optional):
#   repo-name   — defaults to "vaultlua"
#   visibility  — "public" (default) or "private"
# ──────────────────────────────────────────────────────────────────────────
set -euo pipefail

REPO_NAME="${1:-vaultlua}"
VISIBILITY="${2:-public}"
PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "▶ VaultLua → GitHub push"
echo "  Repo:      $REPO_NAME"
echo "  Visibility: $VISIBILITY"
echo "  Project:   $PROJECT_DIR"
echo ""

# 1. Verify gh CLI is installed and authenticated
if ! command -v gh >/dev/null 2>&1; then
  echo "✗ GitHub CLI (gh) is not installed."
  echo "  Install: https://cli.github.com/"
  exit 1
fi

if ! gh auth status >/dev/null 2>&1; then
  echo "✗ You're not authenticated with GitHub CLI."
  echo "  Run: gh auth login"
  exit 1
fi

echo "✓ GitHub CLI authenticated as: $(gh api user --jq .login)"

# 2. Verify this looks like the VaultLua project
if [ ! -f "$PROJECT_DIR/package.json" ] || ! grep -q "VaultLua\|vaultlua" "$PROJECT_DIR/package.json" 2>/dev/null; then
  if [ ! -f "$PROJECT_DIR/README.md" ] || ! grep -qi "vaultlua" "$PROJECT_DIR/README.md" 2>/dev/null; then
    echo "✗ This doesn't look like the VaultLua project directory."
    echo "  Run this script from the project root."
    exit 1
  fi
fi

# 3. Create the GitHub repo if it doesn't exist
USERNAME=$(gh api user --jq .login)
REPO_FULL="$USERNAME/$REPO_NAME"

if gh repo view "$REPO_FULL" >/dev/null 2>&1; then
  echo "✓ Repo already exists: https://github.com/$REPO_FULL"
else
  echo "▶ Creating repo: $REPO_FULL ($VISIBILITY)"
  gh repo create "$REPO_NAME" "--$VISIBILITY" --description "Protect, license and distribute your Roblox scripts. Production-grade SaaS platform." --source="$PROJECT_DIR" --remote=origin --push=no
  echo "✓ Created: https://github.com/$REPO_FULL"
fi

# 4. Configure git remote
cd "$PROJECT_DIR"
if ! git remote get-url origin >/dev/null 2>&1; then
  git remote add origin "https://github.com/$REPO_FULL.git"
fi
git remote set-url origin "https://github.com/$REPO_FULL.git"
echo "✓ Remote configured: $(git remote get-url origin)"

# 5. Verify clean state
if [ -n "$(git status --porcelain)" ]; then
  echo "▶ Staging uncommitted changes…"
  git add -A
  git commit -m "chore: pre-push cleanup" || true
fi

# 6. Push
echo "▶ Pushing to GitHub…"
git push -u origin main || git push -u origin master

echo ""
echo "✅ Done!"
echo ""
echo "  Your repo:  https://github.com/$REPO_FULL"
echo "  Clone URL:  https://github.com/$REPO_FULL.git"
echo ""
echo "Next steps:"
echo "  - Add a description and topics on the GitHub repo settings page"
echo "  - Enable GitHub Pages if you want to host the docs separately"
echo "  - Set up Dependabot for security updates"
echo "  - Add the GitHub Actions workflow for CI/CD (optional)"
