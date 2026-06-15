/**
 * NORRØNT DEKOR — gjenbrukbare SVG-elementer
 *
 * Stiliserte vikingsymboler (ikke tegneserie) brukt på hoved­skjermene
 * for å gi appen en umiskjennelig norrøn-mytologisk identitet.
 *
 *   Yggdrasil     — verdenstreet, brukes som bakgrunnselement på RoleSelect
 *   ThorHammer    — Mjølner, dekorerer lærerpanelet og Gudenes-prøve-felt
 *   Raven         — Hugin/Munin, kan brukes i par til å flankere overskrifter
 *   Vegvisir      — norrøn kompassrose, signal for navigasjon/setup
 *   RuneDivider   — futhark-rad som skiller seksjoner
 *   KnotBorder    — flettet knutemønster, ramme for paneler
 *
 * Alle komponenter er rene SVG-er med viking-gold som standardfarge — kan overstyres
 * via className/fill props slik at de passer kontekst (mørk bakgrunn / pergament).
 */

interface DecorProps {
  size?: number;
  className?: string;
  color?: string;
}

// ─── Yggdrasil — verdenstreet ───────────────────────────────────────────────
export function Yggdrasil({ size = 180, className = '', color = '#9C8138' }: DecorProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 200 240" className={className} aria-hidden="true">
      {/* Røtter */}
      <path
        d="M 100 200 Q 60 215 30 235 M 100 200 Q 80 220 60 235 M 100 200 Q 100 222 100 238 M 100 200 Q 120 220 140 235 M 100 200 Q 140 215 170 235"
        stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.7"
      />
      {/* Stamme */}
      <path d="M 95 200 L 95 90 L 105 90 L 105 200 Z" fill={color} opacity="0.9" />
      <path d="M 95 200 L 95 90 L 105 90 L 105 200 Z" fill="none" stroke={color} strokeWidth="1.5" />
      {/* Hovedgrener */}
      <path d="M 100 110 Q 70 90 35 70 Q 50 88 75 100" fill={color} opacity="0.7" />
      <path d="M 100 100 Q 130 80 165 60 Q 150 80 125 95" fill={color} opacity="0.7" />
      <path d="M 100 95 Q 60 60 25 40" stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M 100 95 Q 140 60 175 40" stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M 100 85 Q 100 50 100 20" stroke={color} strokeWidth="2.5" fill="none" strokeLinecap="round" />
      {/* Krone / blader */}
      <circle cx="100" cy="20" r="6" fill={color} />
      <circle cx="25" cy="40" r="5" fill={color} />
      <circle cx="175" cy="40" r="5" fill={color} />
      <circle cx="55" cy="55" r="4" fill={color} opacity="0.85" />
      <circle cx="145" cy="55" r="4" fill={color} opacity="0.85" />
      <circle cx="78" cy="30" r="3" fill={color} opacity="0.7" />
      <circle cx="122" cy="30" r="3" fill={color} opacity="0.7" />
    </svg>
  );
}

// ─── Mjølner — Tors hammer ──────────────────────────────────────────────────
export function ThorHammer({ size = 48, className = '', color = '#9C8138' }: DecorProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" className={className} aria-hidden="true">
      <g fill={color} stroke="#3a1f0d" strokeWidth="1.5" strokeLinejoin="round">
        {/* Hode */}
        <path d="M 14 14 L 50 14 L 52 22 L 50 40 L 14 40 L 12 22 Z" />
        {/* Hodets indre detalj (knutemønster) */}
        <path d="M 22 22 L 42 22 M 22 32 L 42 32" stroke={color} strokeWidth="1.5" opacity="0.4" />
        <circle cx="32" cy="27" r="3" fill="#3a1f0d" opacity="0.6" />
        {/* Skaft */}
        <path d="M 28 40 L 36 40 L 36 56 L 32 60 L 28 56 Z" />
        {/* Lærsurringer */}
        <path d="M 28 44 L 36 44 M 28 48 L 36 48 M 28 52 L 36 52" stroke="#3a1f0d" strokeWidth="1" opacity="0.7" />
      </g>
    </svg>
  );
}

// ─── Ravn — Hugin/Munin ─────────────────────────────────────────────────────
export function Raven({ size = 56, className = '', color = '#17100A', facing = 'right' }: DecorProps & { facing?: 'left' | 'right' }) {
  const flip = facing === 'left' ? 'scale(-1, 1) translate(-64, 0)' : '';
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" className={className} aria-hidden="true">
      <g transform={flip} fill={color} stroke="#9C8138" strokeWidth="1.2" strokeLinejoin="round">
        {/* Kropp */}
        <path d="M 14 38 Q 18 28 28 26 L 44 24 Q 52 24 54 30 Q 52 36 44 38 L 30 42 Q 20 44 14 38 Z" />
        {/* Hale */}
        <path d="M 12 36 L 4 32 L 6 40 L 14 42 Z" />
        {/* Hode */}
        <circle cx="48" cy="22" r="6" />
        {/* Nebb */}
        <path d="M 54 22 L 62 21 L 54 24 Z" fill="#9C8138" />
        {/* Øye */}
        <circle cx="50" cy="20" r="1.5" fill="#9C8138" />
        {/* Vinge */}
        <path d="M 24 28 Q 30 22 38 26 Q 32 30 26 32 Z" fill="#0E0A06" />
        {/* Bein */}
        <path d="M 22 42 L 22 50 M 30 42 L 30 50" stroke={color} strokeWidth="1.5" />
      </g>
    </svg>
  );
}

// ─── Vegvisir — norrøn kompassrose ──────────────────────────────────────────
export function Vegvisir({ size = 80, className = '', color = '#9C8138' }: DecorProps) {
  // Åtte armer som peker i alle kompassretninger, hver kronet av en gaffel
  const arms = Array.from({ length: 8 });
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className={className} aria-hidden="true">
      <g stroke={color} strokeWidth="1.6" fill="none" strokeLinecap="round">
        <circle cx="50" cy="50" r="3" fill={color} />
        <circle cx="50" cy="50" r="14" opacity="0.5" />
        {arms.map((_, i) => {
          const a = (i * 360) / 8;
          const rad = (a - 90) * Math.PI / 180;
          const x = 50 + 38 * Math.cos(rad);
          const y = 50 + 38 * Math.sin(rad);
          // gaffelhoder ved enden
          const fx1 = x + 4 * Math.cos(rad + 2.2);
          const fy1 = y + 4 * Math.sin(rad + 2.2);
          const fx2 = x + 4 * Math.cos(rad - 2.2);
          const fy2 = y + 4 * Math.sin(rad - 2.2);
          return (
            <g key={i}>
              <line x1="50" y1="50" x2={x} y2={y} />
              <line x1={x} y1={y} x2={fx1} y2={fy1} />
              <line x1={x} y1={y} x2={fx2} y2={fy2} />
              {/* lite ornament midt på hver arm */}
              <circle cx={50 + 22 * Math.cos(rad)} cy={50 + 22 * Math.sin(rad)} r="1.5" fill={color} />
            </g>
          );
        })}
      </g>
    </svg>
  );
}

// ─── RuneDivider — futhark-rad mellom seksjoner ─────────────────────────────
export function RuneDivider({ className = '', color = '#9C8138', runes = ['ᚦ', 'ᚱ', 'ᚾ', 'ᛏ', 'ᛚ', 'ᛟ'] }: { className?: string; color?: string; runes?: string[] }) {
  return (
    <div className={`flex items-center gap-3 ${className}`} aria-hidden="true">
      <span className="h-px flex-1" style={{ background: `linear-gradient(90deg, transparent, ${color}80, ${color})` }} />
      <span className="flex gap-2 font-cinzel text-lg" style={{ color, letterSpacing: '0.25em' }}>
        {runes.map((r, i) => <span key={i}>{r}</span>)}
      </span>
      <span className="h-px flex-1" style={{ background: `linear-gradient(90deg, ${color}, ${color}80, transparent)` }} />
    </div>
  );
}

// ─── BraidDivider — flettet bord (flettebord.png) som skillelinje ───────────
// Erstatter de rette gull-strekene mellom seksjoner. Bildet brukes som CSS-maske
// (svart bakgrunn allerede gjort transparent), fylt med gull så det matcher paletten.
export function BraidDivider({ className = '', height = 9, color = '#9C8138' }: { className?: string; height?: number; color?: string }) {
  const url = `${import.meta.env.BASE_URL}ornamenter/flettebord.png`;
  return (
    <div
      aria-hidden="true"
      className={className}
      style={{
        height, width: '100%', backgroundColor: color, opacity: 0.7,
        WebkitMaskImage: `url("${url}")`, maskImage: `url("${url}")`,
        WebkitMaskRepeat: 'no-repeat', maskRepeat: 'no-repeat',
        WebkitMaskPosition: 'center', maskPosition: 'center',
        WebkitMaskSize: '100% 100%', maskSize: '100% 100%',
      }}
    />
  );
}

// ─── EngravedShip — håndtegnet vikingskip (skip-kart/skip-avatar) ────────────
// Erstatter det tegneserieaktige SVG-skipet. Detaljert gravering på transparent
// bakgrunn; en varm tone løfter sølvet mot bronse så det matcher grensesnittet.
export function EngravedShip({ name = 'skip-kart', size = 48, className = '', bob = false }: { name?: 'skip-kart' | 'skip-avatar'; size?: number; className?: string; bob?: boolean }) {
  const url = `${import.meta.env.BASE_URL}ornamenter/${name}.png`;
  return (
    <img
      src={url} alt="" aria-hidden="true"
      className={`${bob ? 'animate-bob' : ''} ${className}`}
      style={{ width: size, height: 'auto', filter: 'sepia(0.4) saturate(1.3) brightness(1.04)' }}
    />
  );
}

// ─── KnotBorder — flettet knutemønster ──────────────────────────────────────
export function KnotBorder({ width = 240, height = 24, className = '', color = '#9C8138' }: { width?: number; height?: number; className?: string; color?: string }) {
  // Periodisk flettemønster — sammenflettede løkker
  const loops = Math.floor(width / 32);
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className={className} aria-hidden="true">
      <g stroke={color} strokeWidth="2" fill="none" strokeLinecap="round">
        {Array.from({ length: loops }).map((_, i) => {
          const x = i * 32 + 16;
          return (
            <g key={i}>
              <path d={`M ${x - 14} ${height / 2} Q ${x - 7} 2 ${x} ${height / 2} Q ${x + 7} ${height - 2} ${x + 14} ${height / 2}`} />
              <circle cx={x} cy={height / 2} r="2.5" fill={color} />
            </g>
          );
        })}
        <line x1="0" y1={height / 2} x2={width} y2={height / 2} opacity="0.25" />
      </g>
    </svg>
  );
}

// ─── DragonHead — drakehode (stiliseret, prow-aktig) ────────────────────────
export function DragonHead({ size = 72, className = '', color = '#9C8138', facing = 'right' }: DecorProps & { facing?: 'left' | 'right' }) {
  const flip = facing === 'left' ? 'scale(-1, 1) translate(-100, 0)' : '';
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className={className} aria-hidden="true">
      <g transform={flip} stroke="#3a1f0d" strokeWidth="1.5" strokeLinejoin="round">
        {/* Hals */}
        <path d="M 20 70 Q 30 50 50 45 Q 60 42 70 36 Q 78 30 78 20 Q 70 22 64 28 Q 60 32 56 34 Q 40 38 28 58 Z" fill={color} />
        {/* Krone/spir */}
        <path d="M 78 20 L 84 6 L 86 18 L 92 12 L 90 22" fill={color} />
        {/* Øye */}
        <circle cx="64" cy="30" r="2.5" fill="#3a1f0d" />
        {/* Munn-spalte */}
        <path d="M 58 38 L 76 32" stroke="#3a1f0d" strokeWidth="1" fill="none" opacity="0.6" />
        {/* Skjeggspiraler under */}
        <path d="M 30 64 Q 22 72 28 80 Q 34 72 36 68" fill={color} opacity="0.8" />
      </g>
    </svg>
  );
}
