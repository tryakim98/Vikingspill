/**
 * Icon.tsx
 * Strektegnede, monokrome norrøne ikoner som erstatter de fargerike emojiene i
 * grensesnittet. Alt er tynne bronse-streker (currentColor, ingen fyll), så de
 * smelter inn i tre-og-bronse-uttrykket. To familier:
 *   - Runer hentet fra public/ornamenter/runer.svg (gjenskapt som path-data).
 *   - Enkle konseptglyfer (bok, mynt, skjold, vekt …) i samme stil.
 *
 * Bruk: <Icon name="fehu" /> — fargen arves fra text-fargen (sett f.eks.
 * className="text-viking-gold"). size i px.
 */

type RuneName = 'fehu' | 'uruz' | 'ansuz' | 'raidho' | 'sowilo' | 'tiwaz';
const RUNES: Record<RuneName, string> = {
  fehu:   'M0,0 V80 M0,8 L26,-6 M0,40 L26,26',
  uruz:   'M0,80 V6 L28,0 V80',
  ansuz:  'M0,0 V80 M0,6 L26,20 M0,38 L26,52',
  raidho: 'M0,80 V0 H18 a16,16 0 0 1 0,32 H0 M16,32 L30,80',
  sowilo: 'M22,0 L4,28 L24,46 L6,80',
  tiwaz:  'M14,80 V0 M14,10 L-2,28 M14,10 L30,28',
};

