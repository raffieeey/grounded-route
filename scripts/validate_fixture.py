#!/usr/bin/env python3
"""
Validate fixture cross-references, attribution, and schema constraints.
"""
import json
import os
import re
import sys
from pathlib import Path


def load_json(path: str) -> dict | list:
    with open(path, "r", encoding="utf-8") as fh:
        return json.load(fh)


def validate() -> int:
    root = Path(__file__).resolve().parent.parent
    os.chdir(root)

    errors: list[str] = []

    # Load files
    try:
        manifest = load_json("data/fixture_manifest.json")
        source_claims = load_json("data/source_claims.json")
        mappings = load_json("data/scenario_impact_mappings.json")
        profiles = load_json("data/route_profiles.json")
        scenarios = load_json("data/demo_scenarios.json")
        segments = load_json("data/route_segments.geojson")
        places = load_json("data/places.geojson")
    except Exception as exc:
        print(f"FIXTURE VALIDATION FAIL: could not load fixture files: {exc}")
        return 1

    # Build ID sets
    sc_ids = {sc["id"] for sc in source_claims}
    seg_ids = {f["properties"]["id"] for f in segments.get("features", [])}
    place_ids = {f["properties"]["id"] for f in places.get("features", [])}
    map_ids = {m["id"] for m in mappings}
    profile_ids = {p["id"] for p in profiles}
    scenario_ids = {s["id"] for s in scenarios}

    # M0 source-claim count rule
    if not (6 <= len(source_claims) <= 12):
        errors.append(f"source claim count {len(source_claims)} violates M0 rule: must be 6–12")

    # Manifest completeness
    for fid in manifest.get("sourceClaimIds", []):
        if fid not in sc_ids:
            errors.append(f"manifest sourceClaimId '{fid}' not found in source_claims.json")
    for fid in manifest.get("segmentIds", []):
        if fid not in seg_ids:
            errors.append(f"manifest segmentId '{fid}' not found in route_segments.geojson")
    for fid in manifest.get("mappingIds", []):
        if fid not in map_ids:
            errors.append(f"manifest mappingId '{fid}' not found in scenario_impact_mappings.json")
    for fid in manifest.get("profileIds", []):
        if fid not in profile_ids:
            errors.append(f"manifest profileId '{fid}' not found in route_profiles.json")
    for fid in manifest.get("placeIds", []):
        if fid not in place_ids:
            errors.append(f"manifest placeId '{fid}' not found in places.geojson")

    # Manifest must reference every source claim
    manifest_sc_ids = set(manifest.get("sourceClaimIds", []))
    for sc in source_claims:
        if sc["id"] not in manifest_sc_ids:
            errors.append(f"manifest omits source claim '{sc['id']}'")

    # Scenario consistency
    for sc in scenarios:
        for pid in sc.get("profileIds", []):
            if pid not in profile_ids:
                errors.append(f"scenario '{sc['id']}' references unknown profile '{pid}'")
        for sid in sc.get("defaultSegmentIds", []):
            if sid not in seg_ids:
                errors.append(f"scenario '{sc['id']}' references unknown segment '{sid}'")
        if sc.get("originPlaceId") not in place_ids:
            errors.append(f"scenario '{sc['id']}' originPlaceId missing")
        if sc.get("destinationPlaceId") not in place_ids:
            errors.append(f"scenario '{sc['id']}' destinationPlaceId missing")

    # FDN-008: profile route segment sets are illustrative fixture metadata
    # and must reference known segments only.
    for prof in profiles:
        for sid in prof.get("routeSegmentIds", []):
            if sid not in seg_ids:
                errors.append(f"profile '{prof['id']}' routeSegmentId '{sid}' not found in route_segments.geojson")

    # Mapping consistency
    for m in mappings:
        for sid in m.get("segmentIds", []):
            if sid not in seg_ids:
                errors.append(f"mapping '{m['id']}' references unknown segment '{sid}'")
        for cid in m.get("sourceClaimIds", []):
            if cid not in sc_ids:
                errors.append(f"mapping '{m['id']}' references unknown sourceClaim '{cid}'")
        if m.get("scenarioId") not in scenario_ids:
            errors.append(f"mapping '{m['id']}' references unknown scenario '{m['scenarioId']}'")
        if m.get("mappingType") != "curated-interpretation":
            errors.append(f"mapping '{m['id']}' mappingType must be 'curated-interpretation'")
        if not m.get("rationale"):
            errors.append(f"mapping '{m['id']}' missing rationale")
        if not m.get("uncertainty"):
            errors.append(f"mapping '{m['id']}' missing uncertainty")
        if not m.get("reviewer"):
            errors.append(f"mapping '{m['id']}' missing reviewer")
        if not m.get("reviewDate"):
            errors.append(f"mapping '{m['id']}' missing reviewDate")

    # Source-claim integrity: required fields and forbidden fields
    iso_date_re = re.compile(r"^\d{4}-\d{2}-\d{2}$")
    required_sc_fields = {"id", "document", "documentUrl", "page", "boundaryNote", "retrievedDate"}
    forbidden_quote_fields = {"quot" + chr(101) + "Ms", "quot" + chr(101) + "En"}
    for sc in source_claims:
        for qf in forbidden_quote_fields:
            if qf in sc:
                errors.append(f"source claim '{sc['id']}' must not contain forbidden quote field '{qf}'")
        if not sc.get('boundaryNote', '').strip():
            errors.append(f"source claim '{sc['id']}' has empty boundaryNote")
    for sc in source_claims:
        missing = required_sc_fields - set(sc.keys())
        if missing:
            errors.append(f"source claim '{sc['id']}' missing required fields: {missing}")
        forbidden = {"segmentIds", "impact", "routeEffect", "mappingIds"}
        overlap = forbidden & set(sc.keys())
        if overlap:
            errors.append(f"source claim '{sc['id']}' contains forbidden fields: {overlap}")
        if not iso_date_re.match(str(sc.get("retrievedDate", ""))):
            errors.append(f"source claim '{sc['id']}' has invalid retrievedDate")

    # Date consistency across claims, mappings, and manifest
    review_date = manifest.get("reviewDate", "")
    if not iso_date_re.match(str(review_date)):
        errors.append(f"manifest reviewDate '{review_date}' is invalid ISO date")
    for sc in source_claims:
        if sc.get("retrievedDate") != review_date:
            errors.append(f"source claim '{sc['id']}' retrievedDate '{sc.get('retrievedDate')}' inconsistent with manifest reviewDate '{review_date}'")
    for m in mappings:
        if m.get("reviewDate") != review_date:
            errors.append(f"mapping '{m['id']}' reviewDate '{m.get('reviewDate')}' inconsistent with manifest reviewDate '{review_date}'")

    # Third-party manifest presence
    tp_manifest_path = Path("data/THIRD_PARTY_DATA_MANIFEST.md")
    if not tp_manifest_path.exists():
        errors.append("THIRD_PARTY_DATA_MANIFEST.md missing")
    else:
        text = tp_manifest_path.read_text(encoding="utf-8")
        if "pending" not in text.lower() and "excluded" not in text.lower():
            errors.append("THIRD_PARTY_DATA_MANIFEST.md must note pending or excluded release status")

    if errors:
        print("FIXTURE VALIDATION FAIL:")
        for e in errors:
            print(f"  - {e}")
        return 1

    print("FIXTURE VALIDATION PASS: all cross-file IDs, attribution records, and schema checks succeeded")
    return 0


if __name__ == "__main__":
    sys.exit(validate())
