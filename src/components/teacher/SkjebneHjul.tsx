/**
 * SKJEBNEHJULET — stort vikinglykkehjul på lærerens storskjerm
 *
 * Læreren trykker «Spinn skjebnehjulet». Hjulet snurrer animert ~4 sek
 * (motion), saktner og lander på ett av seks felt. Resultatet vises i ~1,5
 * sek før onLanded utløses og selve eventet sendes til alle gruppene.
 *
 * Designet er tre + jern + runer + Nornene i midten. SVG-basert for at
 * runene rundt rim og labels inni sektorene skal følge rotasjonen.
 */

import { useState } from 'react';
import { motion } from 'motion/react';
import { WHEEL_FIELDS, type WheelFieldId } from '../../data/wheelFields';

const RUNES = ['ᚦ', 'ᚱ', 'ᚾ', 'ᛏ', 'ᛚ', 'ᛟ'];
const SIZE = 380;
const CENTER = SIZE / 2;
const RADIUS = 170;
const SECTOR_DEG = 360 / WHEEL_FIELDS.length; // 60°

function polar(angle: number, radius = RADIUS) {
  const rad = ((angle - 90) * Math.PI) / 180;
  return { x: CENTER + radius * Math.cos(rad), y: CENTER + radius * Math.sin(rad) };
}

function sectorPath(i: number) {
  const start = i * SECTOR_DEG;
  const end = (i + 1) * SECTOR_DEG;
  const p1 = polar(start);
  const p2 = polar(end);
  return `M ${CENTER} ${CENTER} L ${p1.x} ${p1.y} A ${RADIUS} ${RADIUS} 0 0 1 ${p2.x} ${p2.y} Z`;
}

interface Props {
  onLanded: (fieldId: WheelFieldId) => void;
  disabled?: boolean;
}

