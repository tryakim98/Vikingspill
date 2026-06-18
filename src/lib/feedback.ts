/**
 * feedback.ts
 * Enspiller-tilbakemelding (additivt, frittstående — ingen kobling til spill-state).
 *
 * To skrivemål ved Send:
 *   1) ALLTID localStorage (`vikingspill_feedback`, append til array) — mister aldri noe.
 *   2) Fire-and-forget til en EGEN Firebase-node (`feedback/…`), pakket i try/catch:
 *      feiler den (offline / regler), svelges den stille. Ingen read, ingen sync,
 *      ingen avhengighet for selve spillet.
 *
 * Skjerm-konteksten («hvor er eleven») rapporteres av skjermene via reportFeedbackScreen
 * og leses ved Send via currentFeedbackScreen — en enkel modul-singleton, ingen React-state.
 */

import { ref, push } from 'firebase/database';
import { db } from './firebase';

export type FeedbackCategory = 'bug' | 'forvirrende' | 'forslag' | 'likte';
export type FeedbackScreenName = 'dashboard' | 'kart' | 'oppsett' | 'encounter' | 'saga' | 'seremoni';

export interface ScreenContext {
  /** Grov skjerm eleven er på. */
  screen: FeedbackScreenName;
  /** EncounterFlow-Step-navnet når screen === 'encounter'. */
  step?: string;
  /** Aktiv havn (navn) hvis noen. */
  destinasjon?: string;
}

// Modul-singleton: skjermene rapporterer HVOR eleven er; knappen leser ved Send.
let _ctx: ScreenContext = { screen: 'dashboard' };

/** Skjermene kaller denne (i en useEffect) når de monteres / skifter steg. */
export function reportFeedbackScreen(ctx: ScreenContext): void {
  _ctx = ctx;
}

/** Knappen leser denne ved Send for å feste kontekst til posten. */
export function currentFeedbackScreen(): ScreenContext {
  return { ..._ctx };
}

const LS_KEY = 'vikingspill_feedback';
const SID_KEY = 'vikingspill_feedback_sid';
const OKT_KEY = 'vikingspill_feedback_okt';

/**
 * Valgfritt øktmerke fra URL-en (?okt=XXXX) — bare en etikett (f.eks. klasse/økt) så
 * svar kan sorteres. IKKE en spillkode, gjør INGENTING online. Fanges fra URL og
 * persisteres lokalt, så den henger med resten av økten selv om eleven navigerer videre.
 * Mangler den: tom streng (alt fungerer som før).
 */
function feedbackOkt(): string {
  try {
    const fromUrl = new URLSearchParams(window.location.search).get('okt');
    if (fromUrl && fromUrl.trim()) {
      const clean = fromUrl.trim().slice(0, 40);
      localStorage.setItem(OKT_KEY, clean);
      return clean;
    }
    return localStorage.getItem(OKT_KEY) || '';
  } catch {
    return '';
  }
}

/**
 * Fang ?okt FØR ruteren rekker å redirecte (som stripper query-strengen). Kalles én
 * gang fra main.tsx ved oppstart. Uten dette ville okt være borte fra URL-en når en
 * elev faktisk sender en post fra en undersides-rute (/student).
 */
export function captureFeedbackOkt(): void {
  feedbackOkt();
}

/**
 * Tilfeldig, anonym sesjons-id så samme elevs poster grupperes. Ingen personinfo —
 * bare et slumptall lagret lokalt, gjenbrukt på tvers av poster i samme nettleser.
 */
function sessionId(): string {
  try {
    let sid = localStorage.getItem(SID_KEY);
    if (!sid) {
      sid = 's-' + Math.random().toString(36).slice(2, 10);
      localStorage.setItem(SID_KEY, sid);
    }
    return sid;
  } catch {
    return 's-ukjent';
  }
}

export interface FeedbackPost {
  tidspunkt: number;
  tidspunktISO: string;
  skjerm: FeedbackScreenName;
  steg?: string;
  destinasjon?: string;
  rolle?: string;
  kategori: FeedbackCategory;
  kommentar: string;
  sesjonsId: string;
  /** Valgfritt øktmerke fra ?okt=XXXX (klasse/økt-etikett). Tom streng hvis ikke satt. */
  okt: string;
}

export function getStoredFeedback(): FeedbackPost[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

/** Pretty JSON av hele den lokale arrayen — for utvikler-eksport. */
export function exportFeedbackJson(): string {
  return JSON.stringify(getStoredFeedback(), null, 2);
}

/**
 * Bygg posten med automatisk kontekst, skriv lokalt (alltid) og send fire-and-forget
 * til Firebase. Returnerer posten som ble lagret lokalt. Kaster ALDRI — UI får alltid
 * vise «takk», og posten ligger trygt i localStorage uansett nettverksutfall.
 */
export function submitFeedback(input: {
  kategori: FeedbackCategory;
  kommentar: string;
  rolle?: string;
}): FeedbackPost {
  const ctx = currentFeedbackScreen();
  const now = Date.now();
  const post: FeedbackPost = {
    tidspunkt: now,
    tidspunktISO: new Date(now).toISOString(),
    skjerm: ctx.screen,
    steg: ctx.step,
    destinasjon: ctx.destinasjon,
    rolle: input.rolle,
    kategori: input.kategori,
    kommentar: input.kommentar.trim(),
    sesjonsId: sessionId(),
    okt: feedbackOkt(),
  };

  // 1) ALLTID localStorage — mister aldri noe.
  try {
    const arr = getStoredFeedback();
    arr.push(post);
    localStorage.setItem(LS_KEY, JSON.stringify(arr));
  } catch {
    /* full eller utilgjengelig localStorage — svelg stille */
  }

  // 2) Fire-and-forget til EGEN feedback-node (IKKE i spill-state/session).
  //    Feiler den (offline / regler), svelges den stille — blokkerer aldri UI.
  //    Firebase SDK KASTER på undefined-verdier, så valgfrie felt (steg/destinasjon/
  //    rolle) som er undefined må fjernes — ellers kastes hele skrivet og posten når
  //    aldri Firebase (kun localStorage). Strip undefined før push.
  try {
    const payload = Object.fromEntries(Object.entries(post).filter(([, v]) => v !== undefined));
    push(ref(db, 'feedback'), payload)?.catch?.(() => {});
  } catch {
    /* firebase utilgjengelig — posten ligger trygt lokalt */
  }

  return post;
}
