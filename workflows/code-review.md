# Workflow: Code Review

## Objective

Ensure every change to `main` is reviewed for correctness, security, and adherence to project principles before merging.

## Branch Naming

```
feat/<short-description>     # New feature
fix/<short-description>      # Bug fix
chore/<short-description>    # Maintenance (deps, config, docs)
refactor/<short-description> # Code restructuring (no behavior change)
test/<short-description>     # Adding or fixing tests
```

Examples: `feat/weather-alerts`, `fix/sw-cache-stale`, `chore/update-deps`

## Commit Format

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <short description>

[optional body]
[optional footer]
```

Types: `feat`, `fix`, `chore`, `refactor`, `test`, `docs`, `perf`

Examples:
```
feat(reports): add video evidence support
fix(sw): bump cache version to clear stale tiles
chore(deps): update firebase to v10.14.1
```

## Submitter Checklist

Before opening a PR:

- [ ] `npm run lint` passes
- [ ] `npm run format:check` passes
- [ ] `npm run test:run` all pass
- [ ] `npm run build` succeeds
- [ ] PR description explains *what* changed and *why*
- [ ] Linked to the relevant issue (if any)
- [ ] Security-sensitive changes (auth, rules, CSP) flagged in PR description
- [ ] New env vars documented in `.env.example`
- [ ] New dependencies justified (check bundle size impact)

## Reviewer Checklist

- [ ] Does the code do what the PR says it does?
- [ ] Are there security implications? (new data rendered, new API calls, changed rules)
- [ ] Is input validated on both client AND in Firestore rules?
- [ ] Does user-rendered content go through DOMPurify sanitization?
- [ ] Are new external connections covered in CSP (`firebase.json`)?
- [ ] Are new env vars added to GitHub Secrets and `.env.example`?
- [ ] Do tests cover the new behavior?
- [ ] Does it follow principles in `principles/`?

## Merge Strategy

- **Squash and merge** for feature branches (clean history on `main`)
- **Merge commit** for long-running branches with meaningful commit history
- Never force-push to `main`
- Delete source branch after merge

## PR Size

Keep PRs focused. If a PR touches more than ~400 lines of logic, consider splitting it. Large PRs are harder to review and more likely to introduce subtle bugs.

## Review Turnaround

- Aim to review within 1 business day
- If blocked on a review, ping the reviewer after 24 hours
- For urgent fixes (production bug), use the `priority` label to flag

## Protected Branch

`main` is protected:
- Requires 1 approving review
- Requires CI to pass
- No direct pushes

To bypass for emergencies, a repo admin can force-push — document the reason in the commit message.
