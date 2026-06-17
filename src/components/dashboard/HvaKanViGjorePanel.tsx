/**
 * "Hva kan vi gjøre?"-panel
 *
 * Fast oversikt nederst på dashbordet. Viser:
 *  - Hva ressursene (rykte, handel, varer, ferdigheter) brukes til
 *  - Hvilke sidesteder dere kan låse opp NÅ
 *  - Hvilke sidesteder som er innen rekkevidde (bare litt mer rykte / vare)
 *
 * Mål: gi elevene en konkret link mellom det de har samlet og hva det
 * gjør mulig videre — uten å spore opp alle infokort manuelt.
 */

import type { Destination, SkillKey, TradeGoodId } from '../../types';
import { SIDE_UNLOCKS } from '../../data/routes';
import { meetsRequirement, missingForRequirement } from '../../lib/unlocks';
import { skillTreeData } from '../../data/skillTree';
import Icon from '../decor/Icon';
import NorseIcon from '../decor/NorseIcon';
import MaterialPanel from '../decor/MaterialPanel';

interface Props {
  destinations: Destination[];
  scores: { culturalUnderstanding: number; tradeGain: number; reputation: number };
  svennebrev: Record<SkillKey, number>;
  goods: Partial<Record<TradeGoodId, number>>;
  visited: string[];
  locked: string[];
  unlockedSides: string[];
}

interface ReachableRow {
  destId: string;
  destName: string;
  status: 'open-now' | 'within-reach' | 'far';
  bestPath: string;
}

