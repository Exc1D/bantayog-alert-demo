# Skill: Document Error

## Purpose

Create or update an error document in `errors/` to capture recurring error patterns and their solutions.

## Steps

1. **Check if the error is already documented**
   Look in `errors/` for an existing file that matches the error pattern.

2. **Copy the template**
   ```bash
   cp errors/_template.md errors/<error-name>.md
   ```
   Use kebab-case for the filename (e.g., `firebase-permission-denied.md`, `csp-violations.md`).

3. **Fill in all sections**
   - **Error Message**: exact error string or pattern
   - **When It Occurs**: user action, state, or environment
   - **Root Cause**: specific technical explanation
   - **Solution**: step-by-step fix with commands/code
   - **Prevention**: what to check in the future
   - **Related Files**: paths to relevant source files
   - **References**: links to docs or issues

4. **Link from the relevant workflow**
   If the error relates to a workflow (e.g., deployment, testing), add a reference in the error table of `workflows/error-handling.md`.

## Success Criteria

- New file exists in `errors/` following the template structure
- All template sections are filled with specific, actionable content
- Error is cross-referenced in `workflows/error-handling.md` if it's a recurring pattern

## Guidelines

- Be specific in root cause — don't say "config was wrong", say which config key was missing and why
- Include the exact commands or code changes needed to fix it
- Prevention section should describe a check that avoids the error, not just "be careful"

## Related

- `errors/_template.md` — the template to copy
- `workflows/error-handling.md` — the error handling workflow
