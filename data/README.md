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

## FDN-013 divergent-corridor geometry freeze

`route_segments.geojson` is a 2026-08-27 Overpass extract for a real north Kampung Baru–Saloma Link–KLCC Park corridor. Every segment carries its OSM way reference in `osmWayIds`; the three long composites follow ordered, connected source-way vertices and list every source way. The wheelchair route is 2.02 km and excludes `highway=steps` way 765200304; the parent route traverses it, while the cyclist uses the 2.49 km Jalan Raja Abdullah/Jalan Sultan Ismail road-and-cycleway detour. See [the FDN-013 evidence record](../docs/evidence/fdn-013-divergent-corridor.md) before changing geometry or profile-route IDs.

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
