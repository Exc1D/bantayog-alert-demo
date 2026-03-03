# Skill: Lint and Format

## Purpose

Check and fix code style and formatting issues using ESLint and Prettier.

## Steps

### Check (read-only)

1. **Lint check**
   ```bash
   npm run lint
   ```
   ESLint with zero-warnings policy (`--max-warnings 0`).

2. **Format check**
   ```bash
   npm run format:check
   ```
   Prettier check on `src/**/*.{js,jsx,css,json}`.

### Fix (auto-correct)

3. **Auto-fix lint issues**
   ```bash
   npm run lint:fix
   ```

4. **Auto-fix formatting**
   ```bash
   npm run format
   ```

## Execution Order

Always lint before formatting — ESLint fixes may change code that Prettier then reformats.

```bash
npm run lint:fix && npm run format
```

## Success Criteria

- `npm run lint` exits with 0 warnings and 0 errors
- `npm run format:check` reports no changes needed

## Common Failures

| Symptom | Likely Cause | Fix |
|---|---|---|
| `X warnings found` | Unused imports, missing deps in hooks | Fix manually or run `npm run lint:fix` |
| Prettier diff shown | Formatting drift | Run `npm run format` |
| Conflicting rules | ESLint and Prettier disagree | Check `eslint-config-prettier` is in ESLint config |

## Related

- `principles/` — coding standards that inform lint rules
- `.claude/skills/pre-commit-check.md` — lint and format are the first pre-commit steps
