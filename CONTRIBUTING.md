# Contributing to Bantayog Alert

Thank you for your interest in contributing to Bantayog Alert! This guide will help you get started.

Please read and follow our [Code of Conduct](CODE_OF_CONDUCT.md) in all interactions.

## How to Contribute

### Reporting Bugs

1. Check existing [issues](https://github.com/your-org/bantayog-alert/issues) to avoid duplicates
2. Use the **Bug Report** issue template
3. Include steps to reproduce, expected behavior, and screenshots if applicable
4. Specify your browser, OS, and Node.js version

### Suggesting Features

1. Use the **Feature Request** issue template
2. Describe the problem your feature solves
3. Provide mockups or examples if possible

### Submitting Code

1. Fork the repository
2. Create a feature branch from `main`
3. Make your changes
4. Write or update tests
5. Ensure all checks pass
6. Submit a pull request

## Development Workflow

```bash
# 1. Fork and clone
git clone https://github.com/YOUR_USERNAME/bantayog-alert.git
cd bantayog-alert

# 2. Install dependencies
npm ci

# 3. Set up environment
cp .env.example .env.local

# 4. Create a feature branch
git checkout -b feat/your-feature-name

# 5. Start development server
npm run dev

# 6. Run checks before committing
npm run lint
npm run format:check
npm run test:run

# 7. Commit and push
git add .
git commit -m "feat: add your feature description"
git push origin feat/your-feature-name
```

## Branch Naming Conventions

Use the following prefixes:

| Prefix      | Purpose                               |
| ----------- | ------------------------------------- |
| `feat/`     | New features                          |
| `fix/`      | Bug fixes                             |
| `docs/`     | Documentation changes                 |
| `refactor/` | Code refactoring (no behavior change) |
| `test/`     | Adding or updating tests              |
| `chore/`    | Build, CI, dependency updates         |
| `hotfix/`   | Urgent production fixes               |

Examples:

- `feat/weather-alerts-panel`
- `fix/map-marker-clustering`
- `docs/api-documentation`

## Commit Message Format

This project follows the [Conventional Commits](https://www.conventionalcommits.org/) specification.

```
<type>(<optional scope>): <description>

[optional body]

[optional footer(s)]
```

### Types

| Type       | Description                                             |
| ---------- | ------------------------------------------------------- |
| `feat`     | A new feature                                           |
| `fix`      | A bug fix                                               |
| `docs`     | Documentation only changes                              |
| `style`    | Formatting, missing semicolons, etc. (no code change)   |
| `refactor` | Code change that neither fixes a bug nor adds a feature |
| `perf`     | Performance improvement                                 |
| `test`     | Adding or correcting tests                              |
| `build`    | Build system or external dependency changes             |
| `ci`       | CI configuration changes                                |
| `chore`    | Other changes that don't modify src or test files       |
| `revert`   | Reverts a previous commit                               |

### Examples

```
feat(map): add municipality boundary overlays
fix(reports): prevent duplicate submissions on double-click
docs: update deployment instructions in README
refactor(hooks): extract geolocation logic into useGeolocation
test(sanitization): add XSS prevention test cases
ci: add Node.js 20 to CI matrix
```

## Pull Request Process

1. Fill out the pull request template completely
2. Link related issues using `Closes #123` or `Fixes #123`
3. Ensure the CI pipeline passes (lint, format, test, build)
4. Request review from at least one maintainer
5. Address all review feedback
6. Squash commits if requested before merge

### PR Checklist

- [ ] Branch is up to date with `main`
- [ ] Code follows the project's style guidelines
- [ ] Tests added/updated for changes
- [ ] `npm run lint` passes with zero warnings
- [ ] `npm run format:check` passes
- [ ] `npm run test:run` passes
- [ ] No secrets or credentials committed
- [ ] PR description explains the "why" behind changes

## Code Style Guidelines

### ESLint

The project uses ESLint 9 with flat config (`eslint.config.js`):

- React and React Hooks recommended rules
- Zero-warning policy enforced in CI
- Prettier integration via `eslint-config-prettier`

```bash
npm run lint        # Check for issues
npm run lint:fix    # Auto-fix issues
```

### Prettier

Formatting is enforced with Prettier (`.prettierrc`):

- Single quotes
- Semicolons
- 2-space indentation
- Trailing commas (ES5)
- 100 character print width
- LF line endings

```bash
npm run format        # Format all files
npm run format:check  # Check formatting
```

### General Guidelines

- Use functional components and hooks (no class components)
- Colocate test files next to source files (`Component.test.jsx`)
- Use lazy loading (`React.lazy`) for route-level components
- Prefer custom hooks for reusable logic
- Use Context API for global state (Auth, Reports)
- Sanitize all user input with DOMPurify
- Never commit `.env` files or secrets

## Testing Requirements

- All new features must include tests
- Bug fixes should include a regression test
- Tests use **Vitest** + **React Testing Library**
- Run the full suite before submitting a PR:

```bash
npm run test:run          # Run all tests
npm run test:coverage     # Generate coverage report
```

### Test File Location

Place test files adjacent to the source file:

```
src/
  components/
    Common/
      Button.jsx
      Button.test.jsx
  utils/
    sanitization.js
    sanitization.test.js
  hooks/
    useGeolocation.js
    useGeolocation.test.js
```

## Questions?

Open a [discussion](https://github.com/your-org/bantayog-alert/discussions) or reach out to the maintainers.
