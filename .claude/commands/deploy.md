---
description: Build and prepare a production deploy of the frontend
---

Build the Angular app for production and prep the nginx-served bundle.

1. Run `npm run build`
2. Verify the output exists in `dist/`
3. Validate `nginx.conf` references the correct dist path
4. Print the artifact paths and bundle sizes
5. Do NOT push or run a remote deploy — ask the user first
