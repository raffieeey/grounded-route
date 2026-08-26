# Third-Party Data and Attribution Manifest

**Status:** M0 fixture freeze complete. Public release is **EXCLUDED** pending verification of all third-party terms.

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

## M0 fixture assets

| Asset / fixture | Source | Transformation | Attribution location | License / terms status | Release decision |
|---|---|---|---|---|---|
| `data/source_claims.json` records | DBKL Kuala Lumpur Development Plan 2040 documents; https://ppkl.dbkl.gov.my/en/muat-turun/ | Exact short excerpts plus page/URL metadata; no full PDF copy | Evidence card + exported draft + README | **Pending:** verify DBKL copyright/reuse terms for public excerpts before release | **Excluded** until verified |
| `data/route_segments.geojson` and `data/places.geojson` | OpenStreetMap / Overpass extraction; https://www.openstreetmap.org/ and https://overpass-turbo.eu/ | Small bounded illustrative geometry subset, simplified for a demo | Map/list attribution + README/NOTICE | **Verified:** OSM data is ODbL (https://api.openstreetmap.org/copyright, checked 2026-08-26) and requires credit to OpenStreetMap and contributors. Required attribution display in app UI is **pending implementation**. | **Excluded** until attribution display is implemented and upstream terms verified in build |
| `data/fixture_manifest.json`, `data/demo_scenarios.json`, `data/route_profiles.json`, `data/scenario_impact_mappings.json` | Project-authored curation | Compiled from verified source excerpts and illustrative geometry | README/NOTICE | Project-authored (MIT) | **Excluded** until upstream terms verified |

## Public-release checklist

- [x] Every committed fixture asset appears in this manifest.
- [x] Source URL, retrieval date, and transformation are recorded.
- [x] License/terms were verified from an authoritative current source and linked here (OSM).
- [ ] Required attribution is visible in the app and export, not only in internal notes (pending map UI).
- [x] Anything with unresolved terms is excluded from the public repository/build.
- [x] A reviewer records the final release decision in `data/fixture_manifest.json` at M0.

**Rule:** a reference URL alone is not a license decision. Until terms are verified, the asset is `pending` and cannot ship publicly.
