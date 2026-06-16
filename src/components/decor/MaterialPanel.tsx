/**
 * MaterialPanel.tsx
 * Ett gjenbrukbart panel med en SEMANTISK materialvariant, brukt konsekvent på alle
 * elevskjermer slik at innholdstype og materiale alltid henger sammen:
 *
 *   pergament → kulturforståelse · kunnskap · saga · refleksjon   (mørk blekk-tekst)
 *   tre       → varer · handel · handelsutbytte                   (lys tekst)
 *   jern      → rykte · ferdigheter · prøver · kamp               (lys tekst)
 *   stein     → kart · verden · oversikt                          (lys tekst)
 *
 * Teksturen er tydelig synlig; et veil-lag bak teksten (se .mat::before i index.css)
 * holder teksten lesbar uten å dekke materialet. `framed` legger på det flettede
 * border-image-rammeverket (viking-frame) for paneler som skal ha tydelig kant.
 *
 * Padding/margin/layout styres av kalleren via `className` — komponenten eier kun
 * materialet og (valgfritt) rammen.
 */

import type { CSSProperties, ReactNode } from 'react';

export type Material = 'pergament' | 'tre' | 'skinn' | 'jern' | 'stein';

const MATERIAL_CLASS: Record<Material, string> = {
  pergament: 'mat-pergament',
  tre: 'mat-tre',
  skinn: 'mat-skinn',
  jern: 'mat-jern',
  stein: 'mat-stein',
};

interface Props {
  material: Material;
  /** Legg på det flettede rammeverket (border-image) rundt panelet. */
  framed?: boolean;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
  'data-testid'?: string;
  onClick?: () => void;
}

export default function MaterialPanel({
  material,
  framed = false,
  className = '',
  style,
  children,
  onClick,
  ...rest
}: Props) {
  return (
    <div
      className={`mat ${MATERIAL_CLASS[material]} ${framed ? 'viking-frame' : ''} ${className}`}
      style={style}
      onClick={onClick}
      {...rest}
    >
      {children}
    </div>
  );
}
