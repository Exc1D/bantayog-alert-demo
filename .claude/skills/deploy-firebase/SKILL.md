---
name: deploy-firebase
description: Use when someone asks to deploy to Firebase, push to Firebase Hosting, or publish the app. Trigger phrases: "deploy", "firebase deploy", "publish", "push to production", "deploy to hosting", "ship the app".
allowed-tools: Bash
---

# Skill: Deploy to Firebase

## Purpose

Deploy the application to Firebase Hosting, with optional rules and indexes deployment.

## Steps

### Standard Deploy (Hosting Only)

1. **Build the app**
   ```bash
   npm run build
   ```

2. **Deploy hosting**
   ```bash
   npx firebase deploy --only hosting
   ```

### Full Deploy (Hosting + Rules + Indexes)

3. **Deploy everything**
   ```bash
   npx firebase deploy
   ```

### Rules-Only Deploy

4. **Deploy Firestore and Storage rules**
   ```bash
   npx firebase deploy --only firestore:rules,storage:rules,firestore:indexes
   ```
   Do this whenever `firestore.rules` or `storage.rules` changes.

## Rollback

5. **List recent releases**
   ```bash
   npx firebase hosting:releases:list
   ```

6. **Rollback to a previous version**
   ```bash
   npx firebase hosting:clone <SOURCE_SITE_ID>:<SOURCE_VERSION> <TARGET_SITE_ID>
   ```

   Or use Firebase Console: Hosting -> Release History -> Rollback.

## Pre-Deployment Checklist

- [ ] All CI checks pass
- [ ] `firestore.rules` and `storage.rules` tested against emulator
- [ ] New `VITE_*` env vars added to GitHub Secrets
- [ ] CSP in `firebase.json` covers any new external connects
- [ ] `npm run build` completes without errors locally
- [ ] Lighthouse score >= 90 performance

## Success Criteria

- Deploy command exits with 0
- Live URL returns the updated app: https://bantayog-alert-demo-36b27.web.app
- No console errors on the deployed site

## Common Failures

| Symptom | Likely Cause | Fix |
|---|---|---|
| `FirebaseError: not authorized` | Not logged in or wrong project | Run `npx firebase login` and check `.firebaserc` |
| Build fails before deploy | Missing env vars or type errors | Run `.claude/skills/build/SKILL.md` steps first |
| Old content after deploy | Service worker cache | See `errors/service-worker-cache-stale.md` |

## When to Use

- Someone asks to deploy to Firebase or publish the app
- Running `firebase deploy` to push changes to production
- Deploying Firestore rules, storage rules, or indexes separately
- Rolling back a bad deployment

## When NOT to Use

- For local development — use `npm run dev` instead
- Without a successful prior build — use build skill first
- When only testing rules locally — use firebase-emulator skill instead

## Related

- `workflows/deployment.md` — full deployment workflow including CI/CD
- `.claude/skills/build/SKILL.md` — build step
- `.claude/skills/lighthouse-audit/SKILL.md` — post-deploy audit
