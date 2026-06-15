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
