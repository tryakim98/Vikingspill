/**
 * JoinGame.tsx
 * Elevens første steg (§1.1). To tydelige, bevisste valg:
 *   1) Bli med i lærerens spill — tast 4-bokstavskode → sanntid med klassen.
 *   2) Øv alene (offline)        — uten kode, uten lærer, uten leaderboard.
 * Designet sånn at offline-modus er et bevisst valg, ikke noe man havner i ved uhell.
 */

import { useState } from 'react';
import { gameExists } from '../../lib/gameSync';
import { normalizeGameCode, isValidGameCode, CODE_LENGTH } from '../../lib/gameCode';

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
    if (!isValidGameCode(c)) {
      setError(`Koden er ${CODE_LENGTH} bokstaver (uten I og O). Sjekk koden med læreren.`);
      return;
    }
    setChecking(true);
    setError(null);
    try {
      if (await gameExists(c)) onJoin(c);
      else setError('Fant ikke spillet. Sjekk koden med læreren.');
    } catch {
      setError('Får ikke kontakt med spillet. Sjekk nettet og prøv igjen.');
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center viking-screen px-4 py-8 text-viking-paper">
      <div className="pointer-events-none absolute inset-x-0 top-0 flex h-24 justify-around text-4xl opacity-20">
        <span>ᚦ</span><span>ᚱ</span><span>ᚦ</span><span>ᚱ</span><span>ᚦ</span>
      </div>

      <div className="z-10 w-full max-w-md space-y-5">
        <div className="text-center">
          <h1 className="font-cinzel text-3xl font-bold text-viking-gold sm:text-4xl">Sett seil</h1>
          <p className="mt-2 font-inter italic text-viking-gold-soft">Hvordan vil dere spille?</p>
        </div>

        {/* PRIMÆR: Bli med i lærerens spill */}
        <section className="rounded-lg border-2 border-viking-gold bg-viking-surface p-5 shadow-[0_0_18px_rgba(212,168,67,0.15)]">
          <div className="mb-2 flex items-center gap-2">
            <span className="text-2xl" aria-hidden>🟢</span>
            <h2 className="font-cinzel text-xl font-bold text-viking-gold">Bli med i lærerens spill</h2>
          </div>
          <p className="mb-4 font-inter text-sm text-viking-paper/85">
            Tast inn <strong className="text-viking-gold">{CODE_LENGTH}-bokstavskoden</strong> læreren viser på storskjermen.
            Dere spiller i sanntid sammen med klassen.
          </p>

          <input
            type="text"
            value={code}
            onChange={(e) => { setCode(normalizeGameCode(e.target.value)); if (error) setError(null); }}
            onKeyDown={(e) => { if (e.key === 'Enter') void submit(); }}
            placeholder="f.eks. RAVN"
            maxLength={CODE_LENGTH}
            autoFocus
            spellCheck={false}
            autoComplete="off"
            autoCapitalize="characters"
            inputMode="text"
            aria-label="Spillkode"
            className="w-full rounded-md border-2 border-viking-gold/60 bg-viking-darkblue/60 px-4 py-3 text-center font-mono text-2xl tracking-[0.4em] uppercase text-viking-paper placeholder:text-viking-paper/25 focus:border-viking-gold focus:outline-none"
          />

          {error && <p className="mt-3 font-inter text-sm text-viking-crimson" role="alert">{error}</p>}

          <button
            onClick={() => void submit()}
            disabled={checking}
            className="mt-4 w-full rounded-md border-2 border-viking-gold bg-viking-gold px-8 py-3 font-cinzel text-lg font-bold text-viking-darkblue transition-all hover:bg-viking-gold-soft disabled:opacity-50"
          >
            {checking ? 'Kobler til …' : 'Bli med i spillet'}
          </button>
        </section>

        {/* SEKUNDÆR: Øv alene (offline) — bevisst, eget kort, ikke en bortgjemt lenke */}
        <section className="rounded-lg border-2 border-viking-gold/30 bg-viking-darkblue/50 p-5">
          <div className="mb-2 flex items-center gap-2">
            <span className="text-2xl" aria-hidden>⚪</span>
            <h2 className="font-cinzel text-xl font-bold text-viking-gold-soft">Øv alene (offline)</h2>
          </div>
          <p className="mb-4 font-inter text-sm text-viking-paper/75">
            Spill på egen hånd uten kode. Ingen sanntid, ingen leaderboard, ingen lærergodkjenning — bare reisen.
            Velg dette hvis dere bare vil bli kjent med spillet.
          </p>
          <button
            onClick={onOffline}
            className="w-full rounded-md border-2 border-viking-gold-soft/60 px-8 py-3 font-cinzel text-base font-bold text-viking-gold-soft transition-colors hover:border-viking-gold hover:text-viking-gold"
          >
            Start offline-økt
          </button>
        </section>

        <div className="text-center">
          <button
            onClick={onSwitchRole}
            className="font-inter text-xs text-viking-gold-soft/60 hover:text-viking-gold-soft"
          >
            ← Bytt rolle
          </button>
        </div>
      </div>
    </div>
  );
}
