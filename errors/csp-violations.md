# Error: CSP Violations (Content Security Policy Blocked)

## Error Message

In the browser console:

```
Refused to connect to 'https://some-api.example.com/...' because it violates the following Content Security Policy directive: "connect-src 'self' ..."
```

```
Refused to load the script 'https://cdn.example.com/...' because it violates the following Content Security Policy directive: "script-src 'self'"
```

```
Refused to apply inline style because it violates the following Content Security Policy directive: "style-src 'self'"
```

## When It Occurs

- After adding a new external API or CDN dependency
- After deploying `firebase.json` changes that tightened the CSP
- When a third-party library (Leaflet plugin, analytics script) tries to load external resources

## Root Cause

The CSP headers in `firebase.json` do not include the blocked resource's origin. The policy is enforced by the browser on every resource load.

CSP headers are configured in:
```
firebase.json → hosting.headers → Content-Security-Policy
```

## Solution

### 1. Identify the blocked directive and origin

Read the console error carefully:
- The **directive** tells you which CSP rule was violated (`connect-src`, `script-src`, `img-src`, etc.)
- The **blocked URL** tells you which origin needs to be added

### 2. Update firebase.json

Add the new origin to the appropriate directive in `firebase.json`:

```json
{
  "key": "Content-Security-Policy",
  "value": "... connect-src 'self' *.googleapis.com *.firebaseapp.com api.openweathermap.org *.ingest.sentry.io <NEW-ORIGIN>; ..."
}
```

**Directive reference:**

| Directive | Controls |
|---|---|
| `connect-src` | `fetch()`, `XMLHttpRequest`, `WebSocket`, Firebase SDK, Sentry |
| `script-src` | JavaScript files and inline scripts |
| `style-src` | CSS files and inline styles |
| `img-src` | Images, including `data:` URIs and `blob:` |
| `frame-src` | `<iframe>` sources (Firebase auth popups) |
| `font-src` | Web fonts |

### 3. Deploy the updated config

```bash
firebase deploy --only hosting
```

CSP headers are served by Firebase Hosting — they require a hosting deploy to take effect. A `npm run build` alone is not enough.

### 4. Verify

Reload the app (hard reload: Ctrl+Shift+R) and confirm the console error is gone.

## Prevention

- Before integrating any new external service, add its domain to the CSP
- Keep all external connects documented in `principles/security.md`
- Review the CSP in `firebase.json` as part of the PR checklist for any change that adds external API calls

## Related Files

- `firebase.json` (CSP headers in `hosting.headers`)
- `principles/security.md` (CSP directive list)
- `src/utils/firebase.js` (Firebase SDK connections)
