/**
 * VikingShip.tsx
 * Realistisk-stilisert drakkar i SVG (§9.1): tre-skrog, dragehode-stavn,
 * stripet seil med gruppens symbol, og skjold langs rekka. Farges av `color`.
 * IKKE en generisk knapp — brukes som det trykkbare gruppevalget på bølgene.
 */

import type { ShipSymbol } from '../../types';

const SYMBOL_EMOJI: Record<ShipSymbol, string> = {
  drage: '🐉',
  ulv: '🐺',
  ravn: '🐦‍⬛',
};

const GOLD = '#CDC3AD';
const WOOD = '#6E4B2A';
const WOOD_DARK = '#3A2817';
const CREAM = '#FDFBF6';

interface VikingShipProps {
  /** Hovedfarge for seilstriper, skjold og stavn. */
  color: string;
  /** Symbol som vises på seilet (drage/ulv/ravn). */
  symbol?: ShipSymbol | null;
  /** Bredde i piksler (høyde skaleres proporsjonalt). */
  size?: number;
  /** Gyngeanimasjon på bølgene. */
  bob?: boolean;
  className?: string;
}

export default function VikingShip({
  color,
  symbol = null,
  size = 200,
  bob = false,
  className = '',
}: VikingShipProps) {
  const height = size * (200 / 220);
  // Skjold langs rekka, vekselvis farge og gull.
  const shieldX = [44, 66, 88, 110, 132, 154, 176];

  return (
    <div
      className={`relative ${bob ? 'animate-bob' : ''} ${className}`}
      style={{ width: size, height }}
      aria-hidden="true"
    >
      <svg viewBox="0 0 220 200" width={size} height={height}>
        <defs>
          <clipPath id="vs-sail">
            <path d="M58,40 Q64,76 58,112 L162,112 Q156,76 162,40 Z" />
          </clipPath>
        </defs>

        {/* Mast + rå */}
        <line x1="110" y1="22" x2="110" y2="150" stroke={WOOD_DARK} strokeWidth="5" strokeLinecap="round" />
        <line x1="52" y1="38" x2="168" y2="38" stroke={WOOD_DARK} strokeWidth="5" strokeLinecap="round" />

        {/* Seil: farget grunn + cremestriper */}
        <path d="M58,40 Q64,76 58,112 L162,112 Q156,76 162,40 Z" fill={color} />
        <g clipPath="url(#vs-sail)">
          <rect x="58" y="38" width="18" height="78" fill={CREAM} opacity="0.92" />
          <rect x="94" y="38" width="18" height="78" fill={CREAM} opacity="0.92" />
          <rect x="130" y="38" width="18" height="78" fill={CREAM} opacity="0.92" />
        </g>
        <path d="M58,40 Q64,76 58,112 L162,112 Q156,76 162,40 Z" fill="none" stroke={WOOD_DARK} strokeWidth="2" />

        {/* Stavn-spiral (dragehode) og hekk-krøll */}
        <path d="M190,142 C214,142 224,114 206,102 C218,116 210,134 192,138 Z" fill={color} stroke={WOOD_DARK} strokeWidth="2" strokeLinejoin="round" />
        <circle cx="208" cy="116" r="2.4" fill={WOOD_DARK} />
        <path d="M30,142 C14,142 8,122 20,112 C12,124 18,134 32,138 Z" fill={color} stroke={WOOD_DARK} strokeWidth="2" strokeLinejoin="round" />

        {/* Skrog */}
        <path d="M22,140 Q110,158 198,140 Q110,204 22,140 Z" fill={WOOD} stroke={WOOD_DARK} strokeWidth="2.5" strokeLinejoin="round" />
        <path d="M30,150 Q110,178 190,150" fill="none" stroke={WOOD_DARK} strokeWidth="1.5" opacity="0.6" />
        <path d="M40,160 Q110,188 180,160" fill="none" stroke={WOOD_DARK} strokeWidth="1.5" opacity="0.45" />

        {/* Skjold langs rekka */}
        {shieldX.map((x, i) => (
          <circle
            key={x}
            cx={x}
            cy="141"
            r="8.5"
            fill={i % 2 === 0 ? color : GOLD}
            stroke={CREAM}
            strokeWidth="1.6"
          />
        ))}
      </svg>

      {symbol && (
        <span
          className="absolute select-none pointer-events-none"
          style={{
            left: '50%',
            top: '37%',
            transform: 'translate(-50%, -50%)',
            fontSize: size * 0.17,
            filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.55))',
          }}
        >
          {SYMBOL_EMOJI[symbol]}
        </span>
      )}
    </div>
  );
}
