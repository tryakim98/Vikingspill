/**
 * tradeGoods.ts
 * Handelsvarer (historisk autentiske vikingvarer) som samles per destinasjon.
 * IKKE inkludert: mennesker, treller, slaver — slaveri omtales i fortellingen
 * (f.eks. Dublin) men gjøres aldri til en samlbar valuta i spillet.
 */

export type TradeGood =
  | 'pelsverk'
  | 'solv'
  | 'jern'
  | 'rav'
  | 'silke'
  | 'hvalrosstann'
  | 'krydder'
  | 'salt';

export interface TradeGoodInfo {
  id: TradeGood;
  name: string;
  icon: string;       // ikon-navn (AutoIcon: 'ikon-*' = PNG, ellers SVG-glyf)
  origin: string;     // kort historisk note (tooltip)
}

export const TRADE_GOODS: Record<TradeGood, TradeGoodInfo> = {
  pelsverk:     { id: 'pelsverk',     name: 'Pelsverk',     icon: 'ikon-pelsverk', origin: 'Fra nord — Sameland, Novgorod, Bjarmaland. Bjørn, rev, mår.' },
  solv:         { id: 'solv',         name: 'Sølv',         icon: 'coin', origin: 'Frankiske mynter, arabiske dirhamer fra Bagdad, klosterskatter.' },
  jern:         { id: 'jern',         name: 'Jern',         icon: 'anvil',  origin: 'Skandinavia og Vinland — sverd, økser, nagler.' },
  rav:          { id: 'rav',          name: 'Rav',          icon: 'amber', origin: 'Østersjøen — fossilisert harpiks, hovedvare i Hedeby.' },
  silke:        { id: 'silke',        name: 'Silke',        icon: 'thread', origin: 'Miklagard — bysantinske vevninger fra Silkeveien.' },
  hvalrosstann: { id: 'hvalrosstann', name: 'Hvalrosstann', icon: 'ikon-hvalrosstann', origin: 'Atlantiske kolonier — Færøyene, Island, Grønland.' },
  krydder:      { id: 'krydder',      name: 'Krydder',      icon: 'spice', origin: 'Bagdad og videre øst — kanel, pepper, safran.' },
  salt:         { id: 'salt',         name: 'Salt',         icon: 'salt', origin: 'Handelsbyer langs kysten — uunnværlig for vinterlagring.' },
};

/** Hva hver destinasjon gir av handelsvarer ved fullføring. Tematisk historisk. */
export const GOODS_BY_DEST: Record<string, TradeGood[]> = {
  lindisfarne: ['solv'],                // Anglo-saksiske kloster-skatter
  hedeby:      ['rav', 'jern'],         // Østersjø-rav + skandinavisk jern
  dublin:      ['salt'],                // Handelsby; merk: trelldom omtales i historien, men er IKKE en vare her
  paris:       ['solv'],                // Frankiske mynter / danegeld
  hebrides:    ['salt'],                // Atlanterhavskystens salt
  sameland:    ['pelsverk'],            // Klassiske nord-pelser
  faroyene:    ['hvalrosstann'],        // Atlantiske hvalross-flokker
  island:      ['hvalrosstann'],        // Vikingenes hovedeksport fra Island
  vinland:     ['jern'],                // L'Anse aux Meadows' faktiske jernverk
  novgorod:    ['pelsverk'],            // Volgaveien — pels mot øst
  baghdad:     ['solv', 'krydder'],     // Dirhamer + krydder fra Silkeveien
  miklagard:   ['silke'],               // Bysantinsk silke
};
