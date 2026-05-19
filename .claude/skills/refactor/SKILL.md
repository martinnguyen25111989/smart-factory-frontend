---
name: refactor
description: Safe refactors for Angular/TypeScript — extract component, extract service, rename symbol, tighten types, remove dead code. Use when the user asks to refactor without changing behavior.
---

# Refactor

Apply behavior-preserving refactors to this Angular project.

## Supported refactors

- **Extract component** — pull a template fragment into a child standalone component
- **Extract service** — move side-effectful logic out of a component into an injectable
- **Rename symbol** — update declaration + all references; verify no string-based usages broken
- **Tighten types** — replace `any` with a model from `core/models` or introduce a new one
- **Dead code removal** — remove unused exports, imports, and files

## Process

1. State the refactor and the blast radius (files touched)
2. If > 5 files, get user confirmation before editing
3. Make the smallest change that achieves the goal — no opportunistic cleanup
4. After editing, run `npm run lint` and `npm run build` to verify nothing broke
5. Do not change public API of a service/component unless the user asked

## Anti-patterns

- Don't introduce abstractions for a single caller
- Don't rewrite working code "for clarity" — leave it alone
- Don't bundle unrelated cleanups into the refactor
