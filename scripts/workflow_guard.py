#!/usr/bin/env python3
"""
Workflow guard — fails closed unless required design, plan, progress,
M0 checklist, data manifest, and core project files exist.

Foundation phase mode allows UI/WebMCP implementation to remain absent
until M0 is validated.
"""
import json
import os
import sys
from pathlib import Path

REQUIRED_DOCS = [
    "README.md",
    "docs/TECHNICAL_DESIGN.md",
    "docs/IMPLEMENTATION_PLAN.md",
    "docs/PROGRESS.md",
    "data/README.md",
    "data/FIXTURE_FREEZE_CHECKLIST.md",
    "data/THIRD_PARTY_DATA_MANIFEST.md",
]

REQUIRED_FIXTURE_FILES = [
    "data/route_segments.geojson",
    "data/places.geojson",
    "data/source_claims.json",
    "data/scenario_impact_mappings.json",
    "data/route_profiles.json",
    "data/demo_scenarios.json",
    "data/fixture_manifest.json",
]

REQUIRED_CORE_PROJECT_FILES = [
    "package.json",
    "tsconfig.json",
    "vite.config.ts",
    "index.html",
]

FOUNDATION_ALLOWED_ABSENT = [
    "src/ui",
    "src/webmcp",
    "tests/ui",
    "tests/e2e",
    "tests/webmcp",
    "tests/evals",
]


def check_exists(paths: list[str]) -> list[str]:
    missing = []
    for p in paths:
        if not Path(p).exists():
            missing.append(p)
    return missing


def main() -> int:
    root = Path(__file__).resolve().parent.parent
    os.chdir(root)

    # Check required docs
    missing_docs = check_exists(REQUIRED_DOCS)
    if missing_docs:
        print(f"WORKFLOW GUARD FAIL: missing required docs: {missing_docs}")
        return 1

    # Check core project files
    missing_core = check_exists(REQUIRED_CORE_PROJECT_FILES)
    if missing_core:
        print(f"WORKFLOW GUARD FAIL: missing core project files: {missing_core}")
        return 1

    # Check fixture files
    missing_fixtures = check_exists(REQUIRED_FIXTURE_FILES)
    if missing_fixtures:
        print(f"WORKFLOW GUARD FAIL: missing fixture files: {missing_fixtures}")
        return 1

    # Validate fixture_manifest.json exists and has version
    manifest_path = Path("data/fixture_manifest.json")
    if not manifest_path.exists():
        print("WORKFLOW GUARD FAIL: fixture_manifest.json missing")
        return 1

    try:
        manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        print(f"WORKFLOW GUARD FAIL: fixture_manifest.json invalid JSON: {exc}")
        return 1

    if not manifest.get("fixtureVersion"):
        print("WORKFLOW GUARD FAIL: fixture_manifest.json missing fixtureVersion")
        return 1

    # Foundation phase: UI/WebMCP paths may be absent
    for p in FOUNDATION_ALLOWED_ABSENT:
        if Path(p).exists():
            print(f"WORKFLOW GUARD NOTE: future-scope path present (allowed): {p}")

    print("WORKFLOW GUARD PASS: foundation phase checks complete")
    return 0


if __name__ == "__main__":
    sys.exit(main())
