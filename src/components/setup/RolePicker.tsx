/**
 * RolePicker.tsx
 * Felles rollevelger (§2.3). Viser de fem mannskapsrollene som kort. Roller som
 * allerede er tatt i mannskapet (`taken`) gråes ut og kan ikke velges — slik får
 * hvert mannskap et bredt sett. Gjenbrukes både i SetupFlow (chief/solo) og som
 * egen innmeldings-skjerm for medlemmer som kobler seg på et eksisterende skip.
 */

import type { SkillKey } from '../../types';
import { CREW_ROLES, CREW_ROLE_ORDER } from '../../data';
import { AutoIcon } from '../decor/NorseIcon';
import { skillTreeData } from '../../data';

interface Props {
  value: SkillKey | null;
  onPick: (role: SkillKey) => void;
  /** Roller som allerede er tatt av andre i mannskapet — gråes ut. */
  taken?: SkillKey[];
}

export default function RolePicker({ value, onPick, taken = [] }: Props) {
  const takenSet = new Set(taken);
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {CREW_ROLE_ORDER.map((key) => {
        const role = CREW_ROLES[key];
        const selected = value === key;
        const isTaken = takenSet.has(key) && !selected;
        return (
          <button
            key={key}
            onClick={() => !isTaken && onPick(key)}
            disabled={isTaken}
            aria-pressed={selected}
            className={`flex items-start gap-3 rounded-lg border-2 p-4 text-left transition-all ${
              selected
                ? 'border-viking-gold bg-viking-gold/15'
                : isTaken
                  ? 'cursor-not-allowed border-viking-gold/15 opacity-40'
                  : 'border-viking-gold/30 hover:border-viking-gold/70'
            }`}
          >
            <span className="leading-none" style={{ color: skillTreeData[key].color }}>
              <AutoIcon name={role.icon} size={30} />
            </span>
            <span>
              <span className="flex items-center gap-2 font-cinzel text-lg text-viking-gold">
                {role.title}
                {isTaken && <span className="font-inter text-[10px] uppercase tracking-wide text-viking-gold-soft/70">tatt</span>}
              </span>
              <span className="block font-inter text-xs text-viking-paper/80">{role.blurb}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
