/**
 * crewRoles.ts
 * MANNSKAPSROLLER (§2.3) — hver elev velger én rolle ved innmelding. Rollene er
 * knyttet 1:1 til de fem disposisjonene (samme nøkkel = SkillKey), så «tatt rolle»
 * = «tatt disposisjon». Rollen gir INGEN odds-bonus — den lever i diskusjonen.
 *
 * `argues` er datastrukturen som den kommende rådslagnings-stemmen (§2.3 oppgave 3)
 * skal lese: hvordan rollen typisk argumenterer. Selve stemmene bygges IKKE her.
 */

import type { SkillKey } from '../types';

export interface CrewRole {
  /** Disposisjonen rollen er knyttet til (= nøkkelen i CREW_ROLES). */
  disposition: SkillKey;
  /** Visningsnavn. */
  title: string;
  /** Gjenbruker disposisjonens PNG-ikon (rører ikke public/). */
  icon: string;
  /** Kort beskrivelse av rollen. */
  blurb: string;
  /** Hvordan rollen argumenterer — forberedt for rådslagnings-stemmen. */
  argues: string;
}

export const CREW_ROLES: Record<SkillKey, CrewRole> = {
  krigskunst: {
    disposition: 'krigskunst',
    title: 'Kriger',
    icon: 'ikon-krigskunst',
    blurb: 'Skipets sverdarm. Tenker forsvar, styrke og handling.',
    argues: 'Møt trusler med fasthet; beskytt mannskapet; vis at vi ikke er svake.',
  },
  diplomati: {
    disposition: 'diplomati',
    title: 'Handelsmann',
    icon: 'ikon-diplomati',
    blurb: 'Forhandleren. Søker avtaler og gjensidig vinning.',
    argues: 'Finn det fredelige byttet; gaver og avtaler åpner dører makt stenger.',
  },
  sjømannskap: {
    disposition: 'sjømannskap',
    title: 'Navigatør',
    icon: 'ikon-sjomannskap',
    blurb: 'Styrmannen. Veier risiko mot trygg kurs.',
    argues: 'Tenk på vær, ruter og skipets sikkerhet; ikke ta unødig sjanse.',
  },
  språk: {
    disposition: 'språk',
    title: 'Skald/Tolk',
    icon: 'ikon-sprak',
    blurb: 'Stemmen. Forstår og oversetter de fremmede.',
    argues: 'Lytt og tolk før vi handler; ord kan løse det stål ikke kan.',
  },
  tro: {
    disposition: 'tro',
    title: 'Seer',
    icon: 'ikon-tro',
    blurb: 'Den vise. Tolker varsler, skikker og det hellige.',
    argues: 'Akt på tegnene og de fremmedes skikker; ære og tro veier tungt.',
  },
};

/** Rekkefølge for visning (samme som ferdighetstreet). */
export const CREW_ROLE_ORDER: SkillKey[] = ['krigskunst', 'diplomati', 'sjømannskap', 'språk', 'tro'];
