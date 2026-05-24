/**
 * JoinGame.tsx
 * Elevens første steg (§1.1): tast inn spillkoden fra læreren for å koble til samme
 * spill, eller velg å spille offline (lokalt, uten sanntidssync).
 */

import { useState } from 'react';
import { gameExists } from '../../lib/gameSync';
import { normalizeGameCode } from '../../lib/gameCode';

interface Props {
  onJoin: (code: string) => void;
  onOffline: () => void;
  onSwitchRole: () => void;
}

export default function JoinGame({ onJoin, onOffline, onSwitchRole }: Props) {
  const [code, setCode] = useState('');
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    const c = normalizeGameCode(code);
    if (!c) { setError('Skriv inn spillkoden fra læreren.'); return; }
    setChecking(true);
    setError(null);
    try {
      if (await gameExists(c)) onJoin(c);
      else setError('Fant ikke spillet. Sjekk koden med læreren.');
    } catch {
      setError('Får ikke kontakt med spillet. Prøv igjen, eller spill offline.');
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-viking-darkblue to-viking-surface px-4 text-center text-viking-paper">
      <div className="absolute top-0 left-0 right-0 h-24 opacity-20 pointer-events-none text-4xl flex justify-around">
        <span>ᚦ</span><span>ᚱ</span><span>ᚦ</span><span>ᚱ</span><span>ᚦ</span>
      </div>

      <div className="z-10 w-full max-w-md">
        <h1 className="mb-2 font-cinzel text-4xl font-bold text-viking-gold">Bli med i spillet</h1>
        <p className="mb-8 font-inter italic text-viking-gold-soft">Tast inn spillkoden læreren viser på storskjermen</p>

        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          onKeyDown={(e) => { if (e.key === 'Enter') void submit(); }}
          placeholder="VIKING-XXXX"
          autoFocus
          className="w-full rounded-md border-2 border-viking-gold/60 bg-viking-darkblue/60 px-4 py-3 text-center font-mono text-xl tracking-widest text-viking-paper placeholder:text-viking-paper/30 focus:border-viking-gold focus:outline-none"
        />

        {error && <p className="mt-3 font-inter text-sm text-viking-crimson">{error}</p>}

        <button
          onClick={() => void submit()}
          disabled={checking}
          className="mt-6 w-full rounded-md border-2 border-viking-gold bg-viking-gold px-8 py-3 font-cinzel text-lg font-bold text-viking-darkblue transition-all hover:bg-viking-gold-soft disabled:opacity-50"
        >
          {checking ? 'Kobler til …' : 'Bli med'}
        </button>

        <div className="my-6 flex items-center gap-3 text-viking-gold-soft/40">
          <span className="h-px flex-1 bg-viking-gold-soft/20" />
          <span className="font-inter text-xs">eller</span>
          <span className="h-px flex-1 bg-viking-gold-soft/20" />
        </div>

        <button
          onClick={onOffline}
          className="font-inter text-sm text-viking-gold-soft/80 underline hover:text-viking-gold-soft"
        >
          Spill offline (uten kode)
        </button>

        <div className="mt-8">
          <button
            onClick={onSwitchRole}
            className="font-inter text-xs text-viking-gold-soft/60 hover:text-viking-gold-soft"
          >
            ← Bytt rolle (tilbake til rollevalg)
          </button>
        </div>
      </div>
    </div>
  );
}
