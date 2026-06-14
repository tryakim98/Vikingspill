/**
 * TradeMarket.tsx
 * Handelstorg — fullskjerm der gruppens høvding kan tilby varebytte med andre skip,
 * og akseptere/avslå tilbud som kommer inn. Modellerer vikingenes handelsnettverk:
 * noen skip har overskudd av én vare og mangler en annen — bytte fyller hverandres
 * mangler så sidesteder kan låses opp.
 *
 * Sjekker varebeholdning på begge sider ved aksept (atomisk via gameSync.acceptTrade).
 */

import { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import type { TradeGoodId } from '../../types';
import { TRADE_GOODS } from '../../data/tradeGoods';
import { playSound } from '../../lib/sound';
import type { SyncedGroup, TradeOffer } from '../../lib/gameSync';

export const TRADE_GOOD_ORDER: TradeGoodId[] = ['pelsverk', 'solv', 'jern', 'rav', 'silke', 'hvalrosstann', 'krydder', 'salt'];

interface Props {
  myGroupId: string;
  myGoods: Partial<Record<TradeGoodId, number>>;
  groups: Record<string, SyncedGroup>;
  trades: Record<string, TradeOffer>;
  isChief: boolean;
  onSendOffer: (toGroupId: string, toGroupName: string, giving: Partial<Record<TradeGoodId, number>>, receiving: Partial<Record<TradeGoodId, number>>) => Promise<void>;
  onAccept: (offer: TradeOffer) => Promise<{ ok: boolean; reason?: string }>;
  onDecline: (tradeId: string) => Promise<void>;
  onCancel: (tradeId: string) => Promise<void>;
  onClose: () => void;
}

type GoodsMap = Partial<Record<TradeGoodId, number>>;
const isEmpty = (g: GoodsMap) => Object.values(g).every((n) => !n);
const goodsSummary = (g: GoodsMap) => TRADE_GOOD_ORDER
  .filter((id) => g[id])
  .map((id) => `${g[id]}× ${TRADE_GOODS[id].icon} ${TRADE_GOODS[id].name}`)
  .join(', ');

export default function TradeMarket({
  myGroupId, myGoods, groups, trades, isChief,
  onSendOffer, onAccept, onDecline, onCancel, onClose,
}: Props) {
  const opponents = useMemo(
    () => Object.entries(groups).filter(([id]) => id !== myGroupId),
    [groups, myGroupId],
  );

  const allTrades = Object.values(trades);
  const incoming = allTrades.filter((t) => t.status === 'pending' && t.toGroupId === myGroupId);
  const outgoing = allTrades.filter((t) => t.status === 'pending' && t.fromGroupId === myGroupId);
  const history = allTrades
    .filter((t) => (t.fromGroupId === myGroupId || t.toGroupId === myGroupId) && t.status !== 'pending')
    .sort((a, b) => (b.resolvedAt ?? 0) - (a.resolvedAt ?? 0))
    .slice(0, 6);

  const [composing, setComposing] = useState<string | null>(null); // toGroupId
  const [giving, setGiving] = useState<GoodsMap>({});
  const [receiving, setReceiving] = useState<GoodsMap>({});
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startCompose = (toId: string) => {
    setComposing(toId);
    setGiving({});
    setReceiving({});
    setError(null);
  };
  const cancelCompose = () => { setComposing(null); setGiving({}); setReceiving({}); setError(null); };

  const incDec = (which: 'giving' | 'receiving', good: TradeGoodId, delta: number, max?: number) => {
    const setter = which === 'giving' ? setGiving : setReceiving;
    setter((cur) => {
      const next = { ...cur };
      const at = Math.max(0, (cur[good] ?? 0) + delta);
      if (max !== undefined && at > max) return cur;
      if (at === 0) delete next[good]; else next[good] = at;
      return next;
    });
  };

  const sendOffer = async () => {
    if (!composing) return;
    const target = groups[composing];
    if (!target) return;
    if (isEmpty(giving) && isEmpty(receiving)) { setError('Velg minst én vare på hver side.'); return; }
    if (isEmpty(giving)) { setError('Dere må tilby noe — ingen vil bytte mot ingenting.'); return; }
    if (isEmpty(receiving)) { setError('Velg hva dere vil ha tilbake.'); return; }
    setSending(true);
    setError(null);
    try {
      await onSendOffer(composing, target.shipName, giving, receiving);
      cancelCompose();
    } catch (e) {
      setError('Klarte ikke å sende — prøv igjen.');
    } finally {
      setSending(false);
    }
  };

  const handleAccept = async (offer: TradeOffer) => {
    const result = await onAccept(offer);
    if (result.ok) {
      playSound('coin'); // varene skifter hender — mynt og gods klirrer
    } else {
      setError(result.reason ?? 'Aksept feilet.');
      window.setTimeout(() => setError(null), 4000);
    }
  };

  return (
    <div className="min-h-screen viking-screen text-viking-paper" data-testid="trade-market">
      <div className="mx-auto max-w-3xl px-4 py-6">
        <div className="mb-5 flex items-center justify-between border-b-2 border-viking-gold/40 pb-3">
          <div>
            <h1 className="font-cinzel text-2xl font-bold text-viking-gold">🏛 Handelstorg</h1>
            <p className="font-inter text-xs italic text-viking-gold-soft">Bytt varer med andre skip — fyll hverandres mangler.</p>
          </div>
          <button onClick={onClose} className="rounded border-2 border-viking-gold/50 px-3 py-1 font-cinzel text-sm text-viking-gold-soft hover:border-viking-gold">✕ Lukk</button>
        </div>

        {error && (
          <motion.p
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="mb-3 rounded-md border-2 border-viking-crimson bg-viking-crimson/15 px-3 py-2 font-inter text-sm text-viking-paper"
          >{error}</motion.p>
        )}

        {/* Innkommende tilbud */}
        <section className="mb-5">
          <h2 className="mb-2 font-cinzel text-lg text-viking-gold">📥 Innkommende tilbud {incoming.length > 0 && <span className="ml-1 rounded bg-viking-crimson px-1.5 py-0.5 font-mono text-xs text-viking-paper">{incoming.length}</span>}</h2>
          {incoming.length === 0 ? (
            <p className="font-inter text-sm italic text-viking-paper/55">Ingen tilbud venter på svar.</p>
          ) : incoming.map((t) => (
            <div key={t.id} className="mb-2 rounded-lg border-2 border-viking-gold bg-viking-surface p-3" data-testid={`incoming-${t.id}`}>
              <p className="font-cinzel text-viking-gold">{t.fromGroupName} tilbyr</p>
              <p className="mt-1 font-inter text-sm text-viking-paper/90">
                <strong className="text-viking-moss">{goodsSummary(t.giving)}</strong>
                <span className="mx-2">↔</span>
                <strong className="text-viking-gold-soft">{goodsSummary(t.receiving)}</strong>
              </p>
              {isChief ? (
                <div className="mt-2 flex gap-2">
                  <button onClick={() => handleAccept(t)} data-testid={`accept-${t.id}`} className="rounded border-2 border-viking-moss bg-viking-moss/30 px-3 py-1 font-cinzel text-sm font-bold text-viking-paper hover:bg-viking-moss/50">Aksepter</button>
                  <button onClick={() => onDecline(t.id)} data-testid={`decline-${t.id}`} className="rounded border-2 border-viking-crimson bg-viking-crimson/30 px-3 py-1 font-cinzel text-sm font-bold text-viking-paper hover:bg-viking-crimson/50">Avslå</button>
                </div>
              ) : (
                <p className="mt-1 font-inter text-xs italic text-viking-gold-soft">⚓ Høvdingen svarer på tilbudet.</p>
              )}
            </div>
          ))}
        </section>

        {/* Utgående tilbud */}
        <section className="mb-5">
          <h2 className="mb-2 font-cinzel text-lg text-viking-gold">📤 Sendt</h2>
          {outgoing.length === 0 ? (
            <p className="font-inter text-sm italic text-viking-paper/55">Ingen tilbud venter på svar.</p>
          ) : outgoing.map((t) => (
            <div key={t.id} className="mb-2 rounded-lg border border-viking-gold/40 bg-viking-darkblue/50 p-2.5" data-testid={`outgoing-${t.id}`}>
              <p className="font-inter text-sm">
                Til <strong className="font-cinzel text-viking-gold">{t.toGroupName}</strong>: gir <strong className="text-viking-moss">{goodsSummary(t.giving)}</strong> for <strong className="text-viking-gold-soft">{goodsSummary(t.receiving)}</strong>
              </p>
              {isChief && (
                <button onClick={() => onCancel(t.id)} className="mt-1.5 rounded border border-viking-gold/40 px-2 py-0.5 font-cinzel text-xs text-viking-gold-soft hover:border-viking-gold">Trekk tilbud</button>
              )}
            </div>
          ))}
        </section>

        {/* Andre skip — send nytt tilbud */}
        <section className="mb-5">
          <h2 className="mb-2 font-cinzel text-lg text-viking-gold">⛵ Andre skip i spillet</h2>
          {opponents.length === 0 ? (
            <p className="font-inter text-sm italic text-viking-paper/55">Ingen andre skip har lagt fra land ennå.</p>
          ) : opponents.map(([id, g]) => {
            const opponentGoods = g.goods ?? {};
            const isComposing = composing === id;
            return (
              <div key={id} className="mb-2 rounded-lg border border-viking-gold/40 bg-viking-surface p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-cinzel text-viking-paper">{g.shipName}</p>
                    <p className="font-mono text-[10px] text-viking-gold-soft/80">{TRADE_GOOD_ORDER.filter((k) => opponentGoods[k]).map((k) => `${opponentGoods[k]}× ${TRADE_GOODS[k].icon}`).join(' ') || '(tom)'}</p>
                  </div>
                  {isChief && !isComposing && (
                    <button onClick={() => startCompose(id)} data-testid={`compose-${id}`} className="rounded border-2 border-viking-gold bg-viking-gold/15 px-3 py-1 font-cinzel text-sm text-viking-gold hover:bg-viking-gold/30">Send tilbud →</button>
                  )}
                </div>

                {isComposing && (
                  <div className="mt-3 rounded-md border border-viking-gold-soft/40 bg-viking-darkblue/50 p-3">
                    <p className="mb-2 font-cinzel text-xs text-viking-gold-soft">Vi gir (vi har: {goodsSummary(myGoods) || 'ingenting'})</p>
                    <GoodsPicker
                      pick={giving} side="giving" cap={myGoods}
                      onInc={(g) => incDec('giving', g, +1, (myGoods[g] ?? 0))}
                      onDec={(g) => incDec('giving', g, -1)}
                    />
                    <p className="mt-3 mb-2 font-cinzel text-xs text-viking-gold-soft">Vi vil ha</p>
                    <GoodsPicker
                      pick={receiving} side="receiving" cap={opponentGoods}
                      onInc={(g) => incDec('receiving', g, +1, (opponentGoods[g] ?? 0))}
                      onDec={(g) => incDec('receiving', g, -1)}
                    />
                    <div className="mt-3 flex gap-2">
                      <button
                        onClick={sendOffer}
                        disabled={sending}
                        data-testid="send-offer"
                        className="rounded-md border-2 border-viking-gold bg-viking-gold px-5 py-1.5 font-cinzel font-bold text-viking-darkblue hover:bg-viking-gold-soft disabled:opacity-50"
                      >
                        {sending ? 'Sender …' : 'Send tilbud'}
                      </button>
                      <button onClick={cancelCompose} className="rounded-md border-2 border-viking-gold/50 px-4 py-1.5 font-cinzel text-sm text-viking-gold-soft hover:border-viking-gold">Avbryt</button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </section>

        {/* Historikk */}
        {history.length > 0 && (
          <section className="mb-5">
            <h2 className="mb-2 font-cinzel text-lg text-viking-gold-soft">📜 Tidligere handler</h2>
            {history.map((t) => {
              const statusLabel = t.status === 'accepted' ? '✓ Akseptert' : t.status === 'declined' ? '✕ Avslått' : '↩ Trukket';
              const color = t.status === 'accepted' ? 'text-viking-moss' : 'text-viking-paper/55';
              return (
                <p key={t.id} className={`mb-1 font-inter text-xs ${color}`}>
                  {t.fromGroupName} → {t.toGroupName}: {goodsSummary(t.giving)} ↔ {goodsSummary(t.receiving)} · <strong>{statusLabel}</strong>
                </p>
              );
            })}
          </section>
        )}

        <p className="mt-6 text-center font-cinzel text-xs text-viking-gold-soft/60">Vikingen som ikke handler, blir aldri rik. ⚓</p>
      </div>
    </div>
  );
}

function GoodsPicker({
  pick, cap, side, onInc, onDec,
}: {
  pick: GoodsMap;
  cap: Partial<Record<TradeGoodId, number>>;
  side: 'giving' | 'receiving';
  onInc: (g: TradeGoodId) => void;
  onDec: (g: TradeGoodId) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
      {TRADE_GOOD_ORDER.map((g) => {
        const n = pick[g] ?? 0;
        const available = cap[g] ?? 0;
        const disableInc = side === 'giving' ? n >= available : false;
        return (
          <div key={g} className="flex items-center gap-1.5 rounded border border-viking-gold/30 bg-viking-darkblue/40 px-2 py-1">
            <span aria-hidden>{TRADE_GOODS[g].icon}</span>
            <span className="flex-1 truncate font-inter text-[11px] text-viking-paper/85">{TRADE_GOODS[g].name}</span>
            <button
              type="button"
              onClick={() => onDec(g)}
              disabled={n === 0}
              data-testid={`${side}-dec-${g}`}
              className="h-5 w-5 rounded border border-viking-gold/40 font-cinzel text-xs text-viking-gold-soft disabled:opacity-30"
            >−</button>
            <span data-testid={`${side}-count-${g}`} className="w-4 text-center font-mono text-xs text-viking-gold">{n}</span>
            <button
              type="button"
              onClick={() => onInc(g)}
              disabled={disableInc}
              data-testid={`${side}-inc-${g}`}
              className="h-5 w-5 rounded border border-viking-gold/40 font-cinzel text-xs text-viking-gold-soft disabled:opacity-30"
            >+</button>
          </div>
        );
      })}
    </div>
  );
}
