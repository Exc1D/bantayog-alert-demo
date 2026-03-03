# Workflow: Deployment

## Objective

Deploy the application to Firebase Hosting (primary) or Docker (alternative). Ensure every deployment is validated by CI before going live.

## Deployment Targets

| Target | Method | URL |
|---|---|---|
| Production | GitHub Actions on push to `main` | https://bantayog-alert-demo-36b27.web.app |
| Preview (per PR) | GitHub Actions on PR open/push | Firebase Preview URL (auto-commented on PR) |
| Staging | Manual or branch-based | Separate Firebase project |

## CI/CD via GitHub Actions

### Automatic (recommended)

1. Push to `main` → CI runs (lint, test, build)
2. On CI pass → deploy job runs `firebase deploy --only hosting`
3. Deployment URL posted in Actions run summary

**Workflows:**
- `.github/workflows/ci.yml` — lint, test, build
- `.github/workflows/deploy.yml` — Firebase Hosting deploy
- `.github/workflows/firebase-preview.yml` — PR preview deployments

**Required GitHub Secrets:**
```
FIREBASE_SERVICE_ACCOUNT_<PROJECT_ID>   # Firebase service account JSON
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
VITE_OPENWEATHER_API_KEY
VITE_SENTRY_DSN
SENTRY_AUTH_TOKEN                        # for source map upload (optional)
```

### Manual Deploy

```bash
# Build
npm run build

# Deploy hosting only
npx firebase deploy --only hosting

# Deploy everything (hosting + rules + indexes)
npx firebase deploy
```

## Deploy Firebase Rules and Indexes

```bash
firebase deploy --only firestore:rules,storage:rules,firestore:indexes
```

Always deploy rules when `firestore.rules` or `storage.rules` changes. Rules are separate from the hosting deploy.

## Docker Deployment

**Production image:**
```bash
docker build -t bantayog-alert .
docker run -p 80:80 bantayog-alert
```

The production `Dockerfile` uses a multi-stage build: Node for `npm run build`, then Nginx to serve the `dist/`.

**Nginx config:** `nginx/` directory.

## Rollback

Firebase Hosting keeps the last 3 deploys in history.

**Rollback via CLI:**
```bash
firebase hosting:releases:list
firebase hosting:clone <SOURCE_SITE_ID>:<SOURCE_VERSION> <TARGET_SITE_ID>
```

**Or via Firebase Console:** Hosting → Release History → Rollback.

## Pre-Deployment Checklist

- [ ] All CI checks pass on the branch
- [ ] `firestore.rules` and `storage.rules` tested against emulator
- [ ] New `VITE_*` env vars added to GitHub Secrets
- [ ] CSP in `firebase.json` covers any new external connects
- [ ] `npm run build` completes without errors locally
- [ ] Lighthouse score acceptable (≥ 90 performance)
