#!/usr/bin/env python3
"""
process-chatgpt-ikoner.py — kutter ChatGPT-arkene i public/_chatgpt/, fjerner svart
bakgrunn og gjør motivet til hvit strek på transparent (alfa = lysstyrke), beskjærer
til motivet på kvadratisk lerret, og lagrer ferdige PNG-er i public/ornamenter/.

Maske-prinsipp: NorseIcon bruker PNG-ens ALFA som CSS-maske og fyller med
currentColor. Vi setter derfor RGB=hvitt og alfa = lysstyrke (med et lite svart-gulv),
så høylysene/relieffet vises i tekstfargen og svart bakgrunn blir transparent.
"""
from PIL import Image
import os

SRC = 'public/_chatgpt'
DST = 'public/ornamenter'

# Svart-gulv: lysstyrke <= FLOOR blir helt transparent (fjerner bakgrunnen).
FLOOR = 18

def to_white_on_transparent(im: Image.Image) -> Image.Image:
    """RGB→hvitt, alfa = kontraststrukket lysstyrke (svart-gulv fjernet)."""
    g = im.convert('L')
    px = g.load()
    w, h = g.size
    alpha = Image.new('L', (w, h), 0)
    ap = alpha.load()
    span = 255 - FLOOR
    for y in range(h):
        for x in range(w):
            v = px[x, y]
            ap[x, y] = 0 if v <= FLOOR else int((v - FLOOR) * 255 / span)
    out = Image.new('RGBA', (w, h), (255, 255, 255, 0))
    out.putalpha(alpha)
    # RGB hvitt der det er noe alfa (irrelevant for maske, men ryddig for <img>-bruk).
    white = Image.new('RGBA', (w, h), (255, 255, 255, 0))
    white.putalpha(alpha)
    return white

def trim_square(im: Image.Image, margin_frac=0.06, size=512) -> Image.Image:
    """Beskjær til alfa-bbox, sentrer på kvadratisk transparent lerret, skaler til size."""
    bbox = im.getbbox()
    if bbox:
        im = im.crop(bbox)
    w, h = im.size
    side = max(w, h)
    pad = int(side * margin_frac)
    canvas = side + 2 * pad
    sq = Image.new('RGBA', (canvas, canvas), (255, 255, 255, 0))
    sq.paste(im, ((canvas - w) // 2, (canvas - h) // 2), im)
    return sq.resize((size, size), Image.LANCZOS)

def cells(path, cols, rows):
    im = Image.open(path).convert('RGBA')
    w, h = im.size
    cw, ch = w / cols, h / rows
    out = []
    for r in range(rows):
        for c in range(cols):
            out.append(im.crop((round(c * cw), round(r * ch), round((c + 1) * cw), round((r + 1) * ch))))
    return out

def save(im, name):
    im.save(os.path.join(DST, name))
    print('  →', name, im.size)

def piece(cell, name, size=512):
    save(trim_square(to_white_on_transparent(cell), size=size), name)

# --- Ferdigheter (3×2) ---
print('ark-ferdigheter:')
f = cells(f'{SRC}/ark-ferdigheter.png', 3, 2)
for cell, name in zip(f, ['ikon-sprak.png', 'ikon-sjomannskap.png', 'ikon-krigskunst.png',
                          'ikon-diplomati.png', 'ikon-tro.png', 'ikon-skjold.png']):
    piece(cell, name)

# --- Ressurser (3×2) ---
print('ark-ressurser:')
r = cells(f'{SRC}/ark-ressurser.png', 3, 2)
for cell, name in zip(r, ['ikon-kultur.png', 'ikon-rykte.png', 'ikon-handelsvarer.png',
                          'ikon-svenneprove.png', 'ikon-hvalrosstann.png', 'ikon-pelsverk.png']):
    piece(cell, name)

# --- Volum (1×2) ---
print('volum:')
v = cells(f'{SRC}/volum.png', 2, 1)
piece(v[0], 'ikon-lyd-pa.png')
piece(v[1], 'ikon-lyd-av.png')

# --- Hjelp (enkeltbilde) ---
print('hjelp:')
piece(Image.open(f'{SRC}/hjelp.png').convert('RGBA'), 'ikon-hjelp.png')

# --- Hero-motiv (større) ---
print('hero-motiv:')
piece(Image.open(f'{SRC}/vekt.png').convert('RGBA'), 'motiv-vekt.png', size=1024)
piece(Image.open(f'{SRC}/hall.png').convert('RGBA'), 'motiv-hall.png', size=1024)
piece(Image.open(f'{SRC}/gudeoye.png').convert('RGBA'), 'motiv-gudeoye.png', size=1024)

# --- Gallioner (1×3) ---
print('gallioner:')
g = cells(f'{SRC}/gallioner.png', 3, 1)
for cell, name in zip(g, ['gallion-drage.png', 'gallion-ulv.png', 'gallion-ravn.png']):
    piece(cell, name, size=1024)

print('ferdig.')
