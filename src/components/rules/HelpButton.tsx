/**
 * HelpButton.tsx
 * Liten flytende «?»-knapp som åpner regelsiden igjen. Plasseres i hjørnet av lærer-
 * og elev-flatene. Stil holder seg innenfor viking-paletten.
 */

import NorseIcon from '../decor/NorseIcon';

interface Props {
  onClick: () => void;
  className?: string;
}

export default function HelpButton({ onClick, className = '' }: Props) {
  return (
    <button
      onClick={onClick}
      aria-label="Åpne regler"
      data-testid="open-rules"
      className={`flex h-10 w-10 items-center justify-center rounded-full border-2 border-viking-gold/60 bg-viking-surface text-viking-gold-soft transition-colors hover:border-viking-gold hover:text-viking-gold ${className}`}
    >
      <NorseIcon name="ikon-hjelp" size={20} />
    </button>
  );
}
