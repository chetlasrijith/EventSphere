"""Detect import specifiers whose case does not match the file on disk.

Windows and macOS use case-insensitive filesystems, so a mismatch between an
import and a filename builds locally and fails on Linux CI. Vercel builds on
Linux, so these only surface after push.

Run:  python tools/check_import_case.py
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

SRC = Path(__file__).resolve().parents[1] / "src"

# Relative imports only; bare specifiers resolve through node_modules.
IMPORT_RE = re.compile(
    r"""(?:from|import)\s+['"](\.{1,2}/[^'"]+)['"]""",
)

# Extensions Vite will try when a specifier has none.
CANDIDATE_SUFFIXES = ("", ".jsx", ".tsx", ".js", ".ts", ".json", ".css")


def _resolve(base: Path, specifier: str) -> Path | None:
    return (base / specifier).resolve()


def _exists(base: Path, specifier: str) -> tuple[bool, bool]:
    """Return (exists_exactly, exists_ignoring_case)."""
    target = _resolve(base, specifier)
    assert target is not None

    parts = specifier.split("/")
    cursor = base
    for part in parts:
        if not cursor.exists():
            return (False, False)
        exact = cursor / part
        if exact.exists():
            cursor = exact
            continue

        if "." not in part:
            matched = None
            for suffix in CANDIDATE_SUFFIXES[1:]:
                candidate = cursor / f"{part}{suffix}"
                if candidate.exists():
                    matched = candidate
                    break
            if matched is not None:
                cursor = matched
                continue

        # Not an exact match. Look for a case-only difference.
        matches = [
            child
            for child in cursor.iterdir()
            if child.name.lower() == part.lower()
        ]
        if len(matches) == 1:
            try:
                matches[0].relative_to(base.parent)
            except ValueError:
                pass
            return (False, True)
        return (False, False)
    return (True, True)


def main() -> int:
    problems: list[str] = []

    for source in sorted(SRC.rglob("*")):
        if source.suffix not in {".js", ".jsx", ".ts", ".tsx"}:
            continue

        text = source.read_text(encoding="utf-8", errors="replace")
        for match in IMPORT_RE.finditer(text):
            specifier = match.group(1)
            exact, insensitive = _exists(source.parent, specifier)
            if exact:
                continue
            if insensitive:
                problems.append(
                    f"CASE MISMATCH  {source.relative_to(SRC.parent)}\n"
                    f"                imports {specifier!r} but a file differing only in case exists"
                )
            else:
                problems.append(
                    f"MISSING        {source.relative_to(SRC.parent)}\n"
                    f"                imports {specifier!r} -- no such file (case-insensitively or not)"
                )

    if not problems:
        print("All relative imports resolve with exact case.")
        return 0

    print(f"{len(problems)} problem(s):\n")
    print("\n\n".join(problems))
    print(
        "\n\nThese build on Windows/macOS but fail on Linux CI. Fix the casing to\n"
        "match the file on disk (or rename the file), then commit the rename --\n"
        "git mv, so the new casing is what CI sees."
    )
    return 1


if __name__ == "__main__":
    sys.exit(main())