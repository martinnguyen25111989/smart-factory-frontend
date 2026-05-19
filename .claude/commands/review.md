---
description: Review pending changes on the current branch
---

Review the changes on this branch against `main`.

1. Run `git diff main...HEAD --stat` then read full diffs for changed files
2. For each file, flag: bugs, unsafe patterns, missing tests, perf or a11y issues
3. Output a short markdown report grouped by file
