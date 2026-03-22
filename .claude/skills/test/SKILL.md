---
name: test
description: Use when someone asks to run tests, execute the test suite, check code correctness, or run unit/integration/E2E tests. Trigger phrases: "run tests", "test", "execute tests", "npm run test", "run the test suite".
allowed-tools: Bash
---

# Skill: Test

## Purpose

Run unit, integration, and E2E tests to verify application correctness.

## Steps

### Unit and Integration Tests (Vitest)

1. **Run all tests once**
   ```bash
   npm run test:run
   ```

2. **Run with coverage report**
   ```bash
   npm run test:coverage
   ```
   Coverage output goes to `coverage/`.

3. **Watch mode (during development)**
   ```bash
   npm run test
   ```

### E2E Tests (Playwright)

4. **Run headless**
   ```bash
   npm run test:e2e
   ```

5. **Run with visible browser (debugging)**
   ```bash
   npm run test:e2e:headed
   ```

6. **Interactive UI mode**
   ```bash
   npm run test:e2e:ui
   ```

E2E tests require a running app. Start `npm run dev` first, or point Playwright at a deployed URL.

### Boundary Accuracy Check

7. **Check municipality boundary data**
   ```bash
   npm run check:boundaries
   ```
   Does not require a running app. Output in `docs/boundary-accuracy-evaluation.md`.

## Success Criteria

- `npm run test:run` — all tests pass, exit code 0
- `npm run test:coverage` — coverage meets project thresholds
- `npm run test:e2e` — all E2E scenarios pass

## Common Failures

| Symptom | Likely Cause | Fix |
|---|---|---|
| Firebase mock errors | Missing `vi.mock()` for Firebase modules | Add mock in test setup |
| Geolocation errors in tests | `navigator.geolocation` not mocked | Mock in test setup file |
| E2E timeout | App not running or slow start | Ensure `npm run dev` is running |
| Playwright browser missing | First run without install | Run `npx playwright install` |

## When to Use

- Someone asks to run the test suite
- Verifying code correctness before committing or deploying
- Running unit tests, integration tests, or E2E tests
- Checking boundary accuracy or geolocation logic

## When NOT to Use

- When only linting/formatting is needed (use lint-and-format skill)
- When type-checking is needed (use build skill which runs typecheck)
- During active TDD development — use watch mode (`npm run test`) separately

## Related

- `workflows/testing.md` — full testing strategy and conventions
- `principles/testing.md` — testing principles and patterns
- `.claude/skills/pre-commit-check/SKILL.md` — tests are part of pre-commit
