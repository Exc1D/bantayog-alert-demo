# Workflow: Testing

## Objective

Run the right tests at the right time — fast unit tests locally, full suite in CI, E2E against a real deployment.

## Before Every Commit (Pre-commit Checks)

```bash
npm run lint          # ESLint — zero warnings policy
npm run format:check  # Prettier — no formatting drift
npm run typecheck     # TypeScript — no type errors
npm run test:run      # Vitest unit tests — all pass
```

If any step fails, fix it before committing. CI enforces the same checks — failing locally is better than failing in CI.

## Unit and Integration Tests (Vitest)

```bash
npm run test          # Watch mode — runs affected tests on file save
npm run test:run      # Run all tests once (CI mode)
npm run test:coverage # Run all tests + generate coverage report in coverage/
```

Tests live in `src/test/` and alongside source files (`*.test.js`).

**Mocking strategy:**
- Firebase SDK: mock with `vi.mock('firebase/firestore')` etc.
- `navigator.geolocation`: mock in test setup
- OpenWeather API: mock `fetch` using `vi.fn()`

## E2E Tests (Playwright)

```bash
npm run test:e2e          # Headless Chromium
npm run test:e2e:headed   # With visible browser (debugging)
npm run test:e2e:ui       # Playwright interactive UI
```

E2E tests live in `e2e/`. Config: `playwright.config.js`.

E2E tests require a running app. Either:
- Run `npm run dev` in one terminal, E2E in another (dev target)
- Or point Playwright at a staging/preview URL

## Performance Tests

Lighthouse CI is used for performance auditing.

```bash
# Manual Lighthouse run (requires the app running)
npx lighthouse http://localhost:3000 --output json --output-path .tmp/lighthouse-report.json
```

Results in `.tmp/lighthouse-report.json` (gitignored — regenerate as needed). Target: ≥ 90 across all categories.

## Boundary Accuracy Check

```bash
npm run check:boundaries
```

Runs `scripts/evaluateMunicipalityBoundaries.mjs` — checks polygon overlap and consistency of the Camarines Norte boundary data. Does not require a running app. Output in `docs/boundary-accuracy-evaluation.md`.

## CI Pipeline Test Order

1. `npm run lint`
2. `npm run format:check`
3. `npm run test:run`
4. `npm run build`

All four must pass on `main`. PRs are blocked from merging until CI is green.

## Writing New Tests

1. Identify what you're testing: utility function, hook, or component behavior
2. Add test file in `src/test/` or alongside source with `.test.js`
3. Mock external dependencies (Firebase, fetch, geolocation)
4. Write test names as behavior descriptions: `it('rejects descriptions shorter than 10 characters')`
5. Run `npm run test` in watch mode while developing
6. Ensure `npm run test:run` passes before committing

See `principles/testing.md` for full testing principles.
