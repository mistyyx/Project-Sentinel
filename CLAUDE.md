# Project Sentinel — Claude Guidelines

## TypeScript Rules

- All files must use TypeScript (`.ts` / `.tsx`). No plain JavaScript.
- Enable strict mode in `tsconfig.json` (`"strict": true`). No exceptions.
- All function parameters and return types must be explicitly annotated. No implicit `any`.
- Use `unknown` instead of `any`. If `any` is unavoidable, add a comment explaining why.
- Prefer `type` for unions/intersections and `interface` for object shapes that may be extended.
- Use `readonly` for properties that should not be mutated after construction.
- Avoid non-null assertions (`!`). Use explicit null checks or optional chaining instead.
- Enums must be `const enum` unless runtime iteration is required.
- Never use `// @ts-ignore` or `// @ts-nocheck`. Fix the underlying type error.

## Naming Conventions

- **Files:** `kebab-case` for all files (e.g., `alert-service.ts`, `user-model.ts`).
- **Classes / Interfaces / Types / Enums:** `PascalCase` (e.g., `AlertService`, `IncidentRecord`).
- **Functions / Methods / Variables:** `camelCase` (e.g., `fetchAlerts`, `isResolved`).
- **Constants:** `SCREAMING_SNAKE_CASE` for module-level constants (e.g., `MAX_RETRY_COUNT`).
- **Folders:** `kebab-case` (e.g., `/alert-handlers`, `/data-models`).
- **Boolean variables:** Prefix with `is`, `has`, `can`, or `should` (e.g., `isActive`, `hasError`).
- **Event handlers:** Prefix with `on` or `handle` (e.g., `onAlertTriggered`, `handleTimeout`).
- **Interfaces** must not be prefixed with `I` (use `UserService`, not `IUserService`).

## Code Quality Rules

- No unused imports, variables, or parameters. Remove them; do not comment them out.
- Functions must have a single responsibility. If a function exceeds ~40 lines, refactor it.
- No magic numbers or strings inline. Extract them as named constants.
- Async functions must handle errors explicitly. Do not swallow exceptions silently.
- No `console.log` in production code. Use the project logger.

## Resolution Protocol

> **This protocol is mandatory before applying any fix.**

Before applying a fix, the agent must check the `/docs/incident-history.log`. If this fix has failed before, use Thinking Mode to find an alternative.

1. Read `/docs/incident-history.log` in full before writing any fix.
2. Search the log for the symptom, error message, or affected module.
3. If a matching prior failure is found — do **not** repeat the same fix. Enter Thinking Mode and derive an alternative approach.
4. After a fix is successfully applied and verified, append an entry to `/docs/incident-history.log` in the format:

```
[YYYY-MM-DD] <Module/File> — <symptom> — <fix applied> — <outcome>
```

5. If a fix fails, also log the failure immediately so future attempts have a complete record.
