"""Fetch the OFL-licensed fonts the poster generator needs.

Inter, JetBrains Mono and Source Serif 4 are all SIL Open Font License 1.1, so
they can be redistributed alongside the project. Google Fonts serves them as
woff2/EOT depending on the User-Agent, neither of which Pillow can read; these
are the upstream TrueType/OpenType originals.

Run once before `python -m tools.make_posters`:
    python -m tools.fetch_fonts
"""

from __future__ import annotations

import shutil
import urllib.request
import zipfile
from pathlib import Path

FONT_DIR = Path(__file__).resolve().parent / "fonts"

DIRECT = {
    "JetBrainsMono-Regular.ttf": (
        "https://raw.githubusercontent.com/JetBrains/JetBrainsMono/master/"
        "fonts/ttf/JetBrainsMono-Regular.ttf"
    ),
    "SourceSerif4-Light.otf": (
        "https://raw.githubusercontent.com/adobe-fonts/source-serif/release/"
        "OTF/SourceSerif4-Light.otf"
    ),
}

# Inter ships as a release zip rather than loose files in the repo.
INTER_ZIP = "https://github.com/rsms/inter/releases/download/v4.0/Inter-4.0.zip"
INTER_FILES = {
    "extras/ttf/InterDisplay-Light.ttf": "InterDisplay-Light.ttf",
    "extras/ttf/Inter-Regular.ttf": "Inter-Regular.ttf",
}


def _download(url: str, dest: Path) -> None:
    print(f"  fetching {url}")
    with urllib.request.urlopen(url, timeout=120) as response:  # noqa: S310
        dest.write_bytes(response.read())


def main() -> None:
    FONT_DIR.mkdir(parents=True, exist_ok=True)

    for name, url in DIRECT.items():
        target = FONT_DIR / name
        if target.exists():
            print(f"  {name} already present")
            continue
        _download(url, target)

    missing = [n for n in INTER_FILES.values() if not (FONT_DIR / n).exists()]
    if missing:
        archive = FONT_DIR / "_inter.zip"
        _download(INTER_ZIP, archive)
        try:
            with zipfile.ZipFile(archive) as bundle:
                for member, name in INTER_FILES.items():
                    target = FONT_DIR / name
                    if target.exists():
                        continue
                    with bundle.open(member) as src, target.open("wb") as dst:
                        shutil.copyfileobj(src, dst)
                    print(f"  extracted {name}")
        finally:
            archive.unlink(missing_ok=True)

    print(f"\nFonts in {FONT_DIR}:")
    for path in sorted(FONT_DIR.iterdir()):
        print(f"  {path.name} ({path.stat().st_size // 1024} kB)")


if __name__ == "__main__":
    main()