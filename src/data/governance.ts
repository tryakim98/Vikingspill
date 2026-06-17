/**
 * governance.ts — STYRESETT-ATLAS
 *
 * Ett lite «slik er makten organisert her»-kort per havn: et faktabasert,
 * gjenkjennelig STYREFORM-navn + hvem som har makten + en kort beskrivelse av
 * hvordan makten er organisert på stedet. Vises i oppgave-steget («På stedet»)
 * i EncounterFlow — ett rolig pergament-kort, ikke et eget steg.
 *
 * Rent additivt: ingen kobling til valg, odds eller deliberasjon. Begge spor
 * (online + solo) viser kortet likt. i18n-vennlig: all tekst i navngitte felt.
 */

export interface Governance {
  styreform: string;   // gjenkjennelig navn på styreformen ("Kongedømme", "Tingstyre" …)
  makthaver: string;   // hvem som har makten, kort (1 linje)
  body: string;        // 1–2 setninger, faktabasert: hvordan makten er organisert
}

export const GOVERNANCE: Record<string, Governance> = {
  lindisfarne: {
    styreform: 'Kongedømme',
    makthaver: 'En konge, med adel og kirke',
    body: 'Northumbria var ett av flere angelsaksiske kongeriker. En konge styrte med adelen (ealdormenn) og kirken; klosteret lå under kongens og biskopens beskyttelse.',
  },
  hedeby: {
    styreform: 'Kongemakt og tingforsamling',
    makthaver: 'Den danske kongen — frie menn på tinget',
    body: 'Den danske kongen hadde overhøyhet og kontrollerte handelsbyen, men frie menn møttes på tinget for å avgjøre lov og tvister. Danevirke-voldene vitner om kongelig organisering.',
  },
  dublin: {
    styreform: 'Bykongedømme',
    makthaver: 'En norrøn sjøkonge',
    body: 'Et norrønt sjøkongedømme styrt av en konge (ofte av Ivar-ætten) over by og handel — i skiftende allianser og strid med de irske småkongene.',
  },
  paris: {
    styreform: 'Føydalt kongedømme',
    makthaver: 'Konge øverst, vasaller under',
    body: 'Den frankiske kongen sto øverst, men makten var delt ut til hertuger og grever (vasaller) som styrte hvert sitt len mot troskapsed og krigstjeneste. Paris ble forsvart av grev Odo.',
  },
  hebrides: {
    styreform: 'Høvdingvelde',
    makthaver: 'Lokale høvdinger og sjøkonger',
    body: 'Øyene ble styrt av lokale høvdinger og sjøkonger uten én samlet konge; makten hvilte på slekt, flåte og allianser.',
  },
  sameland: {
    styreform: 'Siidaer — samiske rettssamfunn',
    makthaver: 'Familiene i fellesskap',
    body: 'Samene levde i siidaer — lokale fellesskap som sammen forvaltet jakt-, fiske- og beiteland etter egen sedvane, uten konge eller sentralmakt. Beslutninger ble tatt i fellesskap blant familiene.',
  },
  faroyene: {
    styreform: 'Tingstyre',
    makthaver: 'Frie bønder på Løgtinget',
    body: 'De norrøne bosetterne avgjorde lov og tvister på Løgtinget (Tinganes i Tórshavn) — en fri bondeforsamling uten konge.',
  },
  island: {
    styreform: 'Tingstyre — fristat',
    makthaver: 'Frie bønder og høvdinger (goðar)',
    body: 'Island hadde ingen konge: frie bønder og høvdinger (goðar) møttes årlig på Alltinget (930), der lovsigemannen fremsa loven. Et av verdens eldste parlament.',
  },
  vinland: {
    styreform: 'Slektsbaserte grupper',
    makthaver: 'Slekt og ledende familier',
    body: 'Urfolket vikingene møtte levde i små jeger- og samlergrupper organisert rundt slekt og ledende familier, uten sentralmakt eller fast hovedstad.',
  },
  novgorod: {
    styreform: 'Vetsje — folkeforsamling',
    makthaver: 'Forsamlingen av frie borgere',
    body: 'Byen ble styrt gjennom vetsje — en forsamling av frie borgere som kunne kalle inn og avsette fyrsten. Etter sagaen ble Rurik invitert til å herske i 862.',
  },
  baghdad: {
    styreform: 'Kalifat',
    makthaver: 'Kalifen — religiøst og verdslig overhode',
    body: 'Den abbasidiske kalifen var både religiøst og verdslig overhode for et enormt rike, styrt fra Bagdad via en vesir og et stort embetsverk. På 800-tallet var byen verdens lærdomssentrum.',
  },
  miklagard: {
    styreform: 'Keiserdømme',
    makthaver: 'Keiseren (basileus)',
    body: 'Det bysantinske riket ble styrt av keiseren (basileus), ansett som Guds stedfortreder, med et omfattende hoff og embetsverk. Vikinger tjente keiseren i Væringgarden.',
  },
};
