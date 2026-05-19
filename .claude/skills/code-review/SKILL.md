---
name: code-review
description: Structured code review for Angular/TypeScript changes in this repo. Use when reviewing PRs, pending diffs, or freshly edited files under src/app/.
---

# Code Review

Use this skill to review Angular/TypeScript changes in `smart-factory-frontend`.

## Process

1. Identify scope: `git diff main...HEAD --name-only` or the user's list
2. Read each file end-to-end (not just the diff hunks)
3. Apply the checklist in `references/checklist.md`
4. Use helpers in `scripts/` for repetitive checks
5. Output a markdown report grouped by file: issue → severity → suggested fix

## Severity

- **Blocker** — bug, security issue, or breaks build
- **Major** — perf, a11y, contract mismatch
- **Minor** — style, naming, small refactor

## Output

Keep the report under 500 words. Skip files with no issues.
