# FDN-005 — Public-Release Rights and Attribution Review

## Scope and verdict

This is a release-readiness record for the private Grounded Route repository. It is **not legal advice**.

**Verdict: keep the repository private until DBKL gives a clear written reuse permission for the source references, the references are removed, or a qualified legal alternative is obtained. This candidate contains only official source references (document title, page, URL, retrieval metadata), not copied source text.**

## DBKL/PTKL2040 source references

The PPKL2040 copyright notice says the portal's information, text, images, graphics, files, arrangement, and materials belong to DBKL unless otherwise stated. It then says no part of the portal may be modified, copied, distributed, retransmitted, broadcast, displayed, published, licensed, transferred, sold, or commercially handled in any form without DBKL's clear prior written permission.[1]

DBKL's main copyright notice states the same ownership/restriction pattern for its official portal content.[2]

Grounded Route currently provides six official source references to PTKL2040 documents in `data/source_claims.json` — each with document title, page, official URL, retrieval date, and a project-boundary note — and renders their metadata (not copied source text) in the evidence board/draft flow. DBKL's official notices restrict copying and distribution of portal content without clear written permission. Even metadata-only references to official documents may require DBKL clearance before public distribution, and the notices do not provide an explicit public reuse grant. Do not infer permission from public download availability.

### Required DBKL gate before public release

Choose one of these evidence-backed paths before public release:

1. Obtain written DBKL permission that explicitly covers the intended public display/distribution of the source references, project repository, and website/demo; or
2. Remove the source references and replace them with a rights-cleared alternative, or reduce them to independently safe metadata; or
3. Obtain qualified legal advice for a narrowly documented alternative basis and update the public-release manifest accordingly.

No DBKL request has been sent. Any outbound request needs the user's exact-draft approval first.

## OpenStreetMap geometry and tags

OpenStreetMap data is available under the ODbL. Its official copyright page says a user may copy, distribute, transmit, and adapt the data if OpenStreetMap and contributors are credited; it also requires making clear that the data is available under the ODbL.[3]

OSMF attribution guidance says public use requires attribution and gives specific guidance for browsable maps and distributed data; for an interactive map, attribution should typically appear in a map corner, and public database/distribution contexts need a visible notice or a likely-to-be-found README/metadata location.[4]

### OSM action status

- Visible `© OpenStreetMap contributors` attribution plus the official copyright/ODbL link is now implemented in the local route-map UI and machine-readable local export payload; FDN-006 tests and an independent review verified that path.
- The repository remains private because DBKL source-reference rights are independently unresolved. Visible OSM attribution does not resolve the separate DBKL gate or authorize public release.
- Before public distribution of the GeoJSON subset, retain the displayed attribution and perform the final ODbL/public-distribution scope review described in this record.

## Release decision matrix

| Asset | Current status | Public-release decision |
|---|---|---|
| PTKL2040 source references | DBKL portal notices restrict copying/distribution absent clear written permission; the candidate provides metadata-only references, not copied source text | **Blocked / excluded** |
| Curated project interpretations | Project-authored, but trace to blocked source references | **Hold with source layer** until DBKL path is resolved |
| OSM-derived illustrative GeoJSON/tags | Visible attribution and official OSM copyright/ODbL link implemented in UI/export; final public-distribution scope review still needed | **Prepared, but overall public release remains blocked by DBKL** |
| Project code/tests/UI | MIT project-authored code | May be publishable only after upstream data/assets are safely separated |

## Claim ceiling

This review records current official portal/licensing notices and a conservative release decision. It does not decide statutory exceptions, fair dealing, database-derivative status, or any legal question that requires professional advice.

## Sources

[1] https://ppkl.dbkl.gov.my/en/notis-hak-cipta — PPKL2040 Copyright Notice
[2] https://www.dbkl.gov.my/notis-hak-cipta — DBKL Copyright Notice
[3] https://www.openstreetmap.org/copyright — OpenStreetMap Copyright and License
[4] https://osmfoundation.org/wiki/Licence/Attribution_Guidelines — OSMF Attribution Guidelines
