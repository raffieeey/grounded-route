# FDN-005 — Public-Release Rights and Attribution Review

## Scope and verdict

This is a release-readiness record for the private Grounded Route repository. It is **not legal advice**.

**Verdict: keep the repository private and keep the existing DBKL/PTKL2040 excerpts excluded from any public build until DBKL gives a clear written reuse permission or the excerpts are removed/replaced.**

## DBKL/PTKL2040 excerpts

The PPKL2040 copyright notice says the portal's information, text, images, graphics, files, arrangement, and materials belong to DBKL unless otherwise stated. It then says no part of the portal may be modified, copied, distributed, retransmitted, broadcast, displayed, published, licensed, transferred, sold, or commercially handled in any form without DBKL's clear prior written permission.[1]

DBKL's main copyright notice states the same ownership/restriction pattern for its official portal content.[2]

Grounded Route currently ships six exact short PTKL2040 excerpts in `data/source_claims.json` and renders them in the evidence board/draft flow. The official notices do not provide a public reuse grant for those excerpts. The notices may not be the final word on every statutory or fair-dealing question, but they are enough to make a public release with embedded excerpts an unresolved rights risk. Do not infer permission from public download availability.

### Required DBKL gate before public release

Choose one of these evidence-backed paths before public release:

1. Obtain written DBKL permission that explicitly covers the intended public display/distribution of the quoted excerpts, project repository, and website/demo; or
2. Remove the copied excerpts and replace them with a rights-cleared alternative, while preserving only links/metadata that are independently safe to publish; or
3. Obtain qualified legal advice for a narrowly documented alternative basis and update the public-release manifest accordingly.

No DBKL request has been sent. Any outbound request needs the user's exact-draft approval first.

## OpenStreetMap geometry and tags

OpenStreetMap data is available under the ODbL. Its official copyright page says a user may copy, distribute, transmit, and adapt the data if OpenStreetMap and contributors are credited; it also requires making clear that the data is available under the ODbL.[3]

OSMF attribution guidance says public use requires attribution and gives specific guidance for browsable maps and distributed data; for an interactive map, attribution should typically appear in a map corner, and public database/distribution contexts need a visible notice or a likely-to-be-found README/metadata location.[4]

### OSM action status

- Geometry/tags remain **private-development only** until visible attribution is implemented and checked in the actual UI/export/build.
- The next bounded code ticket may add visible `© OpenStreetMap contributors` attribution plus a link to the OSM copyright/ODbL page in the map/list and local export metadata.
- This attribution work does **not** resolve the separate DBKL excerpt gate or authorize public release.

## Release decision matrix

| Asset | Current status | Public-release decision |
|---|---|---|
| PTKL2040 exact excerpts | DBKL portal notices restrict copying/distribution absent clear written permission | **Blocked / excluded** |
| Curated project interpretations | Project-authored, but trace to blocked source excerpts | **Hold with source layer** until DBKL path is resolved |
| OSM-derived illustrative GeoJSON/tags | ODbL attribution and notice required | **Pending attribution implementation and final license review** |
| Project code/tests/UI | MIT project-authored code | May be publishable only after upstream data/assets are safely separated |

## Claim ceiling

This review records current official portal/licensing notices and a conservative release decision. It does not decide statutory exceptions, fair dealing, database-derivative status, or any legal question that requires professional advice.

## Sources

[1] https://ppkl.dbkl.gov.my/en/notis-hak-cipta — PPKL2040 Copyright Notice
[2] https://www.dbkl.gov.my/notis-hak-cipta — DBKL Copyright Notice
[3] https://www.openstreetmap.org/copyright — OpenStreetMap Copyright and License
[4] https://osmfoundation.org/wiki/Licence/Attribution_Guidelines — OSMF Attribution Guidelines
