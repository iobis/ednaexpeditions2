#!/usr/bin/env python3
"""Resize and compress a photo for the /images/ gallery and print its gallery.yml entry.

Usage: python3 tools/prepare_gallery_image.py photo.jpg [more.jpg ...]
HEIC files are supported on macOS. HEIC files are supported on macOS. Output goes to assets/images/gallery/ (long edge max 1800px, JPEG quality 80, EXIF rotation applied, metadata stripped).
"""
import re, subprocess, sys, tempfile
from pathlib import Path
from PIL import Image, ImageOps

OUT = Path(__file__).resolve().parent.parent / "assets" / "images" / "gallery"
MAX_EDGE = 1800

OUT.mkdir(parents=True, exist_ok=True)
for src in map(Path, sys.argv[1:]):
    if src.suffix.lower() in (".heic", ".heif"):  # Pillow can't read HEIC; convert with macOS sips first
        tmp = Path(tempfile.mkdtemp()) / (src.stem + ".jpg")
        subprocess.run(["sips", "-s", "format", "jpeg", str(src), "--out", str(tmp)], check=True, capture_output=True)
        img = Image.open(tmp)
    else:
        img = Image.open(src)
    img = ImageOps.exif_transpose(img).convert("RGB")
    img.thumbnail((MAX_EDGE, MAX_EDGE), Image.LANCZOS)
    name = re.sub(r"[^a-z0-9]+", "-", src.stem.lower()).strip("-") + ".jpg"
    img.save(OUT / name, "JPEG", quality=80, optimize=True, progressive=True)
    print(f"# {name}: {(OUT / name).stat().st_size // 1024} KB")
    print(f'- image: /assets/images/gallery/{name}\n  width: {img.width}\n  height: {img.height}\n'
          f'  alt: ""\n  caption: ""\n  credit: "© "\n')
