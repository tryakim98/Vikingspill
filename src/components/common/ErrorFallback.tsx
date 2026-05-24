/**
 * ErrorFallback.tsx
 * Viking-tema feilskjerm for react-error-boundary (§13). Viser en vennlig melding og lar
 * brukeren prøve igjen (resetErrorBoundary) eller laste siden på nytt. Fremgang ligger i
 * localStorage/Firebase, så en reload mister ingenting.
 */

import type { FallbackProps } from 'react-error-boundary';

export default function ErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  const message = error instanceof Error ? error.message : String(error);
  return (
    <div role="alert" className="flex min-h-screen flex-col items-center justify-center gap-4 bg-viking-darkblue px-6 text-center text-viking-paper">
      <div className="text-6xl">⚓</div>
      <h1 className="font-cinzel text-3xl font-bold text-viking-gold">Skipet gikk på grunn</h1>
      <p className="max-w-md font-inter text-viking-paper/85">
        Noe uventet skjedde. Prøv igjen, eller last siden på nytt — fremgangen deres er lagret.
      </p>
      <pre className="max-w-md overflow-auto rounded bg-viking-surface/70 p-3 text-left font-mono text-xs text-viking-crimson/90">{message}</pre>
      <div className="flex flex-wrap justify-center gap-3">
        <button onClick={resetErrorBoundary} className="rounded-md border-2 border-viking-gold bg-viking-gold px-6 py-2.5 font-cinzel font-bold text-viking-darkblue hover:bg-viking-gold-soft">Prøv igjen</button>
        <button onClick={() => location.reload()} className="rounded-md border-2 border-viking-gold/50 px-6 py-2.5 font-cinzel text-viking-gold-soft hover:border-viking-gold">Last siden på nytt</button>
      </div>
    </div>
  );
}