// Konseptglyfer i et 24×24-rutenett (fill=none, currentColor-stroke).
const GLYPHS: Record<string, string> = {
  // ressurser
  book:    'M12 6c-2.2-1.4-5-1.4-7.5 0v12c2.5-1.4 5.3-1.4 7.5 0 2.2-1.4 5-1.4 7.5 0V6c-2.5-1.4-5.3-1.4-7.5 0Z M12 6v12',
  coin:    'M12 3a9 9 0 100 18 9 9 0 000-18Z M12 7v10 M9 10h6 M9 14h6',
  tree:    'M12 21V9 M12 13l-4-3 M12 13l4-3 M12 9l-3.5-3 M12 9l3.5-3 M8 10l-2-2',
  // panel-overskrifter / handlinger
  scroll:  'M8 4h9v13a3 3 0 01-3 3H6 M8 4a2 2 0 00-2 2v0a2 2 0 002 2h2 M6 20a3 3 0 003-3V8 M11 9h4 M11 13h4',
  compass: 'M12 3a9 9 0 100 18 9 9 0 000-18Z M15 9l-2 5-4 1 2-5Z',
  target:  'M12 3a9 9 0 100 18 9 9 0 000-18Z M12 8a4 4 0 100 8 4 4 0 000-8Z M12 11.5a.5.5 0 100 1 .5.5 0 000-1Z',
  scales:  'M12 4v16 M6 20h12 M4 8h16 M4 8l-2.5 5a3 3 0 005 0Z M20 8l2.5 5a3 3 0 01-5 0Z M9 4h6',
  market:  'M4 20h16 M5 9h14 M4 9l8-5 8 5 M7 9v9 M12 9v9 M17 9v9',
  bridge:  'M3 15c4 0 5-5 9-5s5 5 9 5 M4 15v4 M20 15v4 M12 11v8',
  // status
  lock:    'M6 11h12v9H6Z M8 11V8a4 4 0 018 0v3',
  unlock:  'M6 11h12v9H6Z M8 11V7a4 4 0 017-2.7',
  shield:  'M12 3l7 3v5c0 5-3.5 8-7 9-3.5-1-7-4-7-9V6Z',
  axe:     'M14 3l-9 9 M14 3c3 0 5 2 5 5 0 2-1 3-3 3l-3-3c0-2 1-3 1-5Z M5 12l-2 6 6-2',
  eye:     'M2 12s4-6 10-6 10 6 10 6-4 6-10 6S2 12 2 12Z M12 9a3 3 0 100 6 3 3 0 000-6Z',
  window:  'M4 4h16v16H4Z M12 4v16 M4 12h16',
  die:     'M4 4h16v16H4Z M8 8h.01 M16 8h.01 M12 12h.01 M8 16h.01 M16 16h.01',
  chat:    'M4 5h16v10H9l-4 4V5Z',
  // varer (handelsvarer)
  pelt:    'M7 4c-2 3-3 6-2 9 1 2 3 4 7 7 4-3 6-5 7-7 1-3 0-6-2-9-2 2-4 2-5 0-1 2-3 2-5 0Z',
  anvil:   'M5 8h11c0 3-2 4-4 4h7 M9 12v3 M6 18h8l-1-3H7Z',
  amber:   'M12 3l6 6-6 12-6-12Z',
  thread:  'M12 3a9 9 0 100 18 9 9 0 000-18Z M8 10c3-2 5 4 8 2 M8 14c3-2 5 4 8 2',
  tusk:    'M17 5c0 7-3 12-9 14 0-3 1-5 2-7 M17 5c-2 0-4 1-5 3',
  spice:   'M12 21c4-3 6-6 6-10 0-3-2-5-6-8-4 3-6 5-6 8 0 4 2 7 6 10Z M12 6v15',
  salt:    'M12 4l7 4v8l-7 4-7-4V8Z M12 4v16 M5 8l14 8 M19 8L5 16',
  // diverse
  sail:    'M12 3v18 M12 5l7 12H12Z M12 9l-5 8h5 M4 21h16',
  wave:    'M2 10c2-2 4-2 6 0s4 2 6 0 4-2 6 0 M2 15c2-2 4-2 6 0s4 2 6 0 4-2 6 0',
  anchor:  'M12 7v13 M12 3a2 2 0 100 4 2 2 0 000-4Z M8 11H6c0 4 3 7 6 7s6-3 6-7h-2 M9 9h6',
  hand:    'M9 11V5a1.3 1.3 0 012.6 0v5 M11.6 10V4a1.3 1.3 0 012.6 0v6 M14.2 11V6a1.3 1.3 0 012.6 0v8c0 3-2 5-5 5s-4-1-5-3l-3-4a1.4 1.4 0 012-2l1.4 1.4',
  crate:   'M4 7l8-3 8 3v10l-8 3-8-3V7Z M4 7l8 3 8-3 M12 10v10',
  bolt:    'M13 3l-8 11h6l-2 7 9-12h-6Z',
  spark:   'M12 3v4 M12 17v4 M3 12h4 M17 12h4 M6 6l2 2 M16 16l2 2 M18 6l-2 2 M8 16l-2 2',
  // bygg & sted
  longhouse: 'M3 11l9-4 9 4 M5 10v9h14v-9 M10 19v-5h4v5',
  monitor:   'M3 5h18v11H3Z M9 20h6 M12 16v4',
  // heder
  trophy:    'M7 4h10v4a5 5 0 01-10 0Z M7 6H4v1a3 3 0 003 3 M17 6h3v1a3 3 0 01-3 3 M12 13v3 M10 16h4v4h-4Z M9 20h6',
  medal:     'M8 3l3 7 M16 3l-3 7 M12 10.5a5 5 0 100 10 5 5 0 000-10Z M12 13v3 M10.5 14.5h3',
  crown:     'M4 8l2.5 9h11L20 8l-4.5 3.5L12 5 7.5 11.5Z M6 19h12',
  // natur & vær
  leaf:      'M5 19c0-8 6-14 14-14 0 8-6 14-14 14Z M6 18C10 14 14 10 18 8',
  mist:      'M3 8c2-1.5 4-1.5 6 0s4 1.5 6 0 M5 13c2-1.5 4-1.5 6 0s4 1.5 6 0 M3 18c2-1.5 4-1.5 6 0s4 1.5 6 0',
  flame:     'M13 2c0 3 4 4 4 9a5 5 0 11-10 0c0-2 1-4 2-5 0 2 1 3 2 3 1-2-1-5 0-7Z',
  // skjebne / fare
  urn:       'M9 4h6 M10 4c-3 2-4 5-4 8s2 8 6 8 6-5 6-8-1-6-4-8 M7 9c-1 .5-1.5 1.5-1.5 3 M17 9c1 .5 1.5 1.5 1.5 3',
  skull:     'M5 11a7 7 0 1114 0c0 2-1 3-2 4v3h-2v-2h-2v2h-2v-2H9v2H7v-3c-1-1-2-2-2-4Z M9.5 11a1 1 0 10-.01 0Z M14.5 11a1 1 0 10-.01 0Z M11.5 13h1',
  chains:    'M5 9a3 3 0 013-3h1a3 3 0 010 6H8a3 3 0 01-3-3Z M19 15a3 3 0 01-3 3h-1a3 3 0 010-6h1a3 3 0 013 3Z M11 12h2',
  gift:      'M4 9h16v3H4Z M5 12h14v8H5Z M12 9v11 M12 9C10 5 7 6 8 8c.5 1 4 1 4 1 0 0 3.5 0 4-1 1-2-2-3-4 0',
  // dyr
  horse:     'M6 21c-1-6 1-10 5-13l-1-2 3 1c3 1 5 4 5 8v6 M6 21h10 M10 7c-1 1-2 1-3 2',
  raven:     'M4 10c0-3 3-5 6-5 2 0 3 1 4 2l5-1-3 3c0 4-3 6-6 6-3 0-6-2-6-5Z M16 8h.5 M9 16l1 4 M13 15l1 4',
  wolf:      'M5 5l2 4h10l2-4-1 7c0 4-3 6-6 6s-6-2-6-6Z M9.5 12h.01 M14.5 12h.01 M11 15h2l-1 1Z',
  dragonhead:'M5 20c0-5 3-7 3-11 0-2 2-3 4-2 1 1 1 2 0 3 2-1 4 0 4 2-1 0-2 1-2 2 2 0 3 1 3 3-2 0-3 1-4 3 M9 8h.5',
  dove:      'M21 6c-3 0-5 1-7 4-2 3-5 4-9 3 2 3 6 4 9 2 M14 9c1 2 0 4-2 5 M12 18l-1 3',
  horn:      'M20 7c-5-2-11 0-14 5-1 2 0 4 2 4 5 0 9-3 12-7 M20 7c1 1 1 2 0 3',
  // lærerverktøy
  folder:    'M3 6h6l2 2h11v11H3Z',
  inbox:     'M4 14h4l1 2h6l1-2h4 M5 14V5h14v9 M12 5v6 M9 8l3 3 3-3',
  outbox:    'M4 14h4l1 2h6l1-2h4 M5 14V5h14v9 M12 11V5 M9 8l3-3 3 3',
  save:      'M4 4h13l3 3v13H4Z M8 4v5h6V4 M7 13h10v7H7Z',
  download:  'M12 3v12 M7 11l5 5 5-5 M5 20h14',
  trash:     'M5 7h14 M9 7V5h6v2 M6 7l1 13h10l1-13 M10 10v7 M14 10v7',
  people:    'M9 5.5a2.5 2.5 0 100 5 2.5 2.5 0 000-5Z M4 20c0-3 2-5 5-5s5 2 5 5 M16 7a2 2 0 100 4 2 2 0 000-4Z M15 15c3-1 6 1 6 5',
  // kontroll
  gear:      'M12 9a3 3 0 100 6 3 3 0 000-6Z M12 3v3 M12 18v3 M3 12h3 M18 12h3 M5.6 5.6l2.1 2.1 M16.3 16.3l2.1 2.1 M18.4 5.6l-2.1 2.1 M5.6 18.4l2.1-2.1',
  pause:     'M9 5v14 M15 5v14',
  hourglass: 'M6 3h12 M6 21h12 M6 3c0 5 6 6 6 9 0-3 6-4 6-9 M6 21c0-5 6-6 6-9 0 3 6 4 6 9',
  'horn-muted':'M20 7c-5-2-11 0-14 5-1 2 0 4 2 4 5 0 9-3 12-7 M20 7c1 1 1 2 0 3 M4 21L21 4',
  warn:        'M12 3L2 20h20Z M12 9v5 M12 17h.01',
  camera:      'M4 8h3l1.5-2h7L17 8h3v11H4Z M12 11a3 3 0 100 6 3 3 0 000-6Z',
  mic:         'M12 4a3 3 0 013 3v5a3 3 0 01-6 0V7a3 3 0 013-3Z M7 11a5 5 0 0010 0 M12 16v4 M9 20h6',
};

