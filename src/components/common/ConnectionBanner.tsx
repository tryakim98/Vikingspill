/**
 * ConnectionBanner.tsx
 * Fast varsel-stripe øverst når kontakten med spillet er mistet (§13). Vises bare i
 * online-modus, og bare når vi faktisk har vært frakoblet en liten stund. Endringer
 * lagres lokalt i mellomtiden, så ingenting går tapt.
 */

import { useConnection } from '../../hooks/useConnection';
import Icon from '../decor/Icon';

export default function ConnectionBanner({ active }: { active: boolean }) {
  const connected = useConnection(active);
  if (!active || connected) return null;
  return (
    <div role="alert" className="fixed inset-x-0 top-0 z-[60] flex items-center justify-center gap-2 bg-viking-crimson px-4 py-2 text-center font-inter text-sm font-semibold text-viking-paper shadow-lg">
      <Icon name="warn" size={16} className="animate-pulse" />
      Mistet kontakt med spillet — prøver å koble til på nytt. Fremgangen lagres lokalt.
    </div>
  );
}
