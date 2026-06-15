/**
 * SvennepoverPanel.tsx
 * Fast «Prøver»-panel som alltid er synlig i dashbordet. Lister alle
 * tilgjengelige svenneprøver, hva hver av dem låser opp, og status. Slik
 * blir funksjonen ikke glemt — gruppene kan starte en prøve direkte herfra.
 *
 * Bygger på samme høvding-system: bare høvdingen kan trykke; medlemmene ser
 * med via synket tilstand.
 */

import type { Destination, SkillKey } from '../../types';
import { SIDE_UNLOCKS } from '../../data/routes';
import { skillTreeData } from '../../data/skillTree';
import NorseIcon, { SKILL_PNG } from '../decor/NorseIcon';

interface Props {
  destinations: Destination[];
  unlockedSides: string[];
  isChief: boolean;
  onStartSvenneprove: (destId: string, skill: SkillKey) => void;
}

interface Row {
  destId: string;
  destName: string;
  skill: SkillKey;
  passed: boolean;
}

export default function SvennepoverPanel({ destinations, unlockedSides, isChief, onStartSvenneprove }: Props) {
  const destById = Object.fromEntries(destinations.map((d) => [d.id, d]));
  const rows: Row[] = Object.entries(SIDE_UNLOCKS).flatMap(([destId, reqs]) => {
    const svenne = reqs.find((r) => r.type === 'svenneprove');
    if (!svenne || svenne.type !== 'svenneprove') return [];
    const dest = destById[destId];
    if (!dest) return [];
    return [{
      destId,
      destName: dest.name,
      skill: svenne.skill,
      passed: unlockedSides.includes(destId),
    }];
  });
  if (rows.length === 0) return null;

  const passedCount = rows.filter((r) => r.passed).length;

  return (
    <div className="viking-frame mb-4 bg-viking-darkblue/40 p-3" data-testid="svenneprover-panel">
      <div className="mb-2 flex items-baseline justify-between">
        <h3 className="inline-flex items-center gap-2 font-saga text-lg text-viking-gold"><NorseIcon name="ikon-svenneprove" size={16} /> Svenneprøver</h3>
        <p className="font-mono text-[10px] text-viking-gold-soft/80">{passedCount}/{rows.length} bestått</p>
      </div>
      <p className="mb-2 font-inter text-[11px] italic text-viking-gold-soft/75">
        Hver svenneprøve låser opp et sidested. Du trenger ikke ta dem — bare hvis dere vil dit.
      </p>
      <ul className="space-y-1.5">
        {rows.map((r) => {
          const branch = skillTreeData[r.skill];
          return (
            <li
              key={r.destId}
              data-testid={`svenneprove-row-${r.destId}`}
              className={`flex flex-wrap items-center gap-2 rounded-md border px-2.5 py-1.5 text-xs ${
                r.passed ? 'border-viking-moss/50 bg-viking-moss/10' : 'border-viking-gold/30 bg-viking-surface/40'
              }`}
            >
              <NorseIcon name={SKILL_PNG[r.skill]} size={18} className="text-viking-gold-soft" />
              <div className="flex-1">
                <p className="font-cinzel text-sm text-viking-paper">
                  Svenneprøve i <strong className="text-viking-gold">{branch.name}</strong>
                </p>
                <p className="font-inter text-[10.5px] text-viking-gold-soft/80">
                  Låser opp: <strong>{r.destName}</strong>
                </p>
              </div>
              {r.passed ? (
                <span className="rounded-full bg-viking-moss/30 px-2 py-0.5 font-cinzel text-[10px] text-viking-moss" data-testid={`svenneprove-status-${r.destId}`}>
                  ✓ Bestått
                </span>
              ) : isChief ? (
                <button
                  onClick={() => onStartSvenneprove(r.destId, r.skill)}
                  data-testid={`take-from-panel-${r.destId}`}
                  className="rounded border-2 border-viking-gold bg-viking-gold/20 px-3 py-1 font-cinzel text-[11px] font-bold text-viking-gold transition hover:bg-viking-gold hover:text-viking-darkblue"
                >
                  Ta prøven →
                </button>
              ) : (
                <span className="font-cinzel text-[10px] italic text-viking-gold-soft/60" data-testid={`svenneprove-status-${r.destId}`}>
                  Ikke tatt
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
