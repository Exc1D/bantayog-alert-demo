# Testing Principles

## Test Stack

| Tool | Purpose | Config |
|---|---|---|
| Vitest | Unit and integration test runner | `vite.config.js` (vitest config section) |
| React Testing Library | Component rendering and interaction | `src/setupTests.js` |
| `@testing-library/user-event` | Realistic user interaction simulation | — |
| `@testing-library/jest-dom` | Custom DOM matchers | `src/setupTests.js` |
| Playwright | End-to-end browser tests | `playwright.config.js` |
| `@vitest/coverage-v8` | V8-native coverage reporting | — |
| jsdom | DOM environment for unit tests | Configured in `vite.config.js` |

## Running Tests

```bash
npm run test           # Watch mode (development)
npm run test:run       # Run once (CI)
npm run test:coverage  # Run with V8 coverage report → coverage/
npm run test:e2e       # Playwright E2E tests
npm run test:e2e:ui    # Playwright UI mode (interactive)
npm run test:e2e:headed # Playwright with visible browser
```

## Test Location

- Unit/integration tests: `src/test/` or co-located `*.test.js` alongside source files
- E2E tests: `e2e/` directory
- Test fixtures/utilities: `src/test/` (setup files, mock factories)

## What to Test

**Always test:**
- Utility functions in `src/utils/` — pure functions, easy to test exhaustively
- Custom hooks with complex logic (`useRateLimit`, `useGeolocation`, `useReports`)
- Security-critical paths — sanitization, input validation, rate limiting
- Geofencing logic (`geoFencing.js`) — with known coordinate fixtures for each municipality

**Test with mocks:**
- Firebase SDK calls — mock Firestore, Auth in tests (don't hit real Firebase)
- OpenWeather API — mock fetch responses
- Geolocation API — mock `navigator.geolocation`

**Prefer integration tests over unit tests for components** — test behavior from the user's perspective, not implementation details.

## Writing New Tests

1. Put the test file in `src/test/` or alongside the source file with `.test.js` extension
2. Import from `@testing-library/react` and `@testing-library/user-event`
3. Use `vi.mock()` for Firebase and external dependencies
4. Arrange → Act → Assert structure
5. Test names describe the user-facing behavior: `it('shows error when description is too short')`

## CI Integration

The CI pipeline (`.github/workflows/ci.yml`) runs:
1. `npm run lint` — zero warnings
2. `npm run format:check` — no formatting drift
3. `npm run test:run` — all unit tests pass
4. `npm run build` — production build succeeds

E2E tests run separately (`.github/workflows/deploy.yml` or a dedicated E2E workflow) against a preview deployment.

## Coverage

Coverage reports are generated to `coverage/` with V8. The `coverage/` directory is gitignored. Coverage thresholds are not yet enforced in CI — aim for meaningful coverage on utilities and hooks rather than chasing a percentage number.
