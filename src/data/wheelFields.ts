/**
 * SKJEBNEHJULET — feltene på lærerens skjebnehjul
 *
 * Læreren spinner; hjulet velger. Felt-id-en avgjør hvilket eksisterende
 * event-system som utløses (trial, fate, ragnarok eller broadcast-skjebnemøte).
 * Læreren bestemmer KUN når (§3.4/§8.5) — alt annet er tilfeldig.
 */

export type WheelFieldId =
  | 'gudenes-prove'
  | 'storm'
  | 'gunstig-vind'
  | 'ragnarok'
  | 'gudenes-gave'
  | 'skjebnemote';

export interface WheelField {
  id: WheelFieldId;
  icon: string;
  label: string;
  /** Brukes inni sektoren — må være kort. */
  shortLabel: string;
  color: string;
  description: string;
}

export const WHEEL_FIELDS: WheelField[] = [
  {
    id: 'gudenes-prove',
    icon: '⚡',
    label: 'Gudenes prøve',
    shortLabel: 'Prøve',
    color: '#6B3FA0', // plum
    description: 'Felles utfordring — Tor måler alle skip mot hverandre.',
  },
  {
    id: 'storm',
    icon: '🌊',
    label: 'Storm',
    shortLabel: 'Storm',
    color: '#2B6B6B', // teal
    description: 'Uvær rammer ett tilfeldig skip.',
  },
  {
    id: 'gunstig-vind',
    icon: '🍃',
    label: 'Gunstig vind',
    shortLabel: 'Vind',
    color: '#5B7553', // moss
    description: 'Njord sender medvind til det skipet som ligger bakerst.',
  },
  {
    id: 'ragnarok',
    icon: '⚰️',
    label: 'Ragnarok',
    shortLabel: 'Ragnarok',
    color: '#8B2929', // crimson
    description: 'Tors vrede — alle mister halve handelspoeng. Avstanden lukkes.',
  },
  {
    id: 'gudenes-gave',
    icon: '🎁',
    label: 'Gudenes gave',
    shortLabel: 'Gave',
    color: '#A07F32', // dempet brass (gudegave — sjelden gull-aksent)
    description: 'En av flåten får en uventet velsignelse.',
  },
  {
    id: 'skjebnemote',
    icon: '🌫️',
    label: 'Skjebnemøte',
    shortLabel: 'Skjebne',
    color: '#A0522D', // rust
    description: 'Alle skip møter et skjebnemøte ved neste seilas.',
  },
];

/** Pooler for trekk fra fateCards. */
export const STORM_FATE_IDS = ['storm', 'grunnstoting', 'plyndret', 'gissel', 'pest', 'munk-uten-tolk'];
export const GAVE_FATE_IDS  = ['handelsmann', 'odins-ravner', 'mjodfest'];
export const VIND_FATE_ID   = 'gunstig-vind';
