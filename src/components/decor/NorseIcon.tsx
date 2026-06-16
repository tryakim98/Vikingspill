/**
 * NorseIcon.tsx
 * Rendrer de håndtegnede norrøne PNG-ikonene fra public/ornamenter/ (ikon-*.png) som
 * monokrome glyfer. Ikonene er hvit strek på transparent bakgrunn; vi bruker dem som
 * CSS-maske og fyller med `currentColor`, slik at de tar fargen fra teksten rundt
 * (typisk bronse/bein — text-viking-gold-soft). Da matcher de paletten i stedet for å
 * være fargerike emoji, og kan skaleres fritt.
 *
 * Bruk: <NorseIcon name="ikon-sprak" size={16} className="text-viking-gold-soft" />
 */

import Icon from './Icon';

interface Props {
  name: string;          // filnavn uten .png, f.eks. 'ikon-sprak'
  size?: number;
  className?: string;
  title?: string;        // gir aria-label; ellers er ikonet dekorativt (aria-hidden)
}

export default function NorseIcon({ name, size = 18, className = '', title }: Props) {
  const url = `${import.meta.env.BASE_URL}ornamenter/${name}.png`;
  const mask = {
    WebkitMaskImage: `url("${url}")`, maskImage: `url("${url}")`,
    WebkitMaskRepeat: 'no-repeat', maskRepeat: 'no-repeat',
    WebkitMaskPosition: 'center', maskPosition: 'center',
    WebkitMaskSize: 'contain', maskSize: 'contain',
  } as const;
  return (
    <span
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      className={className}
      style={{
        display: 'inline-block', width: size, height: size,
        flexShrink: 0, verticalAlign: 'middle',
        backgroundColor: 'currentColor', ...mask,
      }}
    />
  );
}

/**
 * AutoIcon — velger riktig ikon-familie fra et navn lagret i data: navn som
 * starter med 'ikon-' rendres som PNG-glyf (NorseIcon), alt annet som SVG-strek-
 * glyf (Icon). Begge arver tekstfargen via currentColor. Brukes der datafelt
 * (skillTree/archetypes/fateCards/tradeGoods/wheelFields/firstTimeHints) før
 * holdt en emoji-streng.
 */
export function AutoIcon({ name, size = 18, className = '', title }: Props) {
  return name.startsWith('ikon-')
    ? <NorseIcon name={name} size={size} className={className} title={title} />
    : <Icon name={name} size={size} className={className} title={title} />;
}

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
