/**
 * TeacherLanding.tsx
 * Lærerens startskjerm før et spill er aktivt (§ lagre/gjenoppta). Tre veier:
 *   1) Slipp en ny flåte        — opprett et helt nytt spill med ny kode.
 *   2) Fortsett et tidligere spill — skriv inn koden, eller velg fra lista over spill
 *      denne enheten har sett før. Spillet ligger trygt i Firebase under koden.
 *   3) Gjenopprett fra fil      — hvis Firebase-data er borte: last opp en sikkerhetskopi.
 *
 * Selve opprettelsen og Firebase-kallene gjøres av TeacherPanel; her samler vi valgene.
 */

import { useRef, useState } from 'react';
import { gameExists } from '../../lib/gameSync';
import { normalizeGameCode, isValidGameCode, CODE_LENGTH } from '../../lib/gameCode';
import { listTeacherGames, forgetTeacherGame, type TeacherGame } from '../../lib/teacherGames';
import { parseBackup } from '../../lib/gameBackup';
import { ThorHammer, RuneDivider } from '../decor';

interface Props {
  creating: boolean;
  createError: boolean;
  onCreateNew: () => void;
  onResume: (code: string) => void;
  onRestore: (code: string, data: unknown) => Promise<void>;
  onSwitchRole: () => void;
}

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const min = Math.round(diff / 60000);
  if (min < 1) return 'akkurat nå';
  if (min < 60) return `for ${min} min siden`;
  const hours = Math.round(min / 60);
  if (hours < 24) return `for ${hours} t siden`;
  const days = Math.round(hours / 24);
  if (days === 1) return 'i går';
  if (days < 30) return `for ${days} dager siden`;
  return new Date(ts).toLocaleDateString('no-NO', { day: 'numeric', month: 'short' });
}

