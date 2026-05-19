---
name: security-audit
description: Security audit for Angular frontend — XSS, auth handling, dependency risk, secret leakage, CSP/nginx config. Use when the user asks for a security review or before a release.
---

# Security Audit

Audit the smart-factory-frontend for client-side security issues.

## Scope

1. **XSS** — uses of `[innerHTML]`, `bypassSecurityTrust*`, `DomSanitizer`
2. **Auth** — token storage (avoid `localStorage` for sensitive tokens), interceptor coverage, refresh flow
3. **API surface** — hardcoded URLs, missing HTTPS, CORS expectations
4. **Routing** — unprotected routes, missing guards on sensitive pages
5. **Dependencies** — `npm audit` output, outdated critical packages
6. **Secrets** — scan for API keys, tokens, passwords in source and `nginx.conf`
7. **nginx config** — security headers (`Content-Security-Policy`, `X-Frame-Options`, `Strict-Transport-Security`), correct proxy rules

## Process

1. Grep the codebase for risky patterns
2. Read `nginx.conf` and the auth interceptor in full
3. Run `npm audit --production` and parse results
4. Produce a report: finding → risk → remediation, ranked High/Med/Low

## Output

Short markdown report. Lead with High-severity findings. Do not include fixes that aren't actionable.
