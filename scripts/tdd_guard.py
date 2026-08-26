#!/usr/bin/env python3
"""
TDD guard — verifies every exported local domain action in scope
has at least one behavioral test reference outside this guard's own tests.

At foundation stage, it scans src/domain/ and src/contracts/ for exports and checks
that tests/domain/ or tests/data/ reference them.
"""
import os
import re
import sys
from pathlib import Path

DOMAINS = ["src/domain", "src/contracts"]
TEST_DIRS = ["tests/domain", "tests/data"]

EXPORT_RE = re.compile(
    r"^\s*export\s+(?:function|const|class|async\s+function)\s+(\w+)",
    re.MULTILINE,
)


def extract_exported_names(path: Path) -> set[str]:
    names: set[str] = set()
    text = path.read_text(encoding="utf-8")
    for match in EXPORT_RE.finditer(text):
        names.add(match.group(1))
    return names


def find_references(test_dirs: list[str], names: set[str]) -> dict[str, list[str]]:
    refs: dict[str, list[str]] = {n: [] for n in names}
    for td in test_dirs:
        for p in Path(td).rglob("*"):
            if p.is_file() and p.suffix in (".ts", ".js", ".tsx", ".jsx"):
                text = p.read_text(encoding="utf-8")
                for name in names:
                    if name in text:
                        refs[name].append(str(p))
    return refs


def main() -> int:
    root = Path(__file__).resolve().parent.parent
    os.chdir(root)

    # Collect exported names from domain/contracts
    exported: set[str] = set()
    for domain_dir in DOMAINS:
        for p in Path(domain_dir).rglob("*"):
            if p.is_file() and p.suffix in (".ts", ".tsx"):
                exported |= extract_exported_names(p)

    if not exported:
        print("TDD GUARD FAIL: no exported names found in domain/contracts")
        return 1

    refs = find_references(TEST_DIRS, exported)

    uncovered = [n for n in exported if not refs[n]]
    if uncovered:
        print(f"TDD GUARD FAIL: exported names lacking test references: {uncovered}")
        return 1

    print(f"TDD GUARD PASS: {len(exported)} exported names covered by tests")
    return 0


if __name__ == "__main__":
    sys.exit(main())
