# FDN-012 — Real street geometry re-curation

**Reviewed:** 2026-08-27  
**Geometry source:** OpenStreetMap, queried through [Overpass API](https://overpass-api.de/api/interpreter)  
**Attribution:** © OpenStreetMap contributors (ODbL)

## Chosen corridor

The fixture is now the roughly 1.3 km Kampung Baru–Saloma Link–Jalan Ampang corridor, from a fictional `Demo Home` marker on the real Jalan Haji Hassan Salleh to a clearly fictional `Demo School` marker on a real Jalan Ampang-side sidewalk. It is a suitable bounded demo because it contains named residential streets, the real Saloma Link pedestrian bridge, a mapped north stair shortcut, a separately mapped elevator node, pedestrian footways/crossings, and the real Jalan Saloma service road. `Saloma Link` remains as a label only at its real bridge coordinate.

The fixture deliberately does not represent a route from KL Sentral, does not cross the Klang River, and does not place a pedestrian route on a highway. The only bridge geometry is OSM's real Saloma Link ways.

## Extraction and checks

The primary Overpass query used on 2026-08-27 was:

```overpass
[out:json][timeout:90];
(
  way(around:1400,3.1600,101.7065)[highway];
  way(around:1400,3.1600,101.7065)[railway];
  way(around:1400,3.1600,101.7065)[foot];
);
out geom tags;
```

Focused follow-up queries used `way(around:250,3.1612697,101.7080099)[highway]`, `node(7146945539); way(bn); out geom tags;`, and the same `out geom tags` pattern around the south bridge endpoint. Geometry in `route_segments.geojson` is copied from the resulting OSM way polylines; the plaza link is the only ordered contiguous multi-way segment and lists all three source way IDs.

Spot checks against Nominatim/OSM were made on 2026-08-27:

- `[101.7084433, 3.1607530]` resolves to **Pintasan Saloma**, OSM way **765200301**.
- `[101.7100073, 3.1594480]` resolves beside **Lorong Kuda / KLCC**, matching the extracted Jalan Saloma-side pedestrian network.
- `[101.7102705, 3.1596015]` resolves to **Jalan Yap Kwan Seng**, the real-street context of the fictional destination marker.

The current Overpass result also reports way **765200304** as `highway=steps`, and node **7146945539** as `highway=elevator`, `foot=yes`, `bicycle=yes`, `motor_vehicle=no`. The elevator node is on bridge-approach way **1237772915**. These are the accessibility-relevant facts used by the fixture; lift operation, gradients, and usable width remain field-verification questions.

## Segment truth table

| Segment | Real street / feature | OSM reference | Profile use |
|---|---|---|---|
| `seg-jalan-haji-hassan-salleh` | Jalan Haji Hassan Salleh residential road | way 169064885 | all profiles' north-side start context |
| `seg-jalan-sungai-baru` | Jalan Sungai Baru residential road | way 776974154 | all profiles |
| `seg-lorong-raja-muda-musa-1` | Lorong Raja Muda Musa 1 residential connector | way 169064905 | all profiles |
| `seg-saloma-north-access-footway` | Saloma Link north access footway | way 765200305 | all profiles before their access choice |
| `seg-saloma-north-stairs` | Saloma Link north stair shortcut | way 765200304 (`highway=steps`) | parent only; excluded from wheelchair route |
| `seg-saloma-elevator-bridge-approach` | Saloma Link bridge approach connected to mapped elevator | way 1237772915; node 7146945539 (`highway=elevator`) | wheelchair and cyclist; parent continues after stair shortcut |
| `seg-saloma-link-main-bridge` | Saloma Link / Pintasan Saloma bridge | way 765200301 (`bridge=yes`, `foot=yes`, `bicycle=dismount`) | all profiles |
| `seg-saloma-south-slope` | Saloma Link south approach | way 765200306 (`highway=footway`, `incline=down`) | all profiles; reviewed as a slope condition |
| `seg-saloma-south-access-footway` | paved south access footway | way 507063859 (`stroller=yes`, `wheelchair=yes`) | parent and wheelchair |
| `seg-saloma-plaza-crossing-link` | connected south plaza footways and marked crossing | ways 1424318962, 1424318963, 1301010392 | parent and wheelchair |
| `seg-jalan-saloma-road-bypass` | Jalan Saloma service road | way 766409728 | cyclist's real road bypass |
| `seg-jalan-saloma-sidewalk` | Jalan Saloma-side sidewalk | way 1173851759 (`tactile_paving=yes`, `wheelchair=yes`) | all profiles after their south-side choice |
| `seg-jalan-ampang-signal-crossing` | signalised pedestrian crossing near Jalan Ampang | way 732632239 (`crossing=traffic_signals`) | broad plan overlay / real crossing context |
| `seg-jalan-ampang-crossing-link` | adjacent signalised crossing link | way 732632238 (`crossing=traffic_signals`) | broad plan overlay / real crossing context |
| `seg-klcc-edge-sidewalk` | KLCC-edge sidewalk | way 1344488622 (`footway=sidewalk`, `wheelchair=yes`) | broad plan overlay / real sidewalk context |

The wheelchair profile has no segment carrying the fixture `steps` tag. It instead uses the OSM-mapped elevator-connected bridge approach and the south approach that OSM records as `incline=down`; the UI continues to call all accessibility conclusions illustrative and requires field verification. The parent profile uses the actual stair shortcut so the stroller/step concern is now about a visible mapped feature, while the cyclist takes actual Jalan Saloma road geometry after the shared bridge section that OSM marks `bicycle=dismount`.

## Renamed-ID mapping

| Synthetic ID | FDN-012 replacement |
|---|---|
| `seg-kl-central-to-jalan-travers` | `seg-jalan-haji-hassan-salleh` |
| `seg-jalan-travers-crossing` | `seg-jalan-sungai-baru` |
| `seg-jalan-travers-to-jalan-tun-sambanthan` | `seg-lorong-raja-muda-musa-1` |
| `seg-tun-sambanthan-plaza-crossing` | `seg-saloma-north-access-footway` |
| `seg-plaza-to-saloma-south` | `seg-saloma-north-stairs` / `seg-saloma-elevator-bridge-approach` |
| `seg-saloma-link-bridge` | `seg-saloma-link-main-bridge` |
| `seg-saloma-north-to-jalan-ampang` | `seg-saloma-south-slope` |
| `seg-jalan-ampang-crossing-east` | `seg-saloma-plaza-crossing-link` |
| `seg-jalan-ampang-to-demo-school` | `seg-jalan-saloma-sidewalk` |
| `seg-demo-school-frontage` | `seg-jalan-ampang-signal-crossing` / `seg-klcc-edge-sidewalk` |
| `seg-cyclist-bypass-west` | `seg-jalan-saloma-road-bypass` |
| `seg-saloma-elevator-ramp` | `seg-saloma-elevator-bridge-approach` |
| `seg-parent-stroller-route` | `seg-saloma-north-stairs` plus real south footways |
| `seg-wheelchair-alternate` | `seg-saloma-elevator-bridge-approach` plus `seg-saloma-south-slope` |

All references in profiles, mappings, scenario defaults, manifest, and UI tests were updated. `source_claims.json` remains unchanged: it continues to contain only DBKL bibliographic citations, not geometry or route-impact claims.

## RED → GREEN and gates

The first red test run caught outdated fixture cardinality, the retired manifest-version expectation, and UI assertions that assumed the elevator approach was wheelchair-exclusive. The green expectations now assert the real intent: wheelchair excludes `seg-saloma-north-stairs`, stages the mapped elevator approach, and cyclist highlights `seg-jalan-saloma-road-bypass`.

Final gate results are recorded with the commit: `npm run fixture:check`, `npm run test` (163 tests), `npx playwright test` (22 tests), `npm run workflow:check`, `npm run tdd:check`, `npm run typecheck`, `npm run lint`, and `npm run build`.

## Judge-visible result

A Kuala Lumpur viewer now sees Jalan Haji Hassan Salleh and Jalan Sungai Baru leading to the actual Saloma Link, rather than a diagonal drawn through unrelated infrastructure. The bridge is the real Pintasan Saloma geometry, with its mapped north stairs and elevator-connected approach visibly giving the profile distinction a physical basis. South of the bridge, the parent/wheelchair routes follow mapped footways and crossings while the cyclist's highlighted difference is the real Jalan Saloma service road.
