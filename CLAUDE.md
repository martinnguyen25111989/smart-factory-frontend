# Smart Factory Frontend — PPE Alert System

Angular frontend for the PPE (Personal Protective Equipment) Alert System in a smart factory environment.

## Stack

- Angular (standalone components)
- TypeScript
- SCSS
- nginx for production serving (`nginx.conf`)

## Layout

- `src/app/core/` — singletons: `models/`, `services/`, `interceptors/`, `guards/`
- `src/app/pages/` — one folder per route: `alerts`, `dashboard`, `reports`, `sensors`, `workers`, `zones`
- `src/app/shared/` — reusable UI

## Conventions

- API base URL via environment / proxy — never hardcode
- Auth token attached by `src/app/core/interceptors/auth.interceptor.ts`
- Models in `src/app/core/models/models.ts` — extend before duplicating
- Use `async` pipe or `takeUntilDestroyed` for subscriptions

## Common tasks

- Dev server: `npm start`
- Production build: `npm run build`
- Lint: `npm run lint`
- Tests: `npm test`