export default function TeacherLanding({ creating, createError, onCreateNew, onResume, onRestore, onSwitchRole }: Props) {
  const [recent, setRecent] = useState<TeacherGame[]>(() => listTeacherGames());
  const [resumeInput, setResumeInput] = useState('');
  const [resumeChecking, setResumeChecking] = useState(false);
  const [resumeError, setResumeError] = useState<string | null>(null);
  const [restoreBusy, setRestoreBusy] = useState(false);
  const [restoreError, setRestoreError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const tryResume = async (raw: string) => {
    const c = normalizeGameCode(raw);
    if (!isValidGameCode(c)) {
      setResumeError(`Koden er ${CODE_LENGTH} bokstaver (uten I og O).`);
      return;
    }
    setResumeChecking(true);
    setResumeError(null);
    try {
      if (await gameExists(c)) {
        onResume(c);
      } else {
        setResumeError('Fant ikke et spill med denne koden. Er det riktig kode? Hvis Firebase-data er slettet, gjenopprett fra en sikkerhetskopi-fil i stedet.');
      }
    } catch {
      setResumeError('Får ikke kontakt med Bifrost (Firebase). Sjekk nettet og prøv igjen.');
    } finally {
      setResumeChecking(false);
    }
  };

  const forget = (code: string) => {
    forgetTeacherGame(code);
    setRecent(listTeacherGames());
  };

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // tillat opplasting av samme fil igjen
    if (!file) return;
    setRestoreBusy(true);
    setRestoreError(null);
    try {
      const text = await file.text();
      const parsed = parseBackup(text);
      if (!parsed.ok) { setRestoreError(parsed.error); return; }
      await onRestore(parsed.backup.code, parsed.backup.data);
    } catch {
      setRestoreError('Klarte ikke å lese filen. Prøv igjen.');
    } finally {
      setRestoreBusy(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-viking-darkblue p-6 text-viking-paper">
      <div className="mx-auto max-w-4xl">
        <div className="mb-2 flex items-center justify-center gap-4">
          <ThorHammer size={42} color="#9C8138" />
          <h1 className="font-saga text-4xl viking-engraved-large md:text-5xl">Tors utsyn over Midgard</h1>
          <ThorHammer size={42} color="#9C8138" />
        </div>
        <RuneDivider className="mb-6 mx-auto max-w-md" />
        <p className="mb-8 text-center font-inter italic text-viking-gold-soft">Fra Åsgard ser tordenguden ut over flåten — storskjerm for hele klassen</p>

        {/* 1) Nytt spill */}
        <div className="rounded-lg border-2 border-viking-gold bg-viking-surface p-8 text-center">
          <h2 className="mb-3 font-cinzel text-2xl text-viking-gold">Slipp en ny flåte på sjøen</h2>
          <p className="mb-6 font-inter text-viking-paper/85">Du får et runeord vikingene taster inn for å bli sett av deg.</p>
          <button
            onClick={onCreateNew}
            disabled={creating}
            data-testid="create-new-game"
            className="rounded-md border-2 border-viking-gold bg-viking-gold px-10 py-3 font-saga text-lg font-bold text-viking-darkblue hover:bg-viking-gold-soft disabled:cursor-wait disabled:opacity-60"
          >
            {creating ? 'Reiser Åsgards porter …' : 'Åpne Åsgards porter ⚡'}
          </button>
          {createError && (
            <p className="mt-5 rounded-md border-2 border-viking-crimson bg-viking-crimson/15 p-3 font-inter text-sm text-viking-paper">
              Bifrost svarer ikke — broen mellom Åsgard og Midgard er tåkete. Sjekk nettet og prøv igjen.
            </p>
          )}
        </div>

        {/* 2) Fortsett tidligere spill */}
        <div className="mt-6 rounded-lg border-2 border-viking-gold/50 bg-viking-surface/70 p-6" data-testid="resume-panel">
          <h2 className="mb-1 font-cinzel text-xl text-viking-gold">Fortsett et tidligere spill</h2>
          <p className="mb-4 font-inter text-sm text-viking-paper/80">
            Et spill forsvinner ikke når du lukker fanen — det ligger trygt under runeordet. Skriv inn koden for å
            gjenoppta nøyaktig der klassen slapp, på en hvilken som helst enhet.
          </p>

          <div className="flex flex-wrap items-start gap-3">
            <input
              type="text"
              value={resumeInput}
              onChange={(e) => { setResumeInput(normalizeGameCode(e.target.value)); if (resumeError) setResumeError(null); }}
              onKeyDown={(e) => { if (e.key === 'Enter') void tryResume(resumeInput); }}
              placeholder="f.eks. RAVN"
              maxLength={CODE_LENGTH}
              spellCheck={false}
              autoComplete="off"
              autoCapitalize="characters"
              aria-label="Spillkode for å gjenoppta"
              data-testid="resume-code-input"
              className="w-40 rounded-md border-2 border-viking-gold/60 bg-viking-darkblue/60 px-4 py-2.5 text-center font-mono text-2xl tracking-[0.3em] uppercase text-viking-paper placeholder:text-viking-paper/25 focus:border-viking-gold focus:outline-none"
            />
            <button
              onClick={() => void tryResume(resumeInput)}
              disabled={resumeChecking}
              data-testid="resume-code-button"
              className="rounded-md border-2 border-viking-gold bg-viking-gold/20 px-6 py-2.5 font-cinzel font-bold text-viking-gold hover:bg-viking-gold/40 disabled:opacity-50"
            >
              {resumeChecking ? 'Søker …' : 'Gjenoppta ⚓'}
            </button>
          </div>
          {resumeError && (
            <p className="mt-3 rounded-md border-2 border-viking-crimson/60 bg-viking-crimson/15 p-2.5 font-inter text-sm text-viking-paper" role="alert">
              {resumeError}
            </p>
          )}

          {/* Liste over spill denne enheten har sett */}
          {recent.length > 0 && (
            <div className="mt-5 border-t border-viking-gold/20 pt-4" data-testid="recent-games">
              <p className="mb-2 font-cinzel text-sm text-viking-gold-soft">Spill fra denne enheten</p>
              <ul className="space-y-2">
                {recent.map((g) => (
                  <li key={g.code} className="flex items-center gap-3 rounded-md border border-viking-gold/30 bg-viking-darkblue/40 p-2.5">
                    <span className="font-mono text-2xl font-bold tracking-[0.15em] text-viking-gold">{g.code}</span>
                    <span className="flex-1 font-inter text-xs text-viking-gold-soft/80">sist åpnet {timeAgo(g.lastSeenAt)}</span>
                    <button
                      onClick={() => onResume(g.code)}
                      data-testid={`resume-recent-${g.code}`}
                      className="rounded border-2 border-viking-gold/60 px-3 py-1 font-cinzel text-sm text-viking-gold-soft hover:border-viking-gold hover:text-viking-gold"
                    >
                      Gjenoppta
                    </button>
                    <button
                      onClick={() => forget(g.code)}
                      aria-label={`Fjern ${g.code} fra lista`}
                      title="Fjern fra lista (sletter ikke spillet)"
                      className="rounded px-2 py-1 font-mono text-xs text-viking-paper/40 hover:text-viking-crimson"
                    >
                      ✕
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* 3) Gjenopprett fra sikkerhetskopi-fil */}
        <div className="mt-6 rounded-lg border-2 border-viking-rust/50 bg-viking-rust/10 p-6">
          <h2 className="mb-1 font-cinzel text-xl text-viking-gold">Gjenopprett fra sikkerhetskopi</h2>
          <p className="mb-4 font-inter text-sm text-viking-paper/80">
            Mistet kontakten med et spill, eller ble dataene slettet? Last opp en sikkerhetskopi-fil
            (lastet ned fra konsollen mens spillet pågikk) for å vekke hele spillet til live igjen.
          </p>
          <input ref={fileRef} type="file" accept="application/json,.json" onChange={onFile} className="hidden" data-testid="restore-file-input" />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={restoreBusy}
            data-testid="restore-file-button"
            className="rounded-md border-2 border-viking-rust bg-viking-rust/30 px-6 py-2.5 font-cinzel font-bold text-viking-paper hover:bg-viking-rust/50 disabled:opacity-50"
          >
            {restoreBusy ? 'Gjenoppliver …' : '📂 Velg sikkerhetskopi-fil'}
          </button>
          {restoreError && (
            <p className="mt-3 rounded-md border-2 border-viking-crimson/60 bg-viking-crimson/15 p-2.5 font-inter text-sm text-viking-paper" role="alert">
              {restoreError}
            </p>
          )}
        </div>

        <button onClick={onSwitchRole} className="mt-6 rounded border-2 border-viking-gold/50 px-5 py-2 font-cinzel text-viking-gold-soft hover:border-viking-gold">Bytt rolle</button>
      </div>
    </div>
  );
}