export default function HvaKanViGjorePanel({ destinations, scores, svennebrev, goods, visited, locked, unlockedSides }: Props) {
  const destById = Object.fromEntries(destinations.map((d) => [d.id, d]));
  const stateForLogic = { scores, svennebrev, goods, locked, unlockedSides };

  // For hvert sidested: beste vei og hvor nær den er.
  const rows: ReachableRow[] = Object.entries(SIDE_UNLOCKS).flatMap(([destId, reqs]): ReachableRow[] => {
    const dest = destById[destId];
    if (!dest) return [];
    if (visited.includes(destId) || locked.includes(destId)) return [];
    if (unlockedSides.includes(destId)) {
      return [{ destId, destName: dest.name, status: 'open-now' as const, bestPath: 'Låst opp — klar til å seile' }];
    }
    // Sjekk hver vei: er noen oppfylt? hva er nærmest?
    const satisfied = reqs.some((r) => meetsRequirement(r, stateForLogic));
    if (satisfied) {
      return [{ destId, destName: dest.name, status: 'open-now' as const, bestPath: 'Krav oppfylt — klar til å seile' }];
    }
    // Finn veien hvor "minst" mangler
    const ranked = reqs
      .filter((r) => r.type !== 'svenneprove')
      .map((r) => ({ r, missing: missingForRequirement(r, stateForLogic) ?? '' }))
      .sort((a, b) => a.missing.length - b.missing.length);
    const closest = ranked[0];
    if (!closest) {
      // Bare svenneprøve som vei
      const sp = reqs.find((r) => r.type === 'svenneprove');
      if (sp && sp.type === 'svenneprove') {
        return [{
          destId, destName: dest.name, status: 'far',
          bestPath: `Trenger ferdsbrev i ${skillTreeData[sp.skill].name}`,
        }];
      }
      return [];
    }
    // Avgjør om det er "innen rekkevidde" — bare ett tall som mangler, små krav
    const missingShort = closest.missing.length < 25;
    return [{
      destId, destName: dest.name,
      status: missingShort ? 'within-reach' as const : 'far' as const,
      bestPath: `Mangler ${closest.missing}`,
    }];
  });

  const openNow = rows.filter((r) => r.status === 'open-now');
  const withinReach = rows.filter((r) => r.status === 'within-reach');
  const far = rows.filter((r) => r.status === 'far');

  return (
    <MaterialPanel material="stein" framed className="mb-6 p-4" data-testid="hva-kan-vi-gjore">
      <h3 className="mb-2 inline-flex items-center gap-2 font-saga text-xl text-viking-gold"><Icon name="compass" size={17} /> Hva kan vi gjøre?</h3>
      <p className="mb-3 font-inter text-[11px] italic text-viking-gold-soft/75">
        Ressursene gir konkrete muligheter. Slik bruker dere det dere har samlet.
      </p>

      {/* Ressursnøkkel — asymmetrisk «murverk» i stedet for jevn 2x3-grid: nøkkelressursen
          Kulturforståelse spenner bredt øverst, resten faller inn under i ulik takt. */}
      <div className="mb-3 flex flex-wrap gap-1.5 text-[11px]" data-testid="resource-key">
        <ResourceTip icon="ikon-kultur" label="Kulturforståelse" tip="Bedre valg, åpner sidesteder" className="w-full" />
        <ResourceTip icon="ikon-hvalrosstann" label="Handel" tip="Kjøp varer, betal spesielle handlinger" className="min-w-[8.5rem] flex-1" />
        <ResourceTip icon="ikon-rykte" label="Rykte" tip="Diplomati-valg, fjerne havner" className="min-w-[8.5rem] flex-[1.4]" />
        <ResourceTip icon="ikon-hvalrosstann" label="Handelsvarer" tip="Lås opp sidesteder, bytt med andre" className="min-w-[8.5rem] flex-[1.4]" />
        <ResourceTip icon="ikon-krigskunst" label="Ferdigheter" tip="Bonus på terning, låser opp valg" className="min-w-[8.5rem] flex-1" />
        <ResourceTip icon="ikon-svenneprove" label="Ferdsbrev" tip="Lås opp sidesteder via quiz" className="min-w-[8.5rem] flex-1" />
      </div>

      {/* Klare til å seile */}
      {openNow.length > 0 && (
        <div className="mb-2 rounded-md border border-viking-moss/50 bg-viking-moss/10 px-3 py-2" data-testid="open-now-section">
          <p className="inline-flex items-center gap-1.5 font-cinzel text-xs font-bold text-viking-moss"><Icon name="sail" size={13} /> Klare til å seile dit nå</p>
          <ul className="mt-1 space-y-0.5">
            {openNow.map((r) => (
              <li key={r.destId} className="font-inter text-xs text-viking-paper/95">
                <strong>{r.destName}</strong> <span className="text-viking-moss">— {r.bestPath}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Innen rekkevidde */}
      {withinReach.length > 0 && (
        <div className="mb-2 rounded-md border border-viking-gold/40 bg-viking-gold/5 px-3 py-2" data-testid="within-reach-section">
          <p className="inline-flex items-center gap-1.5 font-cinzel text-xs font-bold text-viking-gold"><Icon name="target" size={13} /> Innen rekkevidde</p>
          <ul className="mt-1 space-y-0.5">
            {withinReach.map((r) => (
              <li key={r.destId} className="font-inter text-xs text-viking-paper/90">
                <strong>{r.destName}</strong> <span className="text-viking-gold-soft">— {r.bestPath}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Lengre fram */}
      {far.length > 0 && (
        <div className="rounded-md border border-viking-gold/20 bg-viking-surface/30 px-3 py-2" data-testid="far-section">
          <p className="inline-flex items-center gap-1.5 font-cinzel text-xs text-viking-gold-soft/80"><Icon name="wave" size={13} /> Lengre fram</p>
          <ul className="mt-1 space-y-0.5">
            {far.map((r) => (
              <li key={r.destId} className="font-inter text-xs text-viking-paper/70">
                <strong>{r.destName}</strong> — {r.bestPath}
              </li>
            ))}
          </ul>
        </div>
      )}

      {rows.length === 0 && (
        <p className="font-inter text-xs italic text-viking-paper/70">Ingen sidesteder igjen å låse opp.</p>
      )}
    </MaterialPanel>
  );
}

function ResourceTip({ icon, label, tip, className = '' }: { icon: string; label: string; tip: string; className?: string }) {
  return (
    <div className={`flex items-start gap-1.5 border border-viking-gold/25 bg-viking-surface/40 px-2 py-1 ${className}`}>
      <span className="mt-0.5 shrink-0 text-viking-gold-soft">
        {icon.startsWith('ikon-') ? <NorseIcon name={icon} size={14} /> : <Icon name={icon} size={14} />}
      </span>
      <span className="leading-tight">
        <span className="block font-cinzel text-[10.5px] font-bold text-viking-gold-soft">{label}</span>
        <span className="block font-inter text-[10px] text-viking-paper/75">{tip}</span>
      </span>
    </div>
  );
}
