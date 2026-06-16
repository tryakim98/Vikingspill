/**
 * consequences.ts
 * «Svidd mottakelse» — valg på én havn FORGRENER reisen ved en senere havn i stedet
 * for å AMPUTERE den. Hovedsporet er alltid åpent: alle grupper får møtet og
 * drøftingen ved hver havn uansett tidligere valg (jf. gating-regelen). Et tidligere
 * valg kan likevel gi en mykere konsekvens — en kald mottakelse som straffer
 * terningen og fargelegger scenen.
 *
 * Erstatter de gamle harde `choice.locks` (Lindisfarne/plyndre → Paris stengt,
 * Dublin/slave → Miklagard stengt), som nå er fjernet fra vikingspill_data.json.
 *
 * Utvides ved å føre opp havnen + hvilket tidligere valg som svir.
 */

export interface ScarredReception {
  /** Det tidligere valget som gir kald mottakelse her. */
  ifChoice: { destId: string; choiceId: string };
  /** Legges på terningmodifikatoren for ALLE valg på denne havna (negativt tall). */
  dicePenalty: number;
  /** Kort, fiendtlig forklaring vist i valg-steget og i terning-oppsummeringen. */
  note: string;
}

/** Nøkkel = havnen der konsekvensen merkes. */
export const SCARRED_RECEPTION: Record<string, ScarredReception> = {
  paris: {
    ifChoice: { destId: 'lindisfarne', choiceId: 'plunder' },
    dicePenalty: -2,
    note: 'Ryktet om Lindisfarne nådde Paris før dere. Karls menn møter dere kaldt — alle valg her ruller −2.',
  },
  miklagard: {
    ifChoice: { destId: 'dublin', choiceId: 'slave' },
    dicePenalty: -2,
    note: 'Ryktet om slavemarkedet i Dublin følger dere. Keiserens menn er på vakt — alle valg her ruller −2.',
  },
};
