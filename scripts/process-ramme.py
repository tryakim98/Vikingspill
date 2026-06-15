#!/usr/bin/env python3
"""
Gjør den mørke midten (og den glatte bakgrunnen utenfor) av ramme-kulturmote
gjennomsiktig, mens selve sølv-flettverket og hjørnene beholdes intakt.

Metode: flood fill (BFS) — IKKE en global terskel — fordi selve rammen
inneholder rene svarte piksler (lum 0). Interiøret er en glatt mørk gradient
(lum ~52-124) som er omsluttet av en lys sølvkant (lum >190). Vi flommer:
  * fra SENTRUM gjennom "interiør"-piksler (35 < lum < 155) — stopper mot
    sølvkanten (>155) og mot ren svart frame-outline (<35), så ingen lekkasje.
  * fra de fire HJØRNENE gjennom den glatte bakgrunnen (lav lokal kontrast),
    stopper mot rammens skarpe kanter.
Flommede piksler får alpha 0. En liten fjæring rydder mørk anti-alias-ring.
"""
import sys
from collections import deque
from PIL import Image
import numpy as np

SRC = "public/ornamenter/ramme-kulturmote-original.png"
DST = "public/ornamenter/ramme-kulturmote.png"

im = Image.open(SRC).convert("RGB")
a = np.asarray(im).astype(np.int16)
H, W, _ = a.shape
lum = (0.299 * a[:, :, 0] + 0.587 * a[:, :, 1] + 0.114 * a[:, :, 2])

transparent = np.zeros((H, W), dtype=bool)
visited = np.zeros((H, W), dtype=bool)

def flood(seeds, accept):
    q = deque()
    for (y, x) in seeds:
        if 0 <= y < H and 0 <= x < W and not visited[y, x]:
            visited[y, x] = True
            q.append((y, x))
            transparent[y, x] = True
    while q:
        y, x = q.popleft()
        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            ny, nx = y + dy, x + dx
            if 0 <= ny < H and 0 <= nx < W and not visited[ny, nx]:
                if accept(ny, nx, y, x):
                    visited[ny, nx] = True
                    transparent[ny, nx] = True
                    q.append((ny, nx))

# 1) Interiør: omsluttet mørk gradient. Vegg = sølv (>155) eller ren svart (<35).
flood([(H // 2, W // 2)], lambda ny, nx, y, x: 35 < lum[ny, nx] < 155)

# 2) Eksteriør: glatt bakgrunn rundt rammen. Frø fra de fire hjørnene; aksepter
#    bare små lokale luminans-sprang (glatt gradient), så vi stopper mot rammen.
visited2 = visited  # del visited så interiør ikke gjenbesøkes
corner_seeds = [(2, 2), (2, W - 3), (H - 3, 2), (H - 3, W - 3)]
flood(corner_seeds, lambda ny, nx, y, x: abs(lum[ny, nx] - lum[y, x]) < 11 and lum[ny, nx] < 165)

# 3) Fjæring: rydd en eventuell tynn mørk anti-alias-ring rett innenfor sølvkanten —
#    piksler som grenser til transparent og fortsatt er ganske mørke (<150).
ring = np.zeros((H, W), dtype=bool)
for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
    shifted = np.roll(transparent, (dy, dx), axis=(0, 1))
    ring |= shifted
ring &= ~transparent
ring &= (lum < 150)
transparent |= ring

alpha = np.where(transparent, 0, 255).astype(np.uint8)
out = np.dstack([a.astype(np.uint8), alpha])
Image.fromarray(out, "RGBA").save(DST)

frac = transparent.mean()
print(f"Lagret {DST}  ({W}x{H}, alfakanal)")
print(f"Andel gjennomsiktig: {frac:.1%}")

# Diagnose: indre hull-form pr. rad (for å velge trygg padding senere)
opaque = ~transparent
ys = [int(H * f) for f in (0.20, 0.35, 0.50, 0.65, 0.80)]
for y in ys:
    row = np.where(opaque[y])[0]
    # finn første transparente "hull" i midten
    trow = np.where(transparent[y])[0]
    if len(trow):
        print(f"  rad y={y/H:.0%}: hull x=[{trow.min()/W:.1%} .. {trow.max()/W:.1%}]")
