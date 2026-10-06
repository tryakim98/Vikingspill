/** Ferdighet → ikon. Brukes der ferdighetenes emoji sto. */
export const SKILL_ICON: Record<string, string> = {
  språk: 'ansuz', sjømannskap: 'raidho', krigskunst: 'uruz', diplomati: 'tiwaz', tro: 'tree',
};
/** Handelsvare → ikon. */
export const GOODS_ICON: Record<string, string> = {
  pelsverk: 'pelt', solv: 'coin', jern: 'anvil', rav: 'amber',
  silke: 'thread', hvalrosstann: 'tusk', krydder: 'spice', salt: 'salt',
};

/** Ferdighet → norrønt ikon (PNG). */
export const SKILL_PNG: Record<string, string> = {
  språk: 'ikon-sprak',
  sjømannskap: 'ikon-sjomannskap',
  krigskunst: 'ikon-krigskunst',
  diplomati: 'ikon-diplomati',
  tro: 'ikon-tro',
};

/** Handelsvare → norrønt ikon (PNG). Bare varene vi har egne motiv for; resten
 *  faller tilbake på SVG-glyfene i Icon.tsx. */
export const GOODS_PNG: Record<string, string> = {
  pelsverk: 'ikon-pelsverk',
  hvalrosstann: 'ikon-hvalrosstann',
};

/** Generelt handelsvare-ikon der én samle-glyf trengs. */
export const TRADE_PNG = 'ikon-hvalrosstann';
