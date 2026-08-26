# Data contract — Grounded Route MVP

## Purpose

The MVP uses a deliberately small, versioned fixture. It is not a live city GIS and must not claim coverage beyond the selected demonstration scenario.

## Authoritative hierarchy

1. **DBKL source documents:** planning assertions must link to the original document URL, title, page, and quoted excerpt.
2. **OpenStreetMap / Overpass extract:** supplies demonstration geometry and community-mapped tags only.
3. **Curated scenario mapping:** maps cited plan records to fixture route segments; it is reviewed project data, not government truth.
4. **User note / model interpretation:** always labelled as such.

## Required fixture files

```text
route_segments.geojson
places.geojson
plan_claims.json
route_profiles.json
demo_scenarios.json
```

## Prohibited data

- resident home addresses;
- personal contact details;
- uncited planning claims;
- claims that map geometry proves real-world accessibility;
- complete source PDFs copied into the repository.

## Source documents

- DBKL KLDP2040 download page: https://ppkl.dbkl.gov.my/en/muat-turun/
- PTKL2040 executive summary: https://ppkl.dbkl.gov.my/wp-content/uploads/2025/07/RINGKASAN-EKSEKUTIF-PTKL2040.pdf
- PTKL2040 land-use and intensity map: https://ppkl.dbkl.gov.my/wp-content/uploads/2025/06/2.-VOLUME-1-PART-2_LAND-USE-ZONE-AND-INTENSITY-MAPKLDCP2024.pdf
- OpenStreetMap: https://www.openstreetmap.org/
- Overpass Turbo: https://overpass-turbo.eu/
