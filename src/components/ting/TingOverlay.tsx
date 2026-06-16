/**
 * TingOverlay.tsx
 * Fullskjerm-avbrudd på ALLE medlemmers enheter når Tinget er kalt inn (§Tinget).
 * Hvert medlem stemmer i sanntid mellom den foreslåtte kandidaten og sittende høvding.
 * Når alle har stemt avgjøres saken (av sittende høvding, i GameDashboard): flertall for
 * kandidaten overfører roret, uavgjort beholder sittende. Til slutt vises et kort resultat.
 */

import type { TingSession } from '../../lib/gameSync';
import NorseIcon from '../decor/NorseIcon';

interface Props {
  ting: TingSession;
  myMemberId: string;
  memberIds: string[];
  memberLabel: (mid: string) => string;
  onVote: (votedFor: string) => void;
  onDismiss: () => void;
}

export default function TingOverlay({ ting, myMemberId, memberIds, memberLabel, onVote, onDismiss }: Props) {
  const votes = ting.votes ?? {};
  const voteCount = memberIds.filter((id) => votes[id]).length;
  const forCandidate = memberIds.filter((id) => votes[id] === ting.candidateId).length;
  const forIncumbent = memberIds.filter((id) => votes[id] === ting.incumbentId).length;
  const myVote = votes[myMemberId];

  const candidateName = memberLabel(ting.candidateId);
  const incumbentName = memberLabel(ting.incumbentId);

  if (ting.status === 'resolved') {
    const kept = ting.resultChiefId === ting.incumbentId;
    const newChiefName = memberLabel(ting.resultChiefId ?? ting.incumbentId);
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-viking-darkblue/95 px-4 text-center text-viking-paper" data-testid="ting-overlay">
        <p className="font-cinzel text-sm uppercase tracking-[0.3em] text-viking-gold-soft/70">Tinget har talt</p>
        <NorseIcon name="motiv-vekt" size={96} className="mt-3 text-viking-gold" />
        <h1 className="mt-3 font-cinzel text-3xl font-bold text-viking-gold drop-shadow-lg md:text-4xl" data-testid="ting-result">
          {kept ? `${incumbentName} beholder roret` : `${newChiefName} tar nå roret`}
        </h1>
        <p className="mt-3 font-mono text-sm text-viking-gold-soft">{candidateName}: {forCandidate} · {incumbentName}: {forIncumbent}</p>
        {kept && <p className="mt-1 font-inter text-sm italic text-viking-paper/70">Uavgjort eller flertall mot — sittende høvding fortsetter.</p>}
        <button onClick={onDismiss} data-testid="ting-dismiss" className="mt-8 rounded-md border-2 border-viking-gold bg-viking-gold px-9 py-3 font-saga text-lg font-bold text-viking-darkblue hover:bg-viking-gold-soft">
          Seil videre →
        </button>
      </div>
    );
  }

  // status === 'open'
  const VoteButton = ({ id, label, count }: { id: string; label: string; count: number }) => {
    const mine = myVote === id;
    return (
      <button
        onClick={() => onVote(id)}
        data-testid={`ting-vote-${id === ting.candidateId ? 'candidate' : 'incumbent'}`}
        className={`flex w-full items-center justify-between rounded-lg border-2 px-5 py-4 text-left transition-all ${mine ? 'border-viking-gold bg-viking-gold/20' : 'border-viking-gold/40 hover:border-viking-gold/80'}`}
      >
        <span className="font-cinzel text-lg text-viking-gold">{mine ? '✓ ' : ''}{label}</span>
        <span className="font-mono text-sm text-viking-gold-soft">{count}</span>
      </button>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-viking-darkblue/95 px-4 text-center text-viking-paper" data-testid="ting-overlay">
      <p className="font-cinzel text-sm uppercase tracking-[0.3em] text-viking-gold-soft/70">Tinget er kalt inn</p>
      <NorseIcon name="motiv-vekt" size={84} className="mt-2 text-viking-gold" />
      <h1 className="mt-2 mb-1 font-cinzel text-2xl font-bold text-viking-gold md:text-3xl">Hvem skal styre skipet?</h1>
      <p className="mb-6 max-w-md font-inter text-sm italic text-viking-paper/85">
        {memberLabel(ting.calledBy)} foreslår at <strong className="text-viking-gold-soft">{candidateName}</strong> tar roret. Gi din stemme.
      </p>

      <div className="w-full max-w-md space-y-3">
        <VoteButton id={ting.candidateId} label={`${candidateName} som ny høvding`} count={forCandidate} />
        <VoteButton id={ting.incumbentId} label={`Behold ${incumbentName}`} count={forIncumbent} />
      </div>

      <div className="mt-6 flex items-center gap-2 rounded-md border-2 border-viking-gold/40 bg-viking-darkblue/50 px-4 py-2" data-testid="ting-counter">
        <span className="font-cinzel text-lg text-viking-gold">{voteCount} av {memberIds.length}</span>
        <span className="font-inter text-sm text-viking-gold-soft">har stemt</span>
      </div>
      <p className="mt-3 font-inter text-xs italic text-viking-gold-soft/70">
        {myVote ? 'Du har stemt — du kan endre stemmen til alle er ferdige.' : 'Velg over for å avgi stemmen din.'}
      </p>
    </div>
  );
}
