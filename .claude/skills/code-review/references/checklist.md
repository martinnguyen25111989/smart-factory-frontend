# Review Checklist

## Angular
- Subscriptions cleaned up (`async` pipe or `takeUntilDestroyed`)
- `trackBy` on `*ngFor` over lists > 10 items
- No function calls in template bindings
- `OnPush` change detection where feasible

## TypeScript
- No `any` when a concrete model exists in `core/models`
- Narrow types at boundaries; trust internal code
- Avoid non-null assertions (`!`) without justification

## API / Models
- No hardcoded URLs — use environment / proxy
- Service shapes match `core/models` interfaces
- Errors handled at the call site, not swallowed

## Accessibility
- Interactive elements have `aria-label` or visible text
- Forms have associated `<label>`s
- Color is not the only signal

## Security
- No user input rendered as HTML without sanitization
- Auth token attached only by interceptor, never inline
- No secrets committed in code or templates
