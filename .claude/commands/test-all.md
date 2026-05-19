---
description: Run all checks — lint, unit tests, build
---

Run the full local validation pipeline.

1. `npm run lint`
2. `npm test -- --watch=false --browsers=ChromeHeadless`
3. `npm run build`

Report a single pass/fail summary at the end. On any failure, stop and surface the first error.
