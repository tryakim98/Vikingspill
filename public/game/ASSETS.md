# Skjebnehjulets ornamenter

`wheel-bronze-rim.webp` og `wheel-raven-hub.webp` ble laget med den innebygde imagegen-funksjonen 6. oktober 2026. Originalene er transparente PNG-filer. WebP-utgavene beholder alpha og komprimerer filene for nettbruk. SVG-felt, merker, peker og animasjon tegnes i `src/classroom/FateWheel.tsx` og `fate-wheel.css`.

## Prompt for bronserammen

Create a premium game UI asset: a perfectly circular Viking / Norse fate wheel outer ring frame, viewed straight from above, orthographic, centered, square image 1024x1024. IMPORTANT: only the annular outer rim is visible, the large central circular opening is completely transparent, and all space outside the ring is transparent. Outer diameter occupies 92% of the image, inner opening diameter is 72% of the image. Antique matte bronze, deep charcoal etched recesses, intricate restrained interwoven Norse knotwork engraved evenly around circumference, subtle worn highlights, 12 small bronze rivets at equal spacing. An adult museum engraving aesthetic, black and white stipple texture with desaturated bronze metal highlights, elegant handcrafted Scandinavian artifact. Crisp symmetry, realistic low-relief bronze, restrained ambient shadow, no dramatic perspective, no text, no letters, no runes, no sectors, no pointer, no background, no glow, no cartoon, no bright gold, no skulls. Asset will overlay a six-sector digital spinning wheel in a charcoal and matte bronze classroom Viking game.

## Prompt for ravnemedaljongen

Create a standalone Viking game UI central wheel medallion, isolated on transparent background. A single small perfectly circular antique bronze disk, straight-on orthographic front view, centered in square composition. On the disk a beautiful engraved pair of ravens facing each other with interlaced tails forming a restrained Norse knot. Matte worn desaturated bronze highlights, black etched recesses, museum-quality engraving, sharp low relief, fine stipple hatching, round raised edge with tiny evenly spaced rivets. Outer circle occupies 80% of canvas, remaining space fully transparent. No letters, no text, no runes, no scenery, no outer wheel, no perspective, no bright gold, no cartoon, no glow. Matches a charcoal and bronze Viking fate wheel with Norse knotwork outer ring.

## Balder

Alle bilder under `/game/balder/` leveres som WebP. Det røde seilet i `seilas.webp` og `seilas-liten.webp` går igjen i skipsmerket i hovedmenyen. De tre stillebenene viser tøyet til Markedstolken, spennen med to merkelapper og karttegnerens ark. Gjenstandene er spillillustrasjoner. De tolv havnegraveringene er nettutgaver av spillets originaler under `/steder/`.

`sjokart.webp` er tegnet fra landpolygoner og elver i [Natural Earth 1:50m](https://www.naturalearthdata.com/downloads/50m-physical-vectors/), som er [public domain](https://www.naturalearthdata.com/about/terms-of-use/). Kartplaten dekker 65° V–53° Ø og 29,5–72,3° N i Mercator-projeksjon. Havnenes anker og de forskjøvede navneskiltene har samme koordinatsystem i `Map.tsx`. Vinland er markert ved L’Anse aux Meadows, og Sápmi ved et representativt punkt i regionen. Bagdad viser hvor utsendingen i havneteksten kom fra.

Skipsmerket og de fire signalbrikkene er generert for spillet og lagret med gjennomsiktig bakgrunn. Brikkene er sortert i spillmotorens rekkefølge: sol, måne, fjell og bølge.

<details>
<summary>Motivbeskrivelser til de nye spillbrikkene</summary>

- Skipsmerket: A single modest Scandinavian boat brooch for an original historical classroom game, a low relief cast bronze longship under a square once-red sail, mounted in an openwork oval frame. Straight-on museum object photograph on transparent background. Broadside silhouette, one curved hull with raised prows, single mast, square sail and three waves beneath. Weathered honey bronze, dark recesses, traces of iron-red pigment, raking light from upper left. No text or runes.
- Flåtesignalet: A square 2 × 2 production texture atlas on a transparent background. Four circular handmade oak counters in orthographic top-down view, deeply carved cream-filled pictograms readable at 28 px. Sun with eight rays at top left, crescent moon at top right, two mountain peaks at bottom left, two rolling waves at bottom right. Worn chamfered rims, raking light from the upper left. No text or runes.

</details>
