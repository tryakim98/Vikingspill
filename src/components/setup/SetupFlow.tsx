/**
 * SetupFlow.tsx
 * Elevens gruppeoppsett (§9.1), fire steg:
 *   1) Skip-valg   — trykk på et vikingskip som gynger på bølgene
 *   2) Skip-info   — gi skipet navn, velg symbol (drage/ulv/ravn) og farge
 *   3) Mannskapsrolle — velg én av de fem rollene
 *   4) Klar        — oppsummering → «Sett seil»
 */

import { useState } from 'react';
import type { ShipSymbol, SkillKey } from '../../types';
import { CREW_ROLES } from '../../data';
import VikingShip from '../ship/VikingShip';
import NorseIcon, { AutoIcon } from '../decor/NorseIcon';
import RolePicker from './RolePicker';
import { playSound } from '../../lib/sound';
import type { GroupSetup } from '../../hooks/useGroupSetup';

const SHIP_COLORS = [
  { label: 'Gull', value: '#CDC3AD' },
  { label: 'Rust', value: '#A0522D' },
  { label: 'Teal', value: '#2B6B6B' },
  { label: 'Mose', value: '#5B7553' },
  { label: 'Plomme', value: '#6B3FA0' },
  { label: 'Karmosin', value: '#8B2929' },
];

const SYMBOLS: { key: ShipSymbol; icon: string; label: string }[] = [
  { key: 'drage', icon: 'dragonhead', label: 'Drage' },
  { key: 'ulv', icon: 'wolf', label: 'Ulv' },
  { key: 'ravn', icon: 'raven', label: 'Ravn' },
];

type Step = 'ship' | 'info' | 'role' | 'summary';
const STEP_ORDER: Step[] = ['ship', 'info', 'role', 'summary'];

function Waves() {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-44 overflow-hidden">
      <div className="animate-wave-slow absolute bottom-0 h-32" style={{ width: '200%' }}>
        <svg width="100%" height="100%" viewBox="0 0 2880 200" preserveAspectRatio="none">
          <path d="M0,80 C360,140 720,20 1440,80 C2160,140 2520,20 2880,80 L2880,200 L0,200 Z" fill="#2B4A3F" opacity="0.75" />
        </svg>
      </div>
      <div className="animate-wave absolute bottom-0 h-24" style={{ width: '200%' }}>
        <svg width="100%" height="100%" viewBox="0 0 2880 200" preserveAspectRatio="none">
          <path d="M0,110 C360,60 720,160 1440,110 C2160,60 2520,160 2880,110 L2880,200 L0,200 Z" fill="#1A2E28" />
        </svg>
      </div>
    </div>
  );
}

function StepDots({ step }: { step: Step }) {
  const idx = STEP_ORDER.indexOf(step);
  return (
    <div className="flex justify-center gap-2 mb-8 z-10">
      {STEP_ORDER.map((s, i) => (
        <span
          key={s}
          className={`h-2 rounded-full transition-all ${i <= idx ? 'w-8 bg-viking-gold' : 'w-2 bg-viking-gold/30'}`}
        />
      ))}
    </div>
  );
}

export default function SetupFlow({ onComplete }: { onComplete: (setup: GroupSetup) => void }) {
  const [step, setStep] = useState<Step>('ship');
  const [color, setColor] = useState<string>(SHIP_COLORS[0].value);
  const [shipName, setShipName] = useState('');
  const [symbol, setSymbol] = useState<ShipSymbol>('drage');
  const [role, setRole] = useState<SkillKey | null>(null);

  return (
    <div className="relative min-h-screen overflow-hidden viking-screen text-viking-paper">
      <Waves />

      <div className="relative z-10 mx-auto max-w-3xl px-4 py-10">
        <StepDots step={step} />

        {/* STEG 1 — SKIP-VALG */}
        {step === 'ship' && (
          <div className="text-center">
            <h1 className="font-saga text-3xl md:text-5xl viking-engraved-large mb-2">Velg skipet deres</h1>
            <p className="font-inter text-viking-gold-soft italic mb-10">Trykk på vikingskipet dere vil seile med</p>
            <div className="flex flex-wrap items-end justify-center gap-x-2 gap-y-6">
              {SHIP_COLORS.map((c, i) => (
                <button
                  key={c.value}
                  onClick={() => { playSound('click'); setColor(c.value); setStep('info'); }}
                  className="group rounded-lg p-2 transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-viking-gold"
                  style={{ animationDelay: `${i * 0.4}s` }}
                  aria-label={`Velg ${c.label}-skipet`}
                >
                  <VikingShip color={c.value} symbol="drage" size={150} bob />
                  <span className="mt-1 block font-inter text-xs text-viking-gold-soft/70 group-hover:text-viking-gold-soft">{c.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEG 2 — SKIP-INFO */}
        {step === 'info' && (
          <div className="text-center">
            <h1 className="font-saga text-3xl md:text-5xl viking-engraved-large mb-6">Rust ut skipet</h1>
            <div className="mb-6 flex justify-center">
              <VikingShip color={color} symbol={symbol} size={200} bob />
            </div>

            <div className="mx-auto max-w-md space-y-6">
              {/* Navn */}
              <div className="text-left">
                <label htmlFor="shipName" className="mb-1 block font-cinzel text-sm text-viking-gold-soft">Skipets navn</label>
                <input
                  id="shipName"
                  type="text"
                  value={shipName}
                  onChange={(e) => setShipName(e.target.value)}
                  maxLength={28}
                  placeholder="f.eks. Havørnen"
                  className="w-full rounded-md border-2 border-viking-gold/60 bg-viking-darkblue/60 px-4 py-3 font-inter text-viking-paper placeholder:text-viking-paper/30 focus:border-viking-gold focus:outline-none"
                />
              </div>

              {/* Symbol */}
              <div className="text-left">
                <span className="mb-2 block font-cinzel text-sm text-viking-gold-soft">Skipssymbol</span>
                <div className="grid grid-cols-3 gap-3">
                  {SYMBOLS.map((s) => (
                    <button
                      key={s.key}
                      onClick={() => setSymbol(s.key)}
                      className={`flex flex-col items-center gap-1.5 rounded-lg border-2 py-3 transition-all ${symbol === s.key ? 'border-viking-gold bg-viking-gold/15' : 'border-viking-gold/30 hover:border-viking-gold/70'}`}
                    >
                      {/* Stort gallion-figurhode (gravyr-maske via NorseIcon) som hovedmotiv;
                          strek-glyfen beholdes liten ved etiketten. */}
                      <NorseIcon name={`gallion-${s.key}`} size={64} className={symbol === s.key ? 'text-viking-gold' : 'text-viking-gold-soft/80'} />
                      <span className="inline-flex items-center gap-1 font-inter text-sm">
                        <AutoIcon name={s.icon} size={15} className="text-viking-gold-soft" /> {s.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Farge */}
              <div className="text-left">
                <span className="mb-2 block font-cinzel text-sm text-viking-gold-soft">Seilfarge</span>
                <div className="flex flex-wrap gap-3">
                  {SHIP_COLORS.map((c) => (
                    <button
                      key={c.value}
                      onClick={() => setColor(c.value)}
                      aria-label={c.label}
                      className={`h-10 w-10 rounded-full border-2 transition-transform hover:scale-110 ${color === c.value ? 'border-viking-paper ring-2 ring-viking-gold' : 'border-viking-paper/30'}`}
                      style={{ backgroundColor: c.value }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-center gap-4">
              <button onClick={() => setStep('ship')} className="rounded-md border-2 border-viking-gold/50 px-6 py-2 font-cinzel text-viking-gold-soft transition-colors hover:border-viking-gold">Tilbake</button>
              <button
                onClick={() => setStep('role')}
                disabled={shipName.trim().length === 0}
                className="rounded-md border-2 border-viking-gold bg-viking-gold px-8 py-2 font-saga font-bold text-viking-darkblue transition-all hover:bg-viking-gold-soft disabled:cursor-not-allowed disabled:opacity-40"
              >
                Videre
              </button>
            </div>
          </div>
        )}

        {/* STEG 3 — MANNSKAPSROLLE */}
        {step === 'role' && (
          <div className="text-center">
            <h1 className="font-saga text-3xl md:text-5xl viking-engraved-large mb-2">Velg din rolle</h1>
            <p className="font-inter text-viking-gold-soft italic mb-5">Hvilken stemme har du i mannskapsrådet?</p>
            {/* Ulve-knotwork (motiv-ulver.png — heldekkende gravyr) som innrammet motiv
                for mannskapsrådet/flokken. Heldekkende bilde → rammes inn (ikke maskes). */}
            <img
              src={`${import.meta.env.BASE_URL}ornamenter/motiv-ulver.png`}
              alt="" aria-hidden="true"
              className="mx-auto mb-6 w-32 rounded-lg border-2 border-viking-gold/40 shadow-[0_4px_18px_rgba(0,0,0,0.5)]"
            />
            <RolePicker value={role} onPick={setRole} />
            <div className="mt-8 flex justify-center gap-4">
              <button onClick={() => setStep('info')} className="rounded-md border-2 border-viking-gold/50 px-6 py-2 font-cinzel text-viking-gold-soft transition-colors hover:border-viking-gold">Tilbake</button>
              <button
                onClick={() => setStep('summary')}
                disabled={role === null}
                className="rounded-md border-2 border-viking-gold bg-viking-gold px-8 py-2 font-saga font-bold text-viking-darkblue transition-all hover:bg-viking-gold-soft disabled:cursor-not-allowed disabled:opacity-40"
              >
                Videre
              </button>
            </div>
          </div>
        )}

        {/* STEG 4 — KLAR */}
        {step === 'summary' && role && (
          <div className="text-center">
            <h1 className="font-saga text-3xl md:text-5xl viking-engraved-large mb-6">Klar til å seile</h1>
            <div className="mb-6 flex justify-center">
              <VikingShip color={color} symbol={symbol} size={220} bob />
            </div>
            <div className="mx-auto max-w-sm rounded-lg border-2 border-viking-gold/40 bg-viking-darkblue/50 p-6 text-left font-inter">
              <p className="mb-2"><span className="text-viking-gold-soft">Skip:</span> <span className="font-cinzel text-lg text-viking-paper">{shipName}</span></p>
              <p className="mb-2 inline-flex items-center gap-1.5"><span className="text-viking-gold-soft">Symbol:</span> <AutoIcon name={SYMBOLS.find((s) => s.key === symbol)?.icon ?? 'dragonhead'} size={16} className="text-viking-gold-soft" /> {SYMBOLS.find((s) => s.key === symbol)?.label}</p>
              <p className="inline-flex items-center gap-1.5"><span className="text-viking-gold-soft">Rolle:</span> <AutoIcon name={CREW_ROLES[role].icon} size={16} className="text-viking-gold-soft" /> {CREW_ROLES[role].title}</p>
            </div>
            <div className="mt-8 flex justify-center gap-4">
              <button onClick={() => setStep('role')} className="rounded-md border-2 border-viking-gold/50 px-6 py-2 font-cinzel text-viking-gold-soft transition-colors hover:border-viking-gold">Tilbake</button>
              <button
                onClick={() => onComplete({ shipName: shipName.trim(), shipSymbol: symbol, shipColor: color, role })}
                className="rounded-md border-2 border-viking-gold bg-viking-gold px-10 py-2 font-saga font-bold text-viking-darkblue transition-all hover:bg-viking-gold-soft"
              >
                <span className="inline-flex items-center gap-2"><AutoIcon name="sail" size={16} /> Sett seil</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
