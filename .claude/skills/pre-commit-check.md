# Skill: Pre-Commit Check

## Purpose

Run the full pre-commit validation sequence to ensure code is ready to commit.

## Steps

Run these in order. Stop on first failure.

1. **Lint**
   ```bash
   npm run lint
   ```

2. **Format check**
   ```bash
   npm run format:check
   ```

3. **Type check**
   ```bash
   npm run typecheck
   ```

4. **Unit tests**
   ```bash
   npm run test:run
   ```

### One-liner

```bash
npm run lint && npm run format:check && npm run typecheck && npm run test:run
```

## On Failure

- **Lint fails**: Run `npm run lint:fix`, review changes, re-run
- **Format fails**: Run `npm run format`, re-run check
- **Typecheck fails**: Fix type errors in the reported files
- **Tests fail**: Fix failing tests, ensure mocks are correct

After fixing, re-run the full sequence from step 1.

## Success Criteria

- All four commands exit with code 0
- Code is safe to commit and will pass CI

## Related

- `.claude/skills/lint-and-format.md` — detailed lint/format skill
- `.claude/skills/test.md` — detailed test skill
- `workflows/testing.md` — pre-commit checks are defined here
