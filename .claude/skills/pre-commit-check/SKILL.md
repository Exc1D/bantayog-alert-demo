---
name: pre-commit-check
description: Use when someone asks to run pre-commit checks, validate code before committing, check if code is ready to commit, or gate commits. Trigger phrases: "pre-commit", "validate code", "check before commit", "ready to commit", "gate check".
allowed-tools: Bash
---

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

## When to Use

- Before committing any code to the repository
- As part of the CI/CD pipeline gate
- When verifying code is ready for pull request review

## When NOT to Use

- During active development (run individual steps instead)
- As a replacement for writing tests
- Without having run lint-and-format first

## Related

- `.claude/skills/lint-and-format/SKILL.md` — detailed lint/format skill
- `.claude/skills/test/SKILL.md` — detailed test skill
- `workflows/testing.md` — pre-commit checks are defined here
