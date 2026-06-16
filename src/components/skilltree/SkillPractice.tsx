/**
 * SkillPractice.tsx
 * DEL 2 av svenneprøven (§3.2): en ferdighetsspesifikk, AKTIV oppgave som må
 * fullføres for å heve ferdigheten — i tillegg til quizen (DEL 1).
 *
 * Modulært: hver ferdighet har én oppføring i SKILL_PRACTICE. To typer i dag, lett
 * å utvide med flere:
 *   - 'confirm'  → kort instruksjon på skjerm + høvding/lærer-bekreftelse (de fysiske:
 *                  runer, knute/rytme, forhandling, tyding av varsel).
 *   - 'holmgang' → gjenbruker HolmgangMiniGame (krigskunst).
 *
 * Legg til en ny praksis ved å føre opp ferdigheten i SKILL_PRACTICE; nye TYPER
 * legges til i switch-en nederst.
 */

import type { SkillKey } from '../../types';
import MaterialPanel from '../decor/MaterialPanel';
import { AutoIcon } from '../decor/NorseIcon';
import HolmgangMiniGame from '../duel/HolmgangMiniGame';

type PracticeKind = 'confirm' | 'holmgang';

interface Practice {
  kind: PracticeKind;
  title: string;
  instruction: string;
  /** Kun for kind === 'holmgang': hvilken mini-duell som spilles. */
  holmgangKind?: 'tapping' | 'reaksjon' | 'regning';
}

export const SKILL_PRACTICE: Record<SkillKey, Practice> = {
  språk: {
    kind: 'confirm',
    title: 'Rist runer',
    instruction:
      'Rist en kort melding i runer (ekte futhark) på papir — eller tyd runemeldingen læreren viser. Legg fram tydningen og bekreft med høvding/lærer.',
  },
  sjømannskap: {
    kind: 'confirm',
    title: 'Knute & rytme',
    instruction:
      'Knute-stafett: knyt en sjømannsknute (f.eks. pålestek) på tid — eller hold en jevn ro-/styre-rytme ved å tæppe takten sammen i gruppa. Vis det til høvding/lærer og bekreft.',
  },
  krigskunst: {
    kind: 'holmgang',
    title: 'Holmgang',
    instruction: 'Stå holmgang — en rask tvekamp på skjermen avgjør prøven.',
    holmgangKind: 'tapping',
  },
  diplomati: {
    kind: 'confirm',
    title: 'Forhandling',
    instruction:
      'Forhandle ansikt-til-ansikt mot en annen gruppe om en ekte avtale (bytte, allianse eller fred). Når dere har en avtale begge er enige om, bekreft med høvding/lærer.',
  },
  tro: {
    kind: 'confirm',
    title: 'Tyd varselet',
    instruction:
      'To ravner setter seg på masten idet dere legger ut — Odins velsignelse, eller en advarsel om å snu? Tolk varselet fra minst to sider, legg fram tydningen, og bekreft med høvding/lærer.',
  },
};

interface Props {
  skill: SkillKey;
  isChief: boolean;
  onDone: () => void;
}

function ChiefWait() {
  return (
    <p className="mt-6 inline-flex w-full items-center justify-center gap-1.5 text-center font-cinzel text-viking-gold-soft">
      <AutoIcon name="anchor" size={16} /> Høvdingen fullfører praksisdelen — dere ser med
    </p>
  );
}

export default function SkillPractice({ skill, isChief, onDone }: Props) {
  const p = SKILL_PRACTICE[skill];
  return (
    <div data-testid="skill-practice">
      <p className="mb-2 font-cinzel text-2xl text-viking-gold">Quiz bestått — praksisdel (DEL 2)</p>
      <p className="mb-5 font-inter text-viking-paper/90">For å heve ferdigheten må dere fullføre den praktiske prøven:</p>
      <MaterialPanel material="jern" framed className="p-5">
        <p className="mb-1 font-cinzel text-sm text-viking-gold-soft">Praksis — {p.title}</p>
        <p className="font-inter text-viking-paper">{p.instruction}</p>
      </MaterialPanel>

      {p.kind === 'holmgang' ? (
        <div className="mt-6">
          {isChief ? (
            <MaterialPanel material="jern" className="p-5">
              <HolmgangMiniGame kind={p.holmgangKind ?? 'tapping'} onDone={() => onDone()} />
            </MaterialPanel>
          ) : (
            <ChiefWait />
          )}
        </div>
      ) : isChief ? (
        <div className="mt-7">
          <button
            onClick={onDone}
            data-testid="practice-confirm"
            className="rounded-md border-2 border-viking-gold bg-viking-gold px-7 py-2.5 font-saga font-bold text-viking-darkblue hover:bg-viking-gold-soft"
          >
            Bekreft gjennomført ✓
          </button>
        </div>
      ) : (
        <ChiefWait />
      )}
    </div>
  );
}
