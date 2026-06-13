/**
 * shortTexts.ts
 * Kortversjoner (2-3 setninger) av `history` og det episke kulturmøtets scene
 * for alle 12 destinasjoner. Beholder handlingen og kulturmøte-poenget, men
 * er lesbar for elever med lavere leseflyt — viktig differensiering for yrkesfag.
 *
 * Lærer styrer via spillinnstillingen `textLength`: 'full', 'short', eller 'group'
 * (sistnevnte = la hver gruppe velge selv).
 */

export interface ShortPair {
  historyShort: string;
  kulturmoteSceneShort: string;
}

export const SHORT_TEXTS: Record<string, ShortPair> = {
  lindisfarne: {
    historyShort: 'Det første store vikingangrepet vi har skriftlige kilder på. 8. juni 793 plyndret nordmenn klosteret på den hellige øya — året Europa lærte at vikingene fantes.',
    kulturmoteSceneShort: 'I grålysningen rodde vi mot stranda. En munk i brun kappe vinket — han trodde vi kom med varer. Han forsto ikke at klosteret med sølv, gullkalker og bøker lå ubevoktet, fordi munkene trodde Gud var vern nok.',
  },
  hedeby: {
    historyShort: 'Vikingtidens største handelsby — nesten 2000 mennesker. Her møttes saksere, frisere, slavere, arabere og nordmenn i trange gater av planker, det største folket noen hadde sett samlet nord for Alpene.',
    kulturmoteSceneShort: 'Vi hadde aldri sett så mange mennesker på ett sted. En araber med hvit turban veide glassperler på en finere vekt enn noe vi eide, en fremmed skrev på skinn at vi sang «som hunder hyler». I Hedeby er alle noens fremmede.',
  },
  dublin: {
    historyShort: 'Vikingene grunnla Dublin (Dyflinn) i 841 som handelshavn. Norrøne konger styrte i 200 år. De drev slavehandel, men giftet seg også inn i irske kongefamilier, lærte gælisk og ble kristne.',
    kulturmoteSceneShort: 'Om morgenen solgte vi keltiske fanger på slavemarkedet. Om kvelden satt vi ved en irsk konges bord, og barna våre snakket gælisk. Vi var ikke vikinger lenger, men ikke helt irer heller — noe nytt holdt på å bli til.',
  },
  paris: {
    historyShort: 'I 845 seilte Ragnar opp Seinen med 120 skip og fikk 7000 pund sølv av Karl den skallede. I 885 kom 30 000 vikinger tilbake og beleiret byen i ett år.',
    kulturmoteSceneShort: 'Paris var ikke et kloster. Steinmurer høyere enn mastene våre stoppet oss, og pariserne ropte hånord fra murene et helt år. Til slutt forhandlet høvdingen Rollo om noe nytt: ikke sølv, men LAND — å bli normannere i stedet for å dra hjem.',
  },
  hebrides: {
    historyShort: 'Norrøne vikinger erobret de skotske øyene tidlig. I 200 år tilhørte Hebridene Norge, og folk her snakket en blanding av gælisk og norrønt. Stedsnavnene avslører det fortsatt: Stornoway, Lewis, Skye.',
    kulturmoteSceneShort: 'Bestefar kom som plyndrer, far giftet seg med en gælisk kvinne. Nå synger jeg gæliske sanger med norrøne ord. De kaller oss Gall-Gàidheal — «de utenlandske gæliske» — det havet skapte da to folk ikke gikk fra hverandre igjen.',
  },
  sameland: {
    historyShort: 'Høvdingen Ottar fra Hålogaland (ca. 890) beskrev forholdet til samene som gjensidig og respektfullt. Samene leverte pelsverk, vikingene ga jern og sølv. Samiske noaider ble ansett som mektigere enn norrøne seidmenn.',
    kulturmoteSceneShort: 'Vi kom med jern og korn, sikre på at vi var de mektige. Men da noaiden tromma på runebommen sin, ble det stille — han fortalte ting om reisen vår han ikke kunne ha visst. Året etter kom andre nordmenn og krevde finnskatt med sverd: beundring og urett i samme åndedrag.',
  },
  faroyene: {
    historyShort: 'De første nordmennene fant irske munker som hadde levd i isolasjon på øyene i 100 år. Munkene flyktet, og vikingene tok over. Færøyene ble springbrettet videre til Island.',
    kulturmoteSceneShort: 'Vi trodde vi var de første, men fant steinkors og en urtehage. Munkene flyktet da de så seilene våre. Mange av kvinnene vi bygde landet med, var keltere tatt fra Irland — Færøyene var en blanding fra første dag.',
  },
  island: {
    historyShort: 'I 930 møttes islandske bønder på Þingvellir og dannet Alltinget — verdens eldste fortsatt fungerende parlament. Det var et samfunn uten konge, der lover ble sagt høyt av en lovsigemann som måtte huske dem utenat.',
    kulturmoteSceneShort: 'År 1000: hele Island sto på randen av borgerkrig — kristne mot Tor-tilbedere, alle med våpen i hånd. Þorgeirr, lovsigemannen som alle stolte på, la seg under kappen sin et helt døgn. Han våknet med kompromisset: alle skulle døpes, men kunne ofre til de gamle gudene i det stille hjemme.',
  },
  vinland: {
    historyShort: 'Leif Eriksson seilte fra Grønland rundt år 1000 og fant et land med vindruer, laks og enorme skoger. Vikingene møtte urfolk de kalte skrælinger; kulturelle misforståelser eskalerte til vold, og bosetningen ble forlatt etter få år.',
    kulturmoteSceneShort: 'Vi reiste lenger enn noen viking før oss og møtte skrælingene — folk med kobberhud og et språk som ikke hadde ETT eneste ord til felles med vårt. Vi ga dem rødt stoff og melk; de ga oss pelsverk. Men da noen ble syke av melken trodde de det var gift, og piler fløy. Uten felles ord ble alt til krig.',
  },
  novgorod: {
    historyShort: 'Svenske vikinger (kalt Rus) kom i 862 etter invitasjon fra slaviske stammer som ba dem styre. Rurik grunnla et dynasti som regjerte Russland i 700 år — selve navnet Russland kommer fra «Rus».',
    kulturmoteSceneShort: 'Det merkeligste oppdraget en viking kan få: å bli invitert til å herske. Vi kom for å styre slaverne, men sønnene fikk slaviske navn og ba til Kristus i greske kirker. Vi forsvant inn i folket vi skulle styre — selv navnet de ga oss, Rus, ble navnet på hele landet.',
  },
  baghdad: {
    historyShort: 'År 921 møtte den arabiske diplomaten Ibn Fadlan svenske rus-vikinger ved Volga. Hans beretning er en av de mest detaljerte beskrivelsene av vikinger noensinne skrevet, fascinert av kroppene «som palmer», forskrekket over hygienen.',
    kulturmoteSceneShort: 'Ibn Fadlan skrev at kroppene våre var «som palmer», men at vi var «Allahs skitneste skapninger» — vi delte alle samme vannfat om morgenen. Vi syntes araberne var rare som vasket seg fem ganger om dagen, som om de aldri ble ferdige. Hvem var «sivilisert»? Begge hadde rett. Begge tok feil.',
  },
  miklagard: {
    historyShort: 'Verdens rikeste by. Den bysantinske keiseren ansatte norrøne krigere som livvakt — Væringgarden — fordi de ikke hadde lokale lojaliteter. Harald Hardråde tjente her og kom hjem som en av Europas rikeste menn.',
    kulturmoteSceneShort: 'Da vi rodde inn i havna måtte vi legge nakken bakover for å se toppen av Hagia Sofia. Keiseren ville ha OSS som livvakter — ikke fordi vi var de beste krigere, men fordi vi var fremmede uten slekt her. Vi måtte legge igjen våpnene, bukke dypt, og si fremmede ord på gresk for å tjene ham.',
  },
};
