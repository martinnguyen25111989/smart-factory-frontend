#!/usr/bin/env bash
# List files changed on the current branch vs main.
set -euo pipefail
git diff main...HEAD --name-only