export default function SkjebneHjul({ onLanded, disabled }: Props) {
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [resultIdx, setResultIdx] = useState<number | null>(null);

  const spin = () => {
    if (spinning || disabled) return;
    setResultIdx(null);
    // Trekk hvilket felt vi lander på (likt vektet) før animasjonen.
    const chosen = Math.floor(Math.random() * WHEEL_FIELDS.length);
    // Pekeren står øverst (angle 0). For at sektor i skal stå rett under pekeren
    // må hjulet rotere så (i*60+30) lander på angle 0 — dvs. til rotation mod 360
    // = (330 - i*60).
    const desiredMod = (330 - chosen * SECTOR_DEG + 360) % 360;
    const currentMod = ((rotation % 360) + 360) % 360;
    const delta = (desiredMod - currentMod + 360) % 360;
    const target = rotation + 5 * 360 + delta; // 5 full omdreininger + landingsoffset
    setRotation(target);
    setSpinning(true);
    // Animasjonen varer 4 sek — vent litt ekstra for å være trygg.
    window.setTimeout(() => {
      setSpinning(false);
      setResultIdx(chosen);
      window.setTimeout(() => {
        onLanded(WHEEL_FIELDS[chosen].id);
      }, 1500); // dramatisk pause før selve eventet trigges
    }, 4200);
  };

  const result = resultIdx !== null ? WHEEL_FIELDS[resultIdx] : null;

  return (
    <div className="flex flex-col items-center" data-testid="skjebnehjul">
      <div className="relative" style={{ width: SIZE, height: SIZE }}>
        <motion.svg
          width={SIZE}
          height={SIZE}
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          animate={{ rotate: rotation }}
          transition={{ duration: 4, ease: [0.22, 0.61, 0.36, 1] }}
          style={{ filter: 'drop-shadow(0 10px 24px rgba(0,0,0,0.45))', transformOrigin: '50% 50%' }}
        >
          {/* Ytre treramme */}
          <circle cx={CENTER} cy={CENTER} r={RADIUS + 18} fill="#3a1f0d" stroke="#5a3318" strokeWidth="2" />
          <circle cx={CENTER} cy={CENTER} r={RADIUS + 8} fill="#0B1426" stroke="#D4A843" strokeWidth="2" />

          {/* Jernnagler langs rammen */}
          {Array.from({ length: 12 }).map((_, i) => {
            const p = polar(i * 30, RADIUS + 12);
            return (
              <g key={`rivet-${i}`}>
                <circle cx={p.x} cy={p.y} r={5} fill="#6b6b6b" stroke="#1a1a1a" strokeWidth="1.5" />
                <circle cx={p.x - 1} cy={p.y - 1} r={1.5} fill="#a0a0a0" />
              </g>
            );
          })}

          {/* Sektorer */}
          {WHEEL_FIELDS.map((f, i) => (
            <path key={f.id} d={sectorPath(i)} fill={f.color} stroke="#D4A843" strokeWidth="2" />
          ))}

          {/* Ikon + kort label inni hver sektor */}
          {WHEEL_FIELDS.map((f, i) => {
            const angle = i * SECTOR_DEG + SECTOR_DEG / 2;
            const p = polar(angle, RADIUS * 0.62);
            return (
              <g key={`label-${f.id}`} transform={`translate(${p.x} ${p.y}) rotate(${angle})`}>
                <text textAnchor="middle" dominantBaseline="middle" fontSize="34" y="-14">{f.icon}</text>
                <text
                  textAnchor="middle" dominantBaseline="middle"
                  fontSize="14" y="16" fill="#FDFBF6"
                  fontFamily="Cinzel, serif" fontWeight="bold"
                  style={{ textShadow: '0 1px 2px rgba(0,0,0,0.6)' }}
                >
                  {f.shortLabel}
                </text>
              </g>
            );
          })}

          {/* Runer rundt sektorkantene */}
          {RUNES.map((rune, i) => {
            const p = polar(i * SECTOR_DEG, RADIUS - 16);
            return (
              <text
                key={`rune-${i}`}
                x={p.x} y={p.y}
                textAnchor="middle" dominantBaseline="middle"
                fontSize="22" fill="#D4A843"
                style={{ filter: 'drop-shadow(0 0 4px rgba(212,168,67,0.5))' }}
              >
                {rune}
              </text>
            );
          })}

          {/* Sentralmedaljong — Yggdrasil + Nornene */}
          <circle cx={CENTER} cy={CENTER} r={50} fill="#0B1426" stroke="#D4A843" strokeWidth="3" />
          <circle cx={CENTER} cy={CENTER} r={44} fill="none" stroke="#D4A843" strokeWidth="0.5" />
          <text x={CENTER} y={CENTER - 8} textAnchor="middle" dominantBaseline="middle" fontSize="26" fill="#D4A843">ᛇ</text>
          <text
            x={CENTER} y={CENTER + 16}
            textAnchor="middle" dominantBaseline="middle"
            fontSize="9" fill="#E8C97A"
            fontFamily="Cinzel, serif" fontWeight="bold"
            letterSpacing="1.2"
          >
            NORNENE
          </text>
        </motion.svg>

        {/* Pekeren — fast øverst */}
        <div
          className="pointer-events-none absolute left-1/2 -translate-x-1/2"
          style={{ top: -4 }}
        >
          <svg width="40" height="46" viewBox="0 0 40 46">
            <polygon points="20,44 4,4 36,4" fill="#D4A843" stroke="#3a1f0d" strokeWidth="2.5" />
            <circle cx="20" cy="12" r="3.5" fill="#3a1f0d" />
          </svg>
        </div>
      </div>

      <button
        onClick={spin}
        disabled={spinning || disabled}
        data-testid="skjebnehjul-spin"
        className="mt-6 rounded-md border-2 border-viking-gold bg-viking-gold px-8 py-3 font-cinzel text-lg font-bold text-viking-darkblue transition hover:bg-viking-gold-soft disabled:cursor-wait disabled:opacity-60"
      >
        {spinning ? 'Hjulet snurrer …' : '🎲 Spinn Skjebnehjulet'}
      </button>

      {result && (
        <div
          data-testid="skjebnehjul-result"
          className="mt-4 max-w-md rounded-md border-2 border-viking-gold/60 bg-viking-darkblue/70 p-4 text-center"
        >
          <p className="font-cinzel text-xs uppercase tracking-widest text-viking-gold-soft">Skjebnen er talt</p>
          <p className="mt-1 font-cinzel text-2xl text-viking-gold">{result.icon} {result.label}</p>
          <p className="mt-1 font-inter text-sm italic text-viking-paper/85">{result.description}</p>
        </div>
      )}
    </div>
  );
}
