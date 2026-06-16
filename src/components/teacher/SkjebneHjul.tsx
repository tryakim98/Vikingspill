/**
 * SKJEBNEHJULET — stort vikinglykkehjul på lærerens storskjerm
 *
 * Læreren trykker «Spinn skjebnehjulet». Hjulet snurrer animert ~4 sek
 * (motion) med tikkende lyd, saktner, lander med et tydelig klakk, og
 * avslører «SKJEBNEN HAR TALT: …» i ~1,5 sek før onLanded utløses og
 * eventet sendes til alle gruppene.
 *
 * Designet er tre + jern + runer + Nornene i midten. SVG-basert. Dimensjonert
 * for projektor: store sektorer, store runer, lesbar på 5+ meter.
 *
 * Lydfiler kan mangle — sound.ts feiler stille (jf. onloaderror).
 */

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { WHEEL_FIELDS, type WheelFieldId } from '../../data/wheelFields';
import { playSound, stopSound } from '../../lib/sound';

const RUNES = ['ᚦ', 'ᚱ', 'ᚾ', 'ᛏ', 'ᛚ', 'ᛟ'];
// Projektor-vennlig størrelse — skaleres responsivt via CSS, men SVG-koordinater er store
// nok til at runer, ikoner og labels er lesbare på stor avstand.
const SIZE = 520;
const CENTER = SIZE / 2;
const RADIUS = 235;
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
  /** Lærer: utløses når hjulet lander, dispatcher selve eventet. */
  onLanded?: (fieldId: WheelFieldId) => void;
  /** Lærer: utløses i det hjulet settes i gang, med valgt felt-indeks — brukes til å
   *  kringkaste spinnet til elevene så det vises synkront. */
  onSpinStart?: (resultIndex: number) => void;
  disabled?: boolean;
  /** Elev (tilskuer): når denne endrer id, spinner hjulet til samme felt som læreren. */
  remoteSpin?: { id: string; resultIndex: number } | null;
  /** Elev (tilskuer): utløses når fjernstyrt spinn er ferdig (for å lukke overlayet). */
  onRemoteDone?: () => void;
}

