"""Generate event poster artwork in the EventSphere design system.

The seeded demo events carried a single generic tech banner, so every listing on
the site looked like the same event. These posters give each one artwork that
matches its own name, drawn from the tokens in `frontend/src/styles/tokens.css`:
warm cream canvas, 300-weight display type, electric violet as an accent only,
no gradients and no shadows.

Deliberately typographic rather than photographic. Stock photography of generic
conferences is not freely licensable without an API key, and photography would
also fight the editorial design system this project uses.

Usage:
    python -m tools.make_posters --out <dir>
"""

from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

# --- Tokens, transcribed from frontend/src/styles/tokens.css ------------- #
CANVAS = "#faf9f6"  # --color-canvas-cream
LINEN = "#f1eee9"  # --color-linen
STONE = "#d3cec6"  # --color-stone
HAIRLINE = "#dedbd6"  # --color-hairline
INK = "#111111"  # --color-ink
CARBON = "#000000"  # --color-carbon
IRON = "#414141"  # --color-iron
GRAPHITE = "#585858"  # --color-graphite
VIOLET = "#0007cb"  # --color-electric-violet

W, H = 1600, 900

FONT_DIR = Path(__file__).resolve().parent / "fonts"


def _font(name: str, size: int) -> ImageFont.FreeTypeFont:
    path = FONT_DIR / name
    if not path.exists():
        msg = f"Missing font {path}. Run tools/fetch_fonts.py first."
        raise FileNotFoundError(msg)
    return ImageFont.truetype(str(path), size)


def _display(size: int) -> ImageFont.FreeTypeFont:
    return _font("InterDisplay-Light.ttf", size)


def _sans(size: int) -> ImageFont.FreeTypeFont:
    return _font("Inter-Regular.ttf", size)


def _mono(size: int) -> ImageFont.FreeTypeFont:
    return _font("JetBrainsMono-Regular.ttf", size)


def _serif(size: int) -> ImageFont.FreeTypeFont:
    return _font("SourceSerif4-Light.otf", size)


def _tracked_text(
    draw: ImageDraw.ImageDraw,
    xy: tuple[int, int],
    text: str,
    font: ImageFont.FreeTypeFont,
    fill: str,
    tracking: int,
) -> None:
    """Draw uppercase label text with manual letter-spacing.

    Pillow has no letter-spacing control, and the eyebrow/label style in the
    design system is defined by ~1.2px tracking at 12px.
    """
    x, y = xy
    for char in text:
        draw.text((x, y), char, font=font, fill=fill)
        x += int(draw.textlength(char, font=font)) + tracking


def _wrap(draw: ImageDraw.ImageDraw, text: str, font: ImageFont.FreeTypeFont, width: int) -> list[str]:
    words = text.split()
    lines: list[str] = []
    current = ""
    for word in words:
        candidate = f"{current} {word}".strip()
        if draw.textlength(candidate, font=font) <= width:
            current = candidate
        else:
            if current:
                lines.append(current)
            current = word
    if current:
        lines.append(current)
    return lines


# --------------------------------------------------------------------------- #
# Per-category compositions
# --------------------------------------------------------------------------- #


def _tech_composition(draw: ImageDraw.ImageDraw) -> None:
    """Concentric arc rings and a gridded field — circuitry, drawn flat."""
    cx, cy = 1240, 300
    for index, radius in enumerate((300, 232, 164, 96)):
        colour = VIOLET if index == 1 else HAIRLINE
        width = 3 if index == 1 else 2
        draw.ellipse(
            [cx - radius, cy - radius, cx + radius, cy + radius],
            outline=colour,
            width=width,
        )
    draw.ellipse([cx - 28, cy - 28, cx + 28, cy + 28], fill=VIOLET)

    # Grid, fading out toward the right edge.
    for x in range(0, W, 48):
        draw.line([(x, 0), (x, 120)], fill=HAIRLINE, width=1)
    for y in range(0, 120, 24):
        draw.line([(0, y), (W, y)], fill=HAIRLINE, width=1)


def _startup_composition(draw: ImageDraw.ImageDraw) -> None:
    """Overlapping offset rectangles — stacked ideas.

    Violet is drawn as an outline, never a fill: the design system reserves it
    as an accent colour, so a solid block of it would dominate the canvas.
    """
    boxes = [
        (1080, 150, 1420, 430, VIOLET, 3),
        (1150, 215, 1490, 495, STONE, 3),
        (1220, 280, 1560, 560, HAIRLINE, 3),
    ]
    for x1, y1, x2, y2, colour, width in boxes:
        draw.rectangle([x1, y1, x2, y2], outline=colour, width=width)

    # A single solid accent keeps the composition from going entirely flat.
    draw.rectangle([1080, 372, 1140, 430], fill=VIOLET)