const isRune = (n: string): n is RuneName => n in RUNES;

export default function Icon({
  name, size = 18, strokeWidth, className = '', title,
}: { name: RuneName | keyof typeof GLYPHS | string; size?: number; strokeWidth?: number; className?: string; title?: string }) {
  const common = {
    width: size, height: size, fill: 'none', stroke: 'currentColor',
    strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const,
    className, role: title ? 'img' as const : undefined, 'aria-hidden': title ? undefined : true,
  };
  if (isRune(name)) {
    return (
      <svg viewBox="-30 -12 104 104" strokeWidth={strokeWidth ?? 8} {...common}>
        {title && <title>{title}</title>}
        <path d={RUNES[name]} />
      </svg>
    );
  }
  const d = GLYPHS[name] ?? GLYPHS.scroll;
  return (
    <svg viewBox="0 0 24 24" strokeWidth={strokeWidth ?? 1.7} {...common}>
      {title && <title>{title}</title>}
      <path d={d} />
    </svg>
  );
}

/** Ferdighet → ikon. Brukes der ferdighetenes emoji sto. */
export const SKILL_ICON: Record<string, string> = {
  språk: 'ansuz', sjømannskap: 'raidho', krigskunst: 'uruz', diplomati: 'tiwaz', tro: 'tree',
};
/** Handelsvare → ikon. */
export const GOODS_ICON: Record<string, string> = {
  pelsverk: 'pelt', solv: 'coin', jern: 'anvil', rav: 'amber',
  silke: 'thread', hvalrosstann: 'tusk', krydder: 'spice', salt: 'salt',
};