export default function SkjebneHjul({ onLanded, onSpinStart, disabled, remoteSpin, onRemoteDone }: Props) {
  const isRemote = remoteSpin !== undefined; // tilskuer-modus (elev)
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [resultIdx, setResultIdx] = useState<number | null>(null);
  const [revealing, setRevealing] = useState(false); // den dramatiske avsløringen vises

  // Sikkerhetsnett: hvis komponenten unmountes mens hjulet snurrer, drep tikkelyden.
  useEffect(() => () => { stopSound('wheel-tick'); }, []);

  // Selve snurringen — felles for lærer (lokalt valg) og elev (fjernstyrt felt).
  const runSpin = (chosen: number) => {
    setResultIdx(null);
    setRevealing(false);
    setRotation((prev) => {
      const desiredMod = (330 - chosen * SECTOR_DEG + 360) % 360;
      const currentMod = ((prev % 360) + 360) % 360;
      const delta = (desiredMod - currentMod + 360) % 360;
      return prev + 5 * 360 + delta;
    });
    setSpinning(true);

    // Byggende tikkende lyd mens hjulet snurrer
    playSound('wheel-tick');

    window.setTimeout(() => {
      stopSound('wheel-tick');
      playSound('wheel-klakk'); // tydelig landing
      setSpinning(false);
      setResultIdx(chosen);
      setRevealing(true);
      // Liten dramatisk pause før selve eventet trigges
      window.setTimeout(() => {
        playSound('trial'); // torden-aktig markering av at noe skjer
      }, 250);
      window.setTimeout(() => {
        setRevealing(false);
        onLanded?.(WHEEL_FIELDS[chosen].id);
        onRemoteDone?.();
      }, 1800);
    }, 4200);
  };

  const spin = () => {
    if (spinning || disabled) return;
    const chosen = Math.floor(Math.random() * WHEEL_FIELDS.length);
    onSpinStart?.(chosen); // kringkast før animasjonen, så elevene spinner synkront
    runSpin(chosen);
  };

  // Elev-tilskuer: spinn til lærerens felt hver gang et nytt spinn kringkastes.
  useEffect(() => {
    if (!remoteSpin) return;
    runSpin(remoteSpin.resultIndex);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remoteSpin?.id]);

  const result = resultIdx !== null ? WHEEL_FIELDS[resultIdx] : null;

  return (
    <div className="flex flex-col items-center" data-testid="skjebnehjul">
      <div className="relative" style={{ width: SIZE, height: SIZE, maxWidth: '100%' }}>
        <motion.svg
          width="100%" height="100%"
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          animate={{ rotate: rotation }}
          transition={{ duration: 4, ease: [0.22, 0.61, 0.36, 1] }}
          style={{ filter: 'drop-shadow(0 12px 32px rgba(0,0,0,0.5))', transformOrigin: '50% 50%' }}
        >
          {/* Ytre treramme + indre gylden ring */}
          <circle cx={CENTER} cy={CENTER} r={RADIUS + 24} fill="#3a1f0d" stroke="#5a3318" strokeWidth="3" />
          <circle cx={CENTER} cy={CENTER} r={RADIUS + 10} fill="#17100A" stroke="#CDC3AD" strokeWidth="3" />

          {/* Jernnagler langs rammen */}
          {Array.from({ length: 12 }).map((_, i) => {
            const p = polar(i * 30, RADIUS + 17);
            return (
              <g key={`rivet-${i}`}>
                <circle cx={p.x} cy={p.y} r={7} fill="#6b6b6b" stroke="#1a1a1a" strokeWidth="2" />
                <circle cx={p.x - 1.5} cy={p.y - 1.5} r={2} fill="#a0a0a0" />
              </g>
            );
          })}

          {/* Sektorer */}
          {WHEEL_FIELDS.map((f, i) => (
            <path key={f.id} d={sectorPath(i)} fill={f.color} stroke="#CDC3AD" strokeWidth="3" />
          ))}

          {/* Ikon + label inni hver sektor */}
          {WHEEL_FIELDS.map((f, i) => {
            const angle = i * SECTOR_DEG + SECTOR_DEG / 2;
            const p = polar(angle, RADIUS * 0.62);
            return (
              <g key={`label-${f.id}`} transform={`translate(${p.x} ${p.y}) rotate(${angle})`}>
                <text textAnchor="middle" dominantBaseline="middle" fontSize="52" y="-22">{f.icon}</text>
                <text
                  textAnchor="middle" dominantBaseline="middle"
                  fontSize="22" y="26" fill="#FDFBF6"
                  fontFamily="Cinzel, serif" fontWeight="bold"
                  style={{ textShadow: '0 2px 4px rgba(0,0,0,0.7)' }}
                >
                  {f.shortLabel}
                </text>
              </g>
            );
          })}

          {/* Runer langs sektorgrensene — store og glødende */}
          {RUNES.map((rune, i) => {
            const p = polar(i * SECTOR_DEG, RADIUS - 22);
            return (
              <text
                key={`rune-${i}`}
                x={p.x} y={p.y}
                textAnchor="middle" dominantBaseline="middle"
                fontSize="34" fill="#CDC3AD"
                style={{ filter: 'drop-shadow(0 0 6px rgba(205,195,173,0.6))' }}
              >
                {rune}
              </text>
            );
          })}

          {/* Sentralmedaljong — Yggdrasil + Nornene */}
          <circle cx={CENTER} cy={CENTER} r={70} fill="#17100A" stroke="#CDC3AD" strokeWidth="4" />
          <circle cx={CENTER} cy={CENTER} r={62} fill="none" stroke="#CDC3AD" strokeWidth="1" />
          <text x={CENTER} y={CENTER - 10} textAnchor="middle" dominantBaseline="middle" fontSize="40" fill="#CDC3AD">ᛇ</text>
          <text
            x={CENTER} y={CENTER + 24}
            textAnchor="middle" dominantBaseline="middle"
            fontSize="13" fill="#A9A08D"
            fontFamily="Cinzel, serif" fontWeight="bold"
            letterSpacing="1.6"
          >
            NORNENE
          </text>
        </motion.svg>

        {/* Pekeren — fast øverst, stor og synlig */}
        <div
          className="pointer-events-none absolute left-1/2 -translate-x-1/2"
          style={{ top: -6 }}
        >
          <svg width="56" height="64" viewBox="0 0 56 64">
            <polygon points="28,62 6,4 50,4" fill="#CDC3AD" stroke="#3a1f0d" strokeWidth="3" />
            <circle cx="28" cy="16" r="5" fill="#3a1f0d" />
          </svg>
        </div>

        {/* Dramatisk avsløring — overlay over hjulet i ~1,5 sek */}
        <AnimatePresence>
          {revealing && result && (
            <motion.div
              key="reveal"
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.15 }}
              transition={{ type: 'spring', damping: 14, stiffness: 200 }}
              className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center"
              data-testid="skjebnehjul-reveal"
            >
              <div className="rounded-lg border-4 border-viking-gold bg-viking-darkblue/95 px-8 py-6 text-center shadow-2xl" style={{ boxShadow: '0 0 60px rgba(205,195,173,0.6)' }}>
                <p className="font-cinzel text-xs uppercase tracking-[0.35em] text-viking-gold-soft">Skjebnen har talt</p>
                <p className="mt-2 font-cinzel text-4xl font-bold text-viking-gold drop-shadow-lg">
                  {result.icon} {result.label}!
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {!isRemote && (
        <button
          onClick={spin}
          disabled={spinning || disabled}
          data-testid="skjebnehjul-spin"
          className="mt-6 rounded-md border-2 border-viking-gold bg-viking-gold px-10 py-4 font-saga text-xl font-bold text-viking-darkblue transition hover:bg-viking-gold-soft disabled:cursor-wait disabled:opacity-60"
        >
          {spinning ? 'Hjulet snurrer …' : '🎲 Spinn Skjebnehjulet'}
        </button>
      )}

      {/* Vedvarende resultattekst (vises etter at avsløringen har lagt seg) */}
      {result && !revealing && (
        <div
          data-testid="skjebnehjul-result"
          className="mt-4 max-w-md rounded-md border-2 border-viking-gold/60 bg-viking-darkblue/70 p-4 text-center"
        >
          <p className="font-cinzel text-xs uppercase tracking-widest text-viking-gold-soft">Skjebnen har talt</p>
          <p className="mt-1 font-cinzel text-2xl text-viking-gold">{result.icon} {result.label}</p>
          <p className="mt-1 font-inter text-sm italic text-viking-paper/85">{result.description}</p>
        </div>
      )}
    </div>
  );
}