def _design_composition(draw: ImageDraw.ImageDraw) -> None:
    """A palette grid inside tight crop marks — a designer's contact sheet."""
    palette = [VIOLET, IRON, GRAPHITE, STONE, LINEN, CARBON]
    cell, gap, origin_x, origin_y = 84, 16, 1128, 196
    for index, colour in enumerate(palette):
        col, row = index % 3, index // 3
        x1 = origin_x + col * (cell + gap)
        y1 = origin_y + row * (cell + gap)
        draw.rectangle([x1, y1, x1 + cell, y1 + cell], fill=colour)

    # Crop marks, close to the grid rather than framing empty canvas.
    left, right = 1064, 1464
    top, bottom = 132, 480
    arm = 34
    for x in (left, right):
        draw.line([(x, top), (x, top + arm)], fill=GRAPHITE, width=2)
        draw.line([(x, bottom), (x, bottom - arm)], fill=GRAPHITE, width=2)
    for y in (top, bottom):
        draw.line([(left, y), (left + arm, y)], fill=GRAPHITE, width=2)
        draw.line([(right, y), (right - arm, y)], fill=GRAPHITE, width=2)


COMPOSITIONS = {
    "technology": _tech_composition,
    "business": _startup_composition,
    "design": _design_composition,
}


# --------------------------------------------------------------------------- #
# Poster
# --------------------------------------------------------------------------- #


def render_poster(
    *,
    title: str,
    category: str,
    date_label: str,
    venue: str,
    city: str,
    motif: str,
    status: str | None = None,
) -> Image.Image:
    image = Image.new("RGB", (W, H), CANVAS)
    draw = ImageDraw.Draw(image)

    COMPOSITIONS[motif](draw)

    # Baseline rules.
    draw.line([(96, 96), (1504, 96)], fill=HAIRLINE, width=2)
    draw.line([(96, 620), (1504, 620)], fill=HAIRLINE, width=2)

    # Eyebrow: category in tracked mono.
    _tracked_text(draw, (96, 140), category.upper(), _mono(20), VIOLET, tracking=3)

    # Display title, wrapped, 300 weight, tight leading.
    title_font = _display(76)
    lines = _wrap(draw, title, title_font, 900)
    y = 196
    for line in lines[:3]:
        draw.text((96, y), line, font=title_font, fill=INK)
        y += 84

    # Serif descriptor line.
    descriptor_font = _serif(30)
    draw.text((96, y + 14), venue, font=descriptor_font, fill=IRON)

    # Meta row, mono, tracked.
    meta_font = _mono(18)
    _tracked_text(draw, (96, 660), date_label.upper(), meta_font, IRON, tracking=1)
    _tracked_text(draw, (96, 692), city.upper(), meta_font, GRAPHITE, tracking=1)

    # Wordmark.
    _tracked_text(draw, (96, 812), "EVENTSPHERE", _mono(20), GRAPHITE, tracking=4)

    if status:
        badge = status.upper()
        badge_font = _mono(18)
        text_width = int(draw.textlength(badge, font=badge_font)) + 1 * len(badge) + 40
        x1 = W - 96 - text_width
        draw.rectangle([x1, 806, W - 96, 850], fill=LINEN)
        _tracked_text(draw, (x1 + 20, 820), badge, badge_font, GRAPHITE, tracking=1)

    return image


POSTERS = [
    {
        "slug": "techfest-2026",
        "title": "TechFest 2026",
        "category": "Technology",
        "date_label": "05 November 2026 · 08:00 IST",
        "venue": "HITEX Exhibition Centre",
        "city": "Hyderabad",
        "motif": "technology",
    },
    {
        "slug": "startup-meetup",
        "title": "Startup Meetup",
        "category": "Business",
        "date_label": "20 October 2026 · 16:00 IST",
        "venue": "WeWork, Banjara Hills",
        "city": "Hyderabad",
        "motif": "business",
    },
    {
        "slug": "design-workshop",
        "title": "Design Workshop",
        "category": "Design",
        "date_label": "20 November 2026 · 10:00 IST",
        "venue": "Community Hall",
        "city": "Hyderabad",
        "motif": "design",
        "status": "Cancelled",
    },
]


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--out", required=True, help="output directory for PNGs")
    args = parser.parse_args()

    out = Path(args.out)
    out.mkdir(parents=True, exist_ok=True)

    for spec in POSTERS:
        image = render_poster(
            **{
                key: value
                for key, value in spec.items()
                if key != "slug"
            }
        )
        path = out / f"{spec['slug']}.png"
        image.save(path, "PNG", optimize=True)
        print(f"wrote {path} ({path.stat().st_size // 1024} kB)")


if __name__ == "__main__":
    main()