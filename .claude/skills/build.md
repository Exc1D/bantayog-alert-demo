# Skill: Build

## Purpose

Build the application for production (or other environments) and verify the output.

## Steps

1. **Run the build**
   ```bash
   npm run build
   ```
   This runs `vite build --mode production`.

2. **Verify output**
   - Confirm the `dist/` directory was created
   - Check for zero errors in build output
   - Look for unexpected warnings (especially around chunk sizes)

3. **Optional: Environment-specific builds**
   ```bash
   npm run build:dev       # development mode
   npm run build:staging   # staging mode
   ```

## Success Criteria

- Exit code 0
- `dist/` directory contains `index.html` and asset files
- No errors or unresolved import warnings in output

## Common Failures

| Symptom | Likely Cause | Fix |
|---|---|---|
| Missing env var errors | `.env` file missing or incomplete | Copy `.env.example`, fill in values |
| TypeScript errors | Type mismatches in source | Run `npm run typecheck` to see details, fix types |
| Import resolution errors | Wrong path or missing dependency | Check import paths, run `npm install` |

## Related

- `workflows/deployment.md` — build is the first step of deploy
- `.claude/skills/pre-commit-check.md` — build is not part of pre-commit, but CI runs it
