---
name: test-writer
description: Generate Angular unit tests (Jasmine/Karma) for components, services, and pipes. Use when the user asks to add or improve tests, or when a file under src/app/ lacks a matching .spec.ts.
---

# Test Writer

Generate Jasmine unit tests for Angular code in this repo.

## Process

1. Read the target file (component / service / pipe / directive)
2. Identify public API: inputs, outputs, public methods, observables
3. For services: cover happy path, error path, edge cases. Mock `HttpClient` with `HttpTestingController`
4. For components: use `TestBed` with standalone imports, cover input/output and template bindings
5. For pipes: pure input → output assertions
6. Save as `<name>.spec.ts` next to the source file

## Conventions

- Use `describe`/`it`/`beforeEach` blocks
- Prefer `provideHttpClientTesting()` over manual `HttpClientTestingModule`
- One assertion focus per `it` — multiple expects ok if same concept
- No snapshot testing
- No `any` — use the project's typed models

## Output

After generating, run `npm test -- --watch=false` and report pass/fail.
