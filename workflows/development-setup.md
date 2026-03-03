# Workflow: Development Setup

## Objective

Get a fully functional local development environment running, including Firebase emulators for offline development.

## Prerequisites

- Node.js >= 18.x (20.x recommended)
- npm >= 9.x
- Git
- Firebase CLI: `npm install -g firebase-tools`
- Docker (optional, for containerized dev)
- A Firebase project with Firestore, Auth, Storage, and Hosting enabled
- An OpenWeather API key

## Steps

### 1. Clone and install

```bash
git clone https://github.com/your-org/bantayog-alert.git
cd bantayog-alert
npm ci
```

Use `npm ci` (not `npm install`) to get reproducible installs from `package-lock.json`.

### 2. Configure environment variables

```bash
cp .env.example .env.local
```

Edit `.env.local` with your real credentials:

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_OPENWEATHER_API_KEY=
VITE_SENTRY_DSN=          # optional — leave empty to disable Sentry
```

**Security:** `.env.local` is gitignored. Never commit real credentials.

### 3. Start the development server

```bash
npm run dev
```

App runs at **http://localhost:3000**.

Vite HMR is enabled — changes to `src/` are reflected instantly without a full page reload.

### 4. (Optional) Firebase Emulator

For local Firestore/Auth/Storage testing without hitting the real Firebase project:

```bash
firebase emulators:start
```

The emulator suite starts:
- Firestore: `http://localhost:8080`
- Auth: `http://localhost:9099`
- Storage: `http://localhost:9199`
- Emulator UI: `http://localhost:4000`

To connect the app to emulators, set `VITE_USE_EMULATORS=true` in `.env.local` (requires the app to check this env var in `src/utils/firebase.js`).

### 5. (Optional) Docker development

```bash
npm run docker:dev
# or
docker compose -f docker-compose.dev.yml up
```

App runs at **http://localhost:5173** with the `src/` volume mounted for live reloading.

## Troubleshooting

| Problem | Likely Cause | Fix |
|---|---|---|
| `Error: Missing Firebase config` | Env vars not set | Check `.env.local` exists and has all `VITE_FIREBASE_*` values |
| Map tiles not loading | CSP or network | Check browser console for CSP errors; see `errors/csp-violations.md` |
| Firestore permission denied | Security rules or auth state | See `errors/firebase-permission-denied.md` |
| SW serving stale content | Old cache | See `errors/service-worker-cache-stale.md` |
| Port 3000 in use | Another process | `npm run dev -- --port 3001` |

## Verification

After setup, confirm:
- [ ] App loads at `http://localhost:3000`
- [ ] Map renders with tiles
- [ ] `npm run lint` exits clean
- [ ] `npm run test:run` all pass
