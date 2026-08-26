# Third-Party Data and Attribution Manifest

**Status:** Template only — M0 fixture freeze is **not complete**. No public data fixture is yet approved for release.

## Purpose

This manifest separates project-authored code/documentation (MIT) from external data, excerpts, and assets. It is required before a fixture or app build becomes public.

## Required fields per shipped asset

| Field | Required value |
|---|---|
| Asset / fixture file | Exact repository path or package asset name |
| Source | Canonical source URL and organization |
| Retrieval date | ISO date of the exact extraction/download |
| Transformation | What was filtered, simplified, quoted, or derived |
| Attribution location | Where a user sees source/attribution in app, export, README, or NOTICE |
| License / terms evidence | URL and date checked; do not rely on memory |
| Release status | `verified`, `pending`, or `excluded` |

## Planned inputs — not approved for public release yet

| Asset / fixture | Source | Transformation | Attribution location | License / terms status | Release decision |
|---|---|---|---|---|---|
| Future `data/source_claims.json` records | DBKL Kuala Lumpur Development Plan 2040 documents; https://ppkl.dbkl.gov.my/en/muat-turun/ | Exact short excerpts plus page/URL metadata; no full PDF copy | Evidence card + exported draft + README | **Pending:** verify DBKL copyright/reuse terms for public excerpts before release | Excluded until verified |
| Future `data/route_segments.geojson` and `places.geojson` | OpenStreetMap / Overpass extraction; https://www.openstreetmap.org/ and https://overpass-turbo.eu/ | Small bounded geometry subset, simplified for a demo | Map/list attribution + README/NOTICE | **Pending:** verify current OSM attribution and data-license requirements before release | Excluded until verified |
| Future bundled map style/fonts/icons | Project-controlled or separately licensed assets only | Bundled with static app; no external runtime tile/font requests | README/NOTICE if required | **Pending:** record exact provenance and license per asset | Excluded until verified |

## Public-release checklist

- [ ] Every committed fixture asset appears in this manifest.
- [ ] Source URL, retrieval date, and transformation are recorded.
- [ ] License/terms were verified from an authoritative current source and linked here.
- [ ] Required attribution is visible in the app and export, not only in internal notes.
- [ ] Anything with unresolved terms is excluded from the public repository/build.
- [ ] A reviewer records the final release decision in `data/fixture_manifest.json` at M0/M5.

**Rule:** a reference URL alone is not a license decision. Until terms are verified, the asset is `pending` and cannot ship publicly.
