#!/usr/bin/env bash
#
# Double-click this in Finder to pull the latest main.
#
# `.command` is the macOS extension Finder opens in Terminal. The real work is
# in scripts/sync.sh — this only locates the repo (Finder starts the shell in
# the user's home directory, not next to the file) and holds the window open so
# the output is still readable after it finishes.
cd "$(dirname "$0")" || exit 1
./scripts/sync.sh
printf '\nPress any key to close this window.\n'
read -n 1 -s
