# FDN-006 — OSM Visible Attribution and Local-Export Metadata

## Scope

This ticket covers only the OSM attribution requirement. It does **not** resolve the separate DBKL/public-release gate.

## What changed

1. **Visible attribution in local route map** (`src/ui/LocalRouteMap.tsx`)
   - Added a clear `© OpenStreetMap contributors` link to `https://www.openstreetmap.org/copyright`.
   - Added a scope disclaimer stating the geometry/tags are illustrative local fixture context, not navigation or certified accessibility data.
   - No tiles, remote styles, fonts, tracking, or automatic external requests are introduced.

2. **Export payload helper** (`src/ui/export-payload.ts`)
   - Refactored the inline export blob in `src/App.tsx` into a typed pure helper.
   - The payload includes an `attribution` object with:
     - `osm: "© OpenStreetMap contributors"`
     - `licenseUrl: "https://www.openstreetmap.org/copyright"`
     - `scope: "Geometry and tags are illustrative local fixture context, not navigation or certified accessibility data."`

3. **Styling** (`src/styles/main.css`)
   - Added `.map-attribution` and `.map-attribution-text` styles.

4. **Documentation**
   - Updated `data/THIRD_PARTY_DATA_MANIFEST.md` to mark OSM attribution as implemented and verified.
   - Updated `README.md` with OSM attribution notice and explicit public-release exclusion.

## TDD evidence

### RED (before implementation)

```
FAIL  tests/ui/osm-attribution.test.tsx
  × LocalRouteMap shows exact © OpenStreetMap contributors text with official copyright link
    → Unable to find an element with the text: /© OpenStreetMap contributors/i
  × LocalRouteMap includes illustrative-fixture scope disclaimer near attribution
    → Unable to find an element with the text: /illustrative local fixture context/i
  × buildExportPayload returns exact attribution object with OSM text and license URL
    → expected undefined to be defined (payload.attribution)
  × approved export payload includes exact OSM attribution object
    → expected undefined to be defined (payload.attribution)
```

### GREEN (after implementation)

```
✓ tests/ui/osm-attribution.test.tsx (8 tests)
  ✓ LocalRouteMap shows exact © OpenStreetMap contributors text with official copyright link
  ✓ LocalRouteMap includes illustrative-fixture scope disclaimer near attribution
  ✓ buildExportPayload returns exact attribution object with OSM text and license URL
  ✓ buildExportPayload is a pure function with no side effects
  ✓ approved export payload includes exact OSM attribution object
  ✓ renders without fetch or XMLHttpRequest during mount and attribution display
  ✓ LocalRouteMap renders without fetch or XMLHttpRequest
  ✓ WebMCP tool inventory remains exactly six with no export/attribution agent capability
```

Full suite:
- `npm run test` → 99 passed
- `npm run typecheck` → pass
- `npm run lint` → pass
- `npm run build` → pass
- `npm run workflow:check` → pass
- `npm run fixture:check` → pass
- `npm run tdd:check` → pass
- `npx playwright test --reporter=line` → 4 passed

## WebMCP boundary preservation

- No attribution/export functionality is registered as an agent tool.
- Tool inventory remains exactly six: `get_route_context`, `find_plan_evidence`, `stage_impact_overlay`, `clear_staged_overlay`, `draft_public_comment`, `get_review_status`.
- No agent path triggers download/copy/export.

## Public-release status

**DBKL/public-release approval remains unresolved.** The OSM attribution work is complete, but the separate DBKL exact-excerpt gate (documented in `docs/evidence/fdn-005-public-release-rights-review.md`) is still blocked. Do not make the repository public or claim the release is cleared.
