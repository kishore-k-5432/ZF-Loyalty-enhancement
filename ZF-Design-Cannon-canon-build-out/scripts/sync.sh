#!/usr/bin/env bash
#
# Pull the latest main without losing local work.
#
# Written to be run by someone who is NOT going to read it, so every step says
# what it did, and anything unexpected stops the script rather than guessing.
# The three commands that actually destroy work — reset --hard, checkout -f,
# clean -fd — appear nowhere in here, deliberately.
#
#   ./scripts/sync.sh          pull and reinstall if needed
#   ./scripts/sync.sh --check  say what WOULD happen, touch nothing
#
set -uo pipefail

DRY=0; [ "${1:-}" = "--check" ] && DRY=1
say()  { printf '\n\033[1m%s\033[0m\n' "$1"; }
ok()   { printf '  \033[32m✓\033[0m %s\n' "$1"; }
warn() { printf '  \033[33m!\033[0m %s\n' "$1"; }
die()  { printf '\n  \033[31m✗ %s\033[0m\n\n' "$1"; exit 1; }

cd "$(dirname "$0")/.." || die "cannot find the repo root"

# ── 1. sanity ──────────────────────────────────────────────────────────────
say "1. Checking the repo"
git rev-parse --git-dir >/dev/null 2>&1 || die "This folder is not a git repository."
REMOTE=$(git remote get-url origin 2>/dev/null) || die "No 'origin' remote is configured."
case "$REMOTE" in
  *ZF-Design-Cannon*) ok "origin → $REMOTE" ;;
  *) die "origin is $REMOTE — that is not the Loyalty Enhancement repo. Stopping." ;;
esac

BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "$BRANCH" != "main" ]; then
  warn "You are on branch '$BRANCH', not main."
  warn "This script only syncs main. Switch with:  git switch main"
  die "Stopping so your branch is left alone."
fi
ok "on main"

# ── 2. local work ──────────────────────────────────────────────────────────
say "2. Looking for uncommitted work"
DIRTY=$(git status --porcelain --untracked-files=no)
STASHED=0
if [ -n "$DIRTY" ]; then
  echo "$DIRTY" | sed 's/^/     /'
  warn "$(echo "$DIRTY" | wc -l | tr -d ' ') file(s) with uncommitted changes — these will be parked and restored."
  if [ "$DRY" = "0" ]; then
    git stash push -m "sync.sh $(date '+%Y-%m-%d %H:%M')" >/dev/null || die "Could not stash. Nothing has changed; fix the above and re-run."
    STASHED=1
    ok "parked in a stash"
  fi
else
  ok "nothing uncommitted — clean pull"
fi

# ── 3. pull ────────────────────────────────────────────────────────────────
say "3. Fetching main"
LOCK_BEFORE=$(git rev-parse HEAD:package-lock.json 2>/dev/null || echo none)
if [ "$DRY" = "1" ]; then
  git fetch origin main --quiet || die "Could not reach GitHub. Check your connection and that you have access to the repo."
  BEHIND=$(git rev-list --count HEAD..origin/main)
  AHEAD=$(git rev-list --count origin/main..HEAD)
  ok "$BEHIND new commit(s) to pull; $AHEAD local commit(s) not on GitHub"
  [ "$AHEAD" -gt 0 ] && warn "Local commits present — the real run would stop rather than merge. Push or ask first."
  say "--check only. Nothing was changed."
  exit 0
fi

#  --ff-only: if their main has diverged (they committed locally), stop with a
#  clear message instead of silently creating a merge commit they did not ask
#  for and cannot explain later.
if ! git pull --ff-only origin main; then
  [ "$STASHED" = "1" ] && { git stash pop >/dev/null 2>&1 && warn "Your changes were restored."; }
  die "Could not fast-forward. You have local commits on main that are not on GitHub.
     Nothing was lost. Send someone the output of:  git log --oneline origin/main..HEAD"
fi
ok "up to date with origin/main"

# ── 4. restore ─────────────────────────────────────────────────────────────
if [ "$STASHED" = "1" ]; then
  say "4. Restoring your work"
  if git stash pop; then
    ok "restored"
  else
    warn "Your changes and the update touched the same lines."
    warn "Both versions are in the files now, marked with <<<<<<< and >>>>>>>."
    warn "Nothing is lost — your work is also still saved: see  git stash list"
    warn "Open the conflicted files, keep the lines you want, delete the markers."
    exit 1
  fi
fi

# ── 5. dependencies ────────────────────────────────────────────────────────
say "5. Dependencies"
LOCK_AFTER=$(git rev-parse HEAD:package-lock.json 2>/dev/null || echo none)
if [ "$LOCK_BEFORE" != "$LOCK_AFTER" ]; then
  warn "package-lock.json changed — installing"
  npm ci || die "npm ci failed. Try deleting node_modules and running it again."
  ok "installed"
else
  ok "unchanged — no install needed"
fi

# ── 6. done ────────────────────────────────────────────────────────────────
say "Done — you are on the latest main"
printf '  Start the app:   \033[1mnpm run dev\033[0m    → http://localhost:5173\n'
printf '  Browse the canon: \033[1mnpm run canon\033[0m  → http://localhost:6006\n\n'
