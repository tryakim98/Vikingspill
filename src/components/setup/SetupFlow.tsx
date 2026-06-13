/**
 * SetupFlow.tsx
 * Elevens gruppeoppsett (§9.1), fire steg:
 *   1) Skip-valg   — trykk på et vikingskip som gynger på bølgene
 *   2) Skip-info   — gi skipet navn, velg symbol (drage/ulv/ravn) og farge
 *   3) Startferdighet — velg én av de fem ferdighetene
 *   4) Klar        — oppsummering → «Sett seil»
 */

import { useState } from 'react';
import type { ShipSymbol, SkillKey } from '../../types';
import { skillTreeData } from '../../data';
import VikingShip from '../ship/VikingShip';
import type { GroupSetup } from '../../hooks/useGroupSetup';

const SHIP_COLORS = [
  { label: 'Gull', value: '#D4A843' },
  { label: 'Rust', value: '#A0522D' },
  { label: 'Teal', value: '#2B6B6B' },
  { label: 'Mose', value: '#5B7553' },
  { label: 'Plomme', value: '#6B3FA0' },
  { label: 'Karmosin', value: '#8B2929' },
];

const SYMBOLS: { key: ShipSymbol; emoji: string; label: string }[] = [
  { key: 'drage', emoji: '🐉', label: 'Drage' },
  { key: 'ulv', emoji: '🐺', label: 'Ulv' },
  { key: 'ravn', emoji: '🐦‍⬛', label: 'Ravn' },
];

const SKILL_KEYS = Object.keys(skillTreeData) as SkillKey[];

type Step = 'ship' | 'info' | 'skill' | 'summary';
const STEP_ORDER: Step[] = ['ship', 'info', 'skill', 'summary'];

function Waves() {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-44 overflow-hidden">
      <div className="animate-wave-slow absolute bottom-0 h-32" style={{ width: '200%' }}>
        <svg width="100%" height="100%" viewBox="0 0 2880 200" preserveAspectRatio="none">
          <path d="M0,80 C360,140 720,20 1440,80 C2160,140 2520,20 2880,80 L2880,200 L0,200 Z" fill="#182846" opacity="0.75" />
        </svg>
      </div>
      <div className="animate-wave absolute bottom-0 h-24" style={{ width: '200%' }}>
        <svg width="100%" height="100%" viewBox="0 0 2880 200" preserveAspectRatio="none">
          <path d="M0,110 C360,60 720,160 1440,110 C2160,60 2520,160 2880,110 L2880,200 L0,200 Z" fill="#0E1B33" />
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
  const [startSkill, setStartSkill] = useState<SkillKey | null>(null);

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-viking-darkblue to-viking-surface text-viking-paper">
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
                  onClick={() => { setColor(c.value); setStep('info'); }}
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
                      className={`flex flex-col items-center gap-1 rounded-lg border-2 py-3 transition-all ${symbol === s.key ? 'border-viking-gold bg-viking-gold/15' : 'border-viking-gold/30 hover:border-viking-gold/70'}`}
                    >
                      <span className="text-3xl">{s.emoji}</span>
                      <span className="font-inter text-sm">{s.label}</span>
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
                onClick={() => setStep('skill')}
                disabled={shipName.trim().length === 0}
                className="rounded-md border-2 border-viking-gold bg-viking-gold px-8 py-2 font-cinzel font-bold text-viking-darkblue transition-all hover:bg-viking-gold-soft disabled:cursor-not-allowed disabled:opacity-40"
              >
                Videre
              </button>
            </div>
          </div>
        )}

        {/* STEG 3 — STARTFERDIGHET */}
        {step === 'skill' && (
          <div className="text-center">
            <h1 className="font-saga text-3xl md:text-5xl viking-engraved-large mb-2">Velg startferdighet</h1>
            <p className="font-inter text-viking-gold-soft italic mb-8">Hvor er skipet deres sterkest fra start?</p>
            <div className="grid gap-3 md:grid-cols-2">
              {SKILL_KEYS.map((key) => {
                const branch = skillTreeData[key];
                const selected = startSkill === key;
                return (
                  <button
                    key={key}
                    onClick={() => setStartSkill(key)}
                    className={`flex items-start gap-3 rounded-lg border-2 p-4 text-left transition-all ${selected ? 'border-viking-gold bg-viking-gold/15' : 'border-viking-gold/30 hover:border-viking-gold/70'}`}
                  >
                    <span className="text-3xl leading-none" style={{ color: branch.color }}>{branch.icon}</span>
                    <span>
                      <span className="block font-cinzel text-lg text-viking-gold">{branch.name}</span>
                      <span className="block font-inter text-xs text-viking-paper/80">{branch.tiers[0].desc}</span>
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="mt-8 flex justify-center gap-4">
              <button onClick={() => setStep('info')} className="rounded-md border-2 border-viking-gold/50 px-6 py-2 font-cinzel text-viking-gold-soft transition-colors hover:border-viking-gold">Tilbake</button>
              <button
                onClick={() => setStep('summary')}
                disabled={startSkill === null}
                className="rounded-md border-2 border-viking-gold bg-viking-gold px-8 py-2 font-cinzel font-bold text-viking-darkblue transition-all hover:bg-viking-gold-soft disabled:cursor-not-allowed disabled:opacity-40"
              >
                Videre
              </button>
            </div>
          </div>
        )}

        {/* STEG 4 — KLAR */}
        {step === 'summary' && startSkill && (
          <div className="text-center">
            <h1 className="font-saga text-3xl md:text-5xl viking-engraved-large mb-6">Klar til å seile</h1>
            <div className="mb-6 flex justify-center">
              <VikingShip color={color} symbol={symbol} size={220} bob />
            </div>
            <div className="mx-auto max-w-sm rounded-lg border-2 border-viking-gold/40 bg-viking-darkblue/50 p-6 text-left font-inter">
              <p className="mb-2"><span className="text-viking-gold-soft">Skip:</span> <span className="font-cinzel text-lg text-viking-paper">{shipName}</span></p>
              <p className="mb-2"><span className="text-viking-gold-soft">Symbol:</span> {SYMBOLS.find((s) => s.key === symbol)?.emoji} {SYMBOLS.find((s) => s.key === symbol)?.label}</p>
              <p><span className="text-viking-gold-soft">Startferdighet:</span> {skillTreeData[startSkill].icon} {skillTreeData[startSkill].name}</p>
            </div>
            <div className="mt-8 flex justify-center gap-4">
              <button onClick={() => setStep('skill')} className="rounded-md border-2 border-viking-gold/50 px-6 py-2 font-cinzel text-viking-gold-soft transition-colors hover:border-viking-gold">Tilbake</button>
              <button
                onClick={() => onComplete({ shipName: shipName.trim(), shipSymbol: symbol, shipColor: color, startSkill })}
                className="rounded-md border-2 border-viking-gold bg-viking-gold px-10 py-2 font-cinzel font-bold text-viking-darkblue transition-all hover:bg-viking-gold-soft"
              >
                ⛵ Sett seil
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
