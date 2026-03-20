# Testing

## Test Stack

| Tool | Purpose | Configuration |
|------|---------|---------------|
| **Vitest** | Unit and integration test runner | `vite.config.js` → `test` section |
| **@testing-library/react** | React component testing utilities | `src/test/utils.jsx` |
| **@testing-library/jest-dom** | Custom DOM matchers | `src/setupTests.js` |
| **@testing-library/user-event** | User interaction simulation | Imported in tests |
| **jsdom** | Browser environment simulation | Vitest default |
| **@playwright/test** | End-to-end browser tests | `playwright.config.js` |

## Running Tests

```bash
# Unit tests (watch mode)
npm test

# Unit tests (run once, CI mode)
npm run test:run

# With coverage
npm run test:coverage

# E2E tests
npm run test:e2e

# E2E UI mode (interactive)
npm run test:e2e:ui

# E2E headed (see browser)
npm run test:e2e:headed
```

Coverage reports output to `coverage/lcov-report/index.html`.

## Test File Locations

- **Unit/component tests**: Next to source files with `.test.jsx` or `.test.js` suffix
  - Example: `src/components/Common/Button.jsx` → `src/components/Common/Button.test.jsx`
- **Hook tests**: `src/hooks/useHookName.test.js`
- **E2E tests**: `e2e/` directory with `*.spec.js` files
- **Test utilities**: `src/test/` (setup, fixtures, utils)

## Test Setup

### Global Setup (`src/setupTests.js`)

Runs before each test file:

```javascript
import '@testing-library/jest-dom'; // Custom matchers
import { cleanUpsertMocks, restoreMocks } from '../test/utils';

beforeEach(() => {
  cleanUpsertMocks();
});

afterEach(() => {
  restoreMocks();
});
```

### Test Utilities (`src/test/utils.jsx`)

Provides:

```javascript
// Simple render wrapper that includes common providers
export function simpleRender(component, { wrapper, ...options }) {
  return render(component, { wrapper: AppWrapper, ...options });
}

// Mock Firebase and other external services
export const mockFirebase = { ... };

// Test data generators
export const mockUser = { ... };
export const mockReport = { ... };

// Cleanup functions for mocks
export function cleanUpsertMocks() { ... }
export function restoreMocks() { ... }
```

**Wrapper**: `AppWrapper` provides context providers (Auth, Reports, Theme) when needed.

### Fixtures (`src/test/fixtures.js`)

Static test data:

```javascript
export const MOCK_USER = {
  uid: 'test-user-123',
  email: 'test@example.com',
  displayName: 'Test User',
  role: 'user',
  municipality: 'Daet',
};

export const MOCK_REPORT = {
  reportId: 'report-123',
  type: 'situation',
  disasterType: 'flood',
  severity: 'moderate',
  // ...
};
```

## Component Testing Patterns

### Basic Render Test

```jsx
import { describe, it, expect } from 'vitest';
import { simpleRender as render, screen } from '../../test/utils';
import Button from './Button';

describe('Button', () => {
  it('renders children correctly', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
  });
});
```

### Interaction Testing

Use `@testing-library/user-event` for realistic user interactions:

```javascript
import user from '@testing-library/user-event';

it('handles click', async () => {
  const handleClick = vi.fn();
  render(<Button onClick={handleClick}>Submit</Button>);

  await user.click(screen.getByRole('button'));

  expect(handleClick).toHaveBeenCalledTimes(1);
});
```

### Asynchronous Testing

```javascript
it('loads data on mount', async () => {
  render(<DataComponent />);

  await waitFor(() => {
    expect(screen.getByText('Loaded')).toBeInTheDocument();
  });
});
```

### Mocking External Services

```javascript
import { mockFirebase } from '../../test/utils';

vi.mock('../../utils/firebaseConfig', () => ({
  ...vi.importActual('../../utils/firebaseConfig'),
  db: mockFirebase.db,
}));

// Or mock at the module level
vi.mock('firebase/firestore', () => ({
  collection: vi.fn(() => 'mock-collection'),
  getDocs: vi.fn(() => Promise.resolve({ docs: [] })),
}));
```

## Hook Testing

Test custom hooks using a test component wrapper:

```javascript
import { renderHook, act } from '@testing-library/react';
import { useAuth } from '../hooks/useAuth';

describe('useAuth', () => {
  it('initializes loading state', () => {
    const { result } = renderHook(() => useAuth());
    expect(result.current.loading).toBe(true);
  });

  it('handles sign-in', async () => {
    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.signIn('test@example.com', 'password');
    });

    expect(result.current.user).not.toBeNull();
  });
});
```

## E2E Testing (Playwright)

### Test Structure (`e2e/*.spec.js`)

```javascript
import { test, expect } from '@playwright/test';

test.describe('Report submission', () => {
  test('citizen can submit a report', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /report/i }).click();
    // ... complete flow
    await expect(page.locator('[data-testid="success"]')).toBeVisible();
  });
});
```

### Configuration (`playwright.config.js`)

- **Browser**: Chromium (can be configured for Firefox/WebKit)
- **Base URL**: Set via `PLAYWRIGHT_TEST_BASE_URL` environment variable
- **Headless**: Default in CI, headed locally with `npm run test:e2e:headed`
- **Screenshot**: On failure, saves to `playwright-report/`

### Running E2E

```bash
# All browsers (CI)
npx playwright test

# Specific browser
npx playwright test --project=chromium

# With UI
npx playwright test --ui

# Debug
npx playwright test --debug

# Video on failure
npx playwright test --video=retain-on-failure
```

## Coverage

Coverage configured in `vite.config.js`:

```javascript
test: {
  coverage: {
    provider: 'v8',
    reporter: ['text', 'json', 'html'],
    exclude: [
      'node_modules/',
      'src/setupTests.js',
      'src/test/**',
      'e2e/**',
      'src/data/**',
      'src/utils/sentry.js',
      'src/utils/rateLimiter.js',
      'src/hooks/useAuth.js',
      'src/hooks/useReports.js',
    ],
  },
}
```

**Exclusions rationale**:
- `src/test/**` — Test code itself
- `e2e/**` — Separate E2E coverage tracking (not unit test coverage)
- `src/utils/sentry.js` — External service integration, thin wrapper
- `src/hooks/useAuth.js`, `useReports.js` — Complex async hooks, partial coverage acceptable

### Viewing Coverage

```bash
npm run test:coverage
# Open coverage/lcov-report/index.html in browser
```

## Testing Philosophy

### What to Test

1. **User-facing behavior**: What the user sees and does
2. **Business logic**: Calculations, validation, transformations
3. **Integration points**: Firebase calls, API calls (with mocks)
4. **Error handling**: Failure modes, edge cases
5. **Accessibility**: ARIA attributes, keyboard navigation (implicit via Testing Library)

### What NOT to Test

1. **Implementation details**: Private functions, internal state (test observable behavior instead)
2. **Third-party libraries**: React, Firebase SDK — assume they work
3. **Styling**: CSS classes, visual appearance (except conditional classes)
4. **Trivial code**: Simple getters/setters, equality checks

### Test Isolation

- Each test should be independent
- Use `beforeEach` to set up fresh state
- Clean up mocks with `vi.restoreAllMocks()` in `afterEach`
- Avoid global state modification

## Mocking Strategy

### Firebase

Mock Firebase modules at the import level:

```javascript
vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  doc: vi.fn(),
  getDoc: vi.fn(),
  onSnapshot: vi.fn(() => () => {}), // Returns unsubscribe function
}));
```

### Browser APIs

Mock geolocation, localStorage, etc.:

```javascript
Object.defineProperty(navigator, 'geolocation', {
  value: {
    getCurrentPosition: vi.fn((success) => success({ coords: { latitude: 14, longitude: 122 } })),
  },
});
```

### Timers

Use Vitest fake timers for debouncing, rate limiting:

```javascript
vi.useFakeTimers();
// ... trigger timeout
vi.advanceTimersByTime(1000);
vi.useRealTimers();
```

## CI/CD Integration

GitHub Actions workflow (in `.github/workflows/ci.yml`):

1. Install dependencies: `npm ci`
2. Run typecheck: `npm run typecheck`
3. Run lint: `npm run lint`
4. Run tests: `npm test` (with coverage)
5. Upload coverage to Codecov (if configured)

CI fails on:
- TypeScript errors
- Lint warnings (eslint configured with `maxWarnings: 0`)
- Test failures

## Known Test Gaps

1. **AuthContext**: Tests mock Firebase but not full user registration flow
2. **Map performance**: No tests for marker clustering behavior with 1000+ markers
3. **E2E flakiness**: Playwright tests intermittently fail on network timing — needs stabilization
4. **Offline mode**: Not tested — PWA offline behavior needs test coverage
5. **Security rules**: No tests for Firestore rules (consider `@firebase/rules-unit-testing`)

## Test Data Management

- **Fixtures**: Static mock data in `src/test/fixtures.js`
- **Factories**: Not used — consider adding `@faker-js/faker` for dynamic data
- **Seeding**: No database seeding — tests use isolated mocks

## Debugging Tests

```bash
# Run single test file
npm test -- Button.test.jsx

# Run with pattern
npm test -- --name="handles click"

# Debug mode (Vitest)
npm test -- --debug

# E2E with delay
npx playwright test --slowmo=1000

# E2E trace on failure
npx playwright test --trace=on-first-retry
```

## Performance Testing

Stress tests (`*.stress.test.js`) measure performance under load:

```javascript
import { test, expect } from 'vitest';

test('rate limiter handles 1000 requests', () => {
  const start = Date.now();
  for (let i = 0; i < 1000; i++) {
    checkRateLimit('test-action', 1000, 60000);
  }
  const duration = Date.now() - start;
  expect(duration).toBeLessThan(1000); // Should complete in <1 second
});
```

Run stress tests: `npm test -- --pattern="*.stress.test.js"`
