# Conventions

## Code Style

This project follows **Prettier** for automatic code formatting and **ESLint** for static analysis.

### Formatting Rules (`.prettierrc`)

```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100,
  "bracketSpacing": true,
  "jsxSingleQuote": false,
  "arrowParens": "always",
  "endOfLine": "lf"
}
```

**Key points**:
- Semicolons required
- Single quotes for strings (double quotes for JSX)
- 2-space indentation
- Line length: 100 characters max
- Trailing commas in ES5-compatible positions (object literals, arrays, etc.)
- Arrow functions always have parentheses around parameters: `(x) => x`
- Unix line endings (`lf`)

Run formatting:
```bash
npm run format          # Auto-format
npm run format:check    # Verify without modifying
```

### Linting Rules (`eslint.config.js`)

The project uses ESLint 9 with flat config:

- **Base config**: `@eslint/js` recommended rules
- **React**: `eslint-plugin-react` recommended + JSX runtime rules
- **React Hooks**: `eslint-plugin-react-hooks` recommended (enforces Rules of Hooks)
- **Prettier**: `eslint-config-prettier` disables conflicting rules

**Custom rules**:
```javascript
'react/prop-types': 'off',  // Using PropTypes is not required (React 18 with modern tooling)
'no-unused-vars': [
  'error',
  {
    argsIgnorePattern: '^_',           // Ignore unused args starting with _
    destructuredArrayIgnorePattern: '^_',
    caughtErrorsIgnorePattern: '^_',
  },
],
```

**Globals**: Test globals (`describe`, `it`, `expect`, `vi`, etc.) are readonly.

Run linting:
```bash
npm run lint          # Check for issues (fails on warnings)
npm run lint:fix      # Auto-fix where possible
```

## Component Patterns

### Functional Components

All components are **function components** using React hooks. No class components.

```jsx
// Good
export default function Button({ children, variant }) {
  return <button className={...}>{children}</button>;
}

// Also acceptable (named export)
export function Card({ title }) {
  return <div>{title}</div>;
}
```

### Props

- Destructure props in function signature
- Use default values for optional props
- Validate with runtime checks only when necessary (not using PropTypes)

```jsx
function Button({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  className = '',
  ...props
}) {
  // ...
}
```

### State Management

- **Local state**: `useState` for component-specific state
- **Shared state**: Context providers (`AuthContext`, `ReportsContext`, etc.)
- **Server state**: Custom hooks (`useAuth`, `useReports`) that fetch from Firestore
- **URL state**: React Router `useSearchParams` for persistent filters

**Avoid**: Prop drilling — use context for data needed by >2 component levels.

### Side Effects

- **Data fetching**: In `useEffect` with proper cleanup (unsubscribe, cancel tokens)
- **Event listeners**: Add/remove in `useEffect` cleanup
- **Timers**: `setTimeout`/`setInterval` cleared on unmount

```jsx
useEffect(() => {
  let cancelled = false;
  const unsubscribe = onSnapshot(query, (snapshot) => {
    if (!cancelled) setData(snapshot.docs);
  });
  return () => {
    cancelled = true;
    unsubscribe();
  };
}, []);
```

### Memoization

- **`useMemo`**: Derived data (filtered lists, computed values)
- **`useCallback`**: Event handlers passed to child components (avoid unnecessary re-renders)
- **`React.memo`**: Export default with memo for pure components if re-render is expensive

## Error Handling

### Try/Catch Pattern

Async operations use `try/catch` with Sentry reporting:

```javascript
try {
  const result = await someAsyncOperation();
  return result;
} catch (err) {
  captureException(err, { tags: { component: 'ComponentName', action: 'operation' } });
  throw err; // Re-throw for caller to handle
}
```

### Error Boundaries

- **Global**: `ErrorBoundary` wraps entire app in `App.jsx`
- **Feature-specific**: `MapErrorBoundary` for map rendering failures
- **Fallback UI**: `ErrorFallback` provides retry button and error summary

### Rate Limiting

Client-side rate limiting implemented in `src/utils/rateLimiter.js`:

- **Purpose**: Prevent spam (e.g., rapid report submission)
- **Implementation**: Token bucket algorithm with time-based refill
- **Usage**: Wrap actions with `checkRateLimit(limit, windowMs)`

```javascript
if (!checkRateLimit('submit_report', 5, 10 * 60 * 1000)) {
  toast.error('Too many attempts. Please wait.');
  return;
}
```

## Security Patterns

### Input Sanitization

- **HTML content**: Use `SanitizedHTML` component or `sanitizeHtml()` utility
- **User input**: Validate on client, enforce on server (Firestore rules)
- **File uploads**: Check file type, size, and compress before upload

### RBAC (Role-Based Access Control)

- **Client-side**: `hasPermission(role, permission)` from `src/utils/rbac.js`
- **Server-side**: Firestore rules enforce same logic
- **Guard components**: `AdminGuard` prevents unauthorized admin tab access

```jsx
import { hasPermission } from '../utils/rbac';
import AdminGuard from './Admin/AdminGuard';

// Hide UI elements
{hasPermission(user.role, PERMISSIONS.VIEW_ANALYTICS) && <AnalyticsDashboard />}

// Route protection
<Route path="/admin" element={<AdminGuard />}>
```

### Secrets Management

- **Never commit secrets**: Use environment variables (`.env.local` gitignored)
- **Public vs private**: Firebase API key is public (restricted by domain in Firebase console)
- **Sentry auth**: `SENTRY_AUTH_TOKEN` only in CI environment (GitHub Secrets)

