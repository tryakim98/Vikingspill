/**
 * RoleJoinScreen.tsx
 * Vises for et medlem som har koblet seg på et EKSISTERENDE skip (ikke chief, så de
 * gikk ikke gjennom SetupFlow). De velger sin mannskapsrolle her; roller de andre
 * ombord allerede har tatt er grået ut (unik rolle per mannskap, §2.3).
 */

import { useState } from 'react';
import type { SkillKey } from '../../types';
import RolePicker from './RolePicker';
import { AutoIcon } from '../decor/NorseIcon';

interface Props {
  shipName: string;
  taken: SkillKey[];
  onConfirm: (role: SkillKey) => void;
}

export default function RoleJoinScreen({ shipName, taken, onConfirm }: Props) {
  const [role, setRole] = useState<SkillKey | null>(null);
  return (
    <div className="flex min-h-screen flex-col items-center justify-center viking-screen px-4 py-8 text-viking-paper">
      <div className="w-full max-w-3xl text-center">
        <h1 className="font-saga text-3xl md:text-5xl viking-engraved-large mb-2">Velg din rolle</h1>
        <p className="font-inter text-viking-gold-soft italic mb-8">
          Du går ombord i <span className="font-cinzel text-viking-paper">{shipName}</span>. Hvilken stemme har du i mannskapsrådet?
        </p>
        <RolePicker value={role} onPick={setRole} taken={taken} />
        <div className="mt-8 flex justify-center">
          <button
            onClick={() => role && onConfirm(role)}
            disabled={role === null}
            className="rounded-md border-2 border-viking-gold bg-viking-gold px-10 py-2 font-saga font-bold text-viking-darkblue transition-all hover:bg-viking-gold-soft disabled:cursor-not-allowed disabled:opacity-40"
          >
            <span className="inline-flex items-center gap-2"><AutoIcon name="sail" size={16} /> Gå ombord</span>
          </button>
        </div>
      </div>
    </div>
  );
}
