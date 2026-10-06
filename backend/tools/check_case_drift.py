"""Report tracked paths whose on-disk casing differs from git's index.

On a case-insensitive filesystem (Windows, macOS) git compares paths without
regard to case, so a rename that only changes case is invisible: `git status`
reports nothing, the old name is what CI checks out, and a Linux build fails
with "could not resolve". This surfaces those paths.

Run:  python tools/check_case_drift.py
"""

from __future__ import annotations

import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]


def tracked_files() -> list[str]:
    result = subprocess.run(
        ["git", "ls-files"], capture_output=True, text=True, cwd=ROOT, check=True
    )
    return result.stdout.splitlines()


def main() -> int:
    problems: list[str] = []

    for path in tracked_files():
        target = ROOT / path
        if not target.exists():
            problems.append(f"DELETED  {path}")
            continue

        parent = target.parent
        if not parent.is_dir():
            continue

        # Compare basenames: `parent.iterdir()` yields entries, not full paths.
        by_lower = {child.name.lower(): child.name for child in parent.iterdir()}
        on_disk = by_lower.get(target.name.lower())
        if on_disk and on_disk != target.name:
            problems.append(
                f"CASE     git index: {path}\n"
                f"         on disk:   {parent.relative_to(ROOT).as_posix()}/{on_disk}"
            )

    if not problems:
        print("No case drift between git and the working tree.")
        return 0

    print(f"{len(problems)} path(s) differ only in case:\n")
    print("\n".join(problems))
    print(
        "\nGit recorded the old casing, so Linux CI checks out the old name.\n"
        "Fix with a two-step rename (a single git mv is a no-op on a\n"
        "case-insensitive filesystem):\n\n"
        "    git mv <old> <temp>\n"
        "    git mv <temp> <new>\n"
    )
    return 1


if __name__ == "__main__":
    sys.exit(main())