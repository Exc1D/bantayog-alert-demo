# Skill: Lighthouse Audit

## Purpose

Run a Lighthouse performance audit and check scores against project thresholds.

## Steps

1. **Ensure the app is running**
   ```bash
   npm run dev
   ```
   Or use the production build:
   ```bash
   npm run build && npm run preview
   ```

2. **Run Lighthouse**
   ```bash
   npx lighthouse http://localhost:5173 --output json --output-path .tmp/lighthouse-report.json
   ```
   Adjust the port if using `npm run preview` (default 4173).

3. **Check results**
   - Open `.tmp/lighthouse-report.json` or run with `--output html --output-path .tmp/lighthouse-report.html` for a visual report
   - Verify all category scores meet the threshold: **>= 90**

4. **For deployed site**
   ```bash
   npx lighthouse https://bantayog-alert-demo-36b27.web.app --output json --output-path .tmp/lighthouse-prod-report.json
   ```

## Thresholds

| Category | Minimum Score |
|---|---|
| Performance | 90 |
| Accessibility | 90 |
| Best Practices | 90 |
| SEO | 90 |

## Success Criteria

- All four Lighthouse categories score >= 90
- Report saved to `.tmp/` (gitignored, regenerable)

## Common Failures

| Symptom | Likely Cause | Fix |
|---|---|---|
| Low performance score | Large bundles, unoptimized images | Check bundle size, lazy-load heavy modules |
| Low accessibility | Missing alt text, contrast issues | Fix ARIA labels, color contrast |
| CSP warnings in best practices | Missing CSP directives | Update `firebase.json` headers |

## Related

- `workflows/deployment.md` — Lighthouse is a pre-deploy check
- `workflows/testing.md` — Lighthouse as a performance test
- `errors/csp-violations.md` — CSP issues that affect best practices score