## Testing Conventions

### Test File Naming

- Unit/component tests: `*.test.jsx` or `*.test.js` next to source
- Hook tests: `useHookName.test.js`
- Stress tests: `*.stress.test.js` for performance/load testing
- E2E tests: `e2e/*.spec.js`

### Test Utilities

- **Test renderer**: `src/test/utils.jsx` provides `simpleRender` wrapper around Testing Library
- **Fixtures**: `src/test/fixtures.js` contains mock data for reports, users, etc.
- **Mocking**: Use `vi` (Vitest) for function mocks, timers, and modules

### Test Structure

```javascript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { simpleRender as render, screen } from '../../test/utils';
import Component from './Component';

describe('Component', () => {
  describe('rendering', () => {
    it('renders children correctly', () => {
      render(<Component>Hello</Component>);
      expect(screen.getByText('Hello')).toBeInTheDocument();
    });
  });

  describe('interactions', () => {
    it('handles click', async () => {
      const handleClick = vi.fn();
      render(<Button onClick={handleClick}>Click</Button>);
      await user.click(screen.getByRole('button'));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });
});
```

### E2E Tests (Playwright)

- Located in `e2e/` directory
- Use `@playwright/test` framework
- Configured in `playwright.config.js`
- Run in headed mode for debugging: `npm run test:e2e:headed`

## Git Workflow

### Commit Messages

Follow **conventional commits** format:

```
type(scope): description

[optional body]

[optional footer]
```

**Types**: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `perf`, `ci`

**Examples**:
```
feat(map): add municipality boundary overlay
fix(auth): handle null user profile on sign-out
test(reports): add validation tests for photo upload
docs: update README with deployment steps
```

### Branch Strategy

- **main**: Production-ready, protected branch
- **Feature branches**: `feat/feature-name`, `fix/bug-description`
- **Pull requests**: Require review, CI passing (tests, lint, typecheck)

### Pull Requests

PRs should include:
- Clear description of changes
- Screenshots for UI changes
- Test instructions
- Linked issue (if applicable)

## Documentation

### Inline Comments

- **Use sparingly**: Code should be self-documenting
- **Why, not what**: Explain intent, not mechanics
- **Complex logic**: Comment non-obvious algorithms or workarounds

```javascript
// Bad: // Increment counter
counter++

// Good: // Debounce rapid geolocation updates to preserve battery
clearTimeout(timeoutId);
```

### JSDoc (Optional)

Not currently required, but recommended for public utility functions:

```javascript
/**
 * Checks if user has permission for action
 * @param {string} role - User role (user, admin_municipality, etc.)
 * @param {string} permission - Permission constant from PERMISSIONS
 * @returns {boolean}
 */
export function hasPermission(role, permission) { ... }
```

## Accessibility

- **ARIA labels**: Add to interactive elements lacking visible text
- **Keyboard navigation**: Ensure all interactive elements are focusable (`tabindex`)
- **Color contrast**: Meet WCAG AA standards (Tailwind colors are designed for this)
- **Alt text**: All meaningful images have `alt` attributes
- **Focus management**: Visible focus states (`focus:ring-*` in Tailwind)

## Performance Best Practices

### Firestore

- **Indexes**: Composite indexes for compound queries (defined in `firestore.indexes.json`)
- **Pagination**: Use limit/offset, not `getAll`
- **Listeners**: Unsubscribe in `useEffect` cleanup
- **Cache**: Leverage Firestore's offline cache (50MB configured)

### Images

- **Compression**: Use `browser-image-compression` before upload
- **Sizes**: Limit dimensions (max 1920px) and file size (max 1MB after compression)
- **Formats**: JPEG for photos, PNG for graphics with transparency

### Map Rendering

- **Marker clustering**: Enabled by default for >50 markers
- **GeoJSON**: Load municipality boundaries once, reuse
- **Tile caching**: browser-image-compression configured with 30-minute cache

## Internationalization (i18n)

Currently **not implemented**. All text is in English. If localization needed in future:

- Use `react-intl` or `i18next`
- Store translations in `src/locales/`
- Format messages with placeholders: `formatMessage({ id: 'welcome', name })`

## Deployment

### Environments

- **development**: Local dev server (`npm run dev`)
- **staging**: Firebase staging project (`npm run build:staging`)
- **production**: Firebase production project (`npm run build`)

### Environment Variables

See `.env.example` for full list. Required variables:

- `VITE_FIREBASE_*` — Firebase connection
- `VITE_OPENWEATHER_API_KEY` — Weather data

### Pre-Deployment Checklist

1. Run tests: `npm test`
2. Lint: `npm run lint`
3. Typecheck: `npm run typecheck`
4. Build: `npm run build`
5. Verify build output in `dist/`
6. Deploy: `firebase deploy --only hosting` (or via GitHub Actions)

### Firebase Deploy

```bash
# Login (one time)
firebase login

# Deploy staging
firebase use staging
firebase deploy --only hosting

# Deploy production
firebase use production
firebase deploy --only hosting
```

## CI/CD

GitHub Actions workflows (in `.github/workflows/`):

- **CI**: Runs on PRs and pushes — tests, lint, typecheck
- **Deploy**: Auto-deploy to staging on merge to main; manual approval for production

Workflows use `actions/checkout`, `actions/setup-node`, and `firebase` CLI.
