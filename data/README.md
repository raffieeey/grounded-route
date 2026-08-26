# Data contract — Grounded Route MVP

## Purpose

The MVP uses a deliberately small, versioned fixture. It is not a live city GIS and must not claim coverage beyond the selected demonstration scenario.

## Authoritative hierarchy

1. **Source claims:** official DBKL document references with title, page, URL, retrieval date, and a project-boundary note — not copied source text. A source claim does not itself assert a route/segment impact.
2. **Scenario impact mappings:** reviewed project interpretations that connect source claims to the bounded fixture route segments, with rationale and uncertainty.
3. **OpenStreetMap / Overpass extract:** supplies demonstration geometry and community-mapped tags only.
4. **User note / model inference:** always labelled with its statement class and never elevated into an official fact.

## Planned fixture files

```text
route_segments.geojson
places.geojson
source_claims.json
scenario_impact_mappings.json
route_profiles.json
demo_scenarios.json
fixture_manifest.json
```

## Required companion documents

- [M0 Fixture-Freeze Checklist](FIXTURE_FREEZE_CHECKLIST.md)
- [Third-Party Data and Attribution Manifest](THIRD_PARTY_DATA_MANIFEST.md)

## Prohibited data

- resident home addresses;
- personal contact details;
- uncited planning claims;
- route-impact assertions disguised as official source references;
- claims that map geometry proves real-world accessibility;
- complete source PDFs copied into the repository;
- third-party assets with unresolved public-reuse terms.

## Source documents

- DBKL KLDP2040 download page: https://ppkl.dbkl.gov.my/en/muat-turun/
- PTKL2040 executive summary: https://ppkl.dbkl.gov.my/wp-content/uploads/2025/07/RINGKASAN-EKSEKUTIF-PTKL2040.pdf
- PTKL2040 land-use and intensity map: https://ppkl.dbkl.gov.my/wp-content/uploads/2025/06/2.-VOLUME-1-PART-2_LAND-USE-ZONE-AND-INTENSITY-MAPKLDCP2024.pdf
- OpenStreetMap: https://www.openstreetmap.org/
- Overpass Turbo: https://overpass-turbo.eu/
