/**
 * TradeGoodsPanel.tsx
 * Viser gruppens samling av handelsvarer. Hver vare med ikon, navn, antall.
 * Ingen mennesker/treller/slaver — kun materielle varer (se data/tradeGoods.ts).
 */

import { TRADE_GOODS, type TradeGood } from '../../data';
import Icon, { GOODS_ICON } from '../decor/Icon';
import NorseIcon, { GOODS_PNG } from '../decor/NorseIcon';

interface Props {
  goods: Partial<Record<TradeGood, number>>;
}

const ORDER: TradeGood[] = ['pelsverk', 'solv', 'jern', 'rav', 'silke', 'hvalrosstann', 'krydder', 'salt'];

export default function TradeGoodsPanel({ goods }: Props) {
  const total = ORDER.reduce((sum, g) => sum + (goods[g] ?? 0), 0);

  return (
    <div className="viking-frame bg-viking-surface p-3" data-testid="trade-goods-panel">
      <div className="mb-2 flex items-baseline justify-between">
        <p className="font-saga text-lg text-viking-gold-soft">Varer ombord</p>
        <p className="font-mono text-xs text-viking-gold-soft/80">{total} {total === 1 ? 'enhet' : 'enheter'}</p>
      </div>
      {total === 0 ? (
        <p className="font-inter text-xs italic text-viking-paper/60">Lasterommet er tomt — fullfør destinasjoner for å samle varer.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {ORDER.map((g) => {
            const n = goods[g] ?? 0;
            if (n === 0) return null;
            const info = TRADE_GOODS[g];
            return (
              <div
                key={g}
                title={info.origin}
                data-testid={`good-${g}`}
                className="flex items-center gap-1.5 border border-viking-gold/40 bg-viking-darkblue/40 px-2 py-1"
              >
                <span className="text-viking-gold-soft" aria-hidden>
                  {GOODS_PNG[g]
                    ? <NorseIcon name={GOODS_PNG[g]} size={16} />
                    : <Icon name={GOODS_ICON[g]} size={16} />}
                </span>
                <span className="font-inter text-xs text-viking-paper/90">{info.name}</span>
                <span className="font-cinzel text-xs font-bold text-viking-gold" data-testid={`good-count-${g}`}>× {n}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
