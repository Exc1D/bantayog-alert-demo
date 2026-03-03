# Camarines Norte Municipality Boundary & Report Sorting Accuracy Evaluation

## Scope
This evaluation checks the internal quality of the repository's municipality polygons and how report locations are assigned to municipalities.

## Data Reviewed
- `src/data/camarines-norte-boundaries.json`
- `src/utils/geoFencing.js`
- `src/hooks/useReports.js`
- `src/components/Reports/ReportModal.jsx`

## Findings

### 1) Municipality completeness (12/12)
The dataset includes exactly 12 municipalities, and the names match the expected Camarines Norte municipality list.

### 2) Boundary geometry accuracy is **low / non-authoritative**
The polygon coordinates appear highly simplified (small vertex count, rounded decimal precision) and produce many overlaps.

Using an automated audit script, 25 municipality-pair overlaps were detected. In a true municipal partition, overlaps should be near-zero (except tiny shared boundary artifacts).

Examples of problematic overlaps:
- Basud ↔ Daet
- Daet ↔ Mercedes
- San Vicente ↔ Talisay
- Talisay ↔ Vinzons
- Jose Panganiban ↔ Paracale

This indicates the boundaries are likely approximate demo shapes and should not be used for legal/official municipality attribution.

### 3) Report-to-municipality sorting behavior (before improvement)
Reports are assigned by `detectMunicipality(lat, lng)` using point-in-polygon.

Risks with the previous approach:
- If a point falls in an overlap area, first-match order determines municipality (order-dependent ambiguity).
- If a point is outside all polygons, it becomes `Unknown` even if very near a municipality.
- Coordinates of `0` were treated as invalid due to falsy checks.

### 4) Improvements implemented
1. **Coordinate validation fixed** (`Number.isFinite`) so valid numeric coordinates are accepted consistently.
2. Added **`resolveMunicipality`** with layered fallback:
   - polygon match (primary)
   - nearest municipality centroid (secondary)
   - caller fallback / `Unknown` (last resort)
3. Report submission now stores **`location.municipalityDetectionMethod`** for auditability (`polygon_match`, `nearest_centroid`, etc.).
4. Report modal now uses `resolveMunicipality` for consistent displayed municipality detection.

## Confidence and limits
- This evaluation is based on internal consistency and geometric sanity checks.
- External authoritative boundary verification (e.g., PSA/NAMRIA/geoBoundaries cross-check) could not be fetched in this environment due outbound network restrictions.

## Recommendation
For production/decision support use:
1. Replace current polygons with authoritative municipal boundaries from official PH geospatial sources.
2. Preserve `municipalityDetectionMethod` and add quality metrics (distance to boundary, uncertainty flag).
3. Add regression tests with known municipality control points to verify sorting behavior after boundary updates.
