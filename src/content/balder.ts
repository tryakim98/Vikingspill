type Harbour = {
  title: string;
  reading: string;
  prompt: string;
  source: string;
  url: string;
  question: string;
  options: [string, string, string];
  correct: number;
};
export const HARBOURS: Record<string, Harbour> = {
  lindisfarne: {
    title: "Da kirkesølvet skiftet hender",
    reading:
      "I 793 angrep sjøfarere klosteret på Lindisfarne. For en angriper kunne et kar av sølv være rikdom som var lett å ta med seg. For munkene hørte det samme karet til gudstjenesten. Den lærde Alkuin skrev om angrepet fra kontinentet. Brevene hans viser hvor sterkt nyheten virket i kristne miljøer. Angripernes egne forklaringer har vi langt mindre tilgang til.",
    prompt:
      "Hva kunne gå tapt for en munk selv om noen erstattet vekten av sølvet? Bruk en detalj fra teksten.",
    source: "English Heritage",
    url: "https://www.english-heritage.org.uk/visit/places/lindisfarne-priory/History/viking-raid/",
    question: "Hva kan Alkuins brev særlig belyse?",
    options: [
      "Hvordan byttet ble fordelt",
      "Hvordan en kristen lærd reagerte",
      "Hva angriperne avtalte før avreisen",
    ],
    correct: 1,
  },
  hedeby: {
    title: "En avtale på tvers av språk",
    reading:
      "Hedeby lå mellom det danske riket og frankernes område. Her møttes rutene fra Nordsjøen og Østersjøen. Tenk dere to mennesker som ser på det samme tøystykket. Den ene peker på hele rullen, den andre på lengden som er brettet ut. Begge nikker. For å bli enige må de finne en måte å vise mengde og vilkår på som begge forstår.",
    prompt:
      "Hva kunne de to gjøre for å oppdage at de hadde forstått nikket forskjellig?",
    source: "UNESCO",
    url: "https://whc.unesco.org/en/list/1553/",
    question: "Hva gjorde Hedeby til et møtested?",
    options: [
      "Byen bandt sammen to havområder",
      "Byen lå ved elva Volga",
      "Alle reisende hadde samme språk",
    ],
    correct: 0,
  },
  dublin: {
    title: "Hvem får fortelle om byen?",
    reading:
      "I Dublin har arkeologer funnet spor etter hus, håndverk og utveksling i vikingtiden. Fast bosetning gjorde at mennesker med ulik bakgrunn møttes igjen, ofte gjennom flere generasjoner. Samtidig var fangenskap og slavehandel en del av verdenen byen vokste fram i. En håndverker med kunder og en person som ble solgt, kunne ha helt ulike erfaringer av den samme havna.",
    prompt:
      "Et museum viser fram sølvet og verkstedene i Dublin. Hvilken erfaring kan forsvinne fra utstillingen, og hvorfor?",
    source: "Dublinia",
    url: "https://www.dublinia.ie/events_news/vikings-bring-back-slavery-dublin/",
    question: "Hva gir hus og verksteder særlig gode spor etter?",
    options: [
      "Hva hver innbygger tenkte",
      "Hvilket språk alle brukte hjemme",
      "Bosetning og arbeid i byen",
    ],
    correct: 2,
  },
  paris: {
    title: "Elva sett fra to sider",
    reading:
      "I 885 kom en vikingflåte opp Seinen til Paris og beleiret byen. Elva som ga innbyggerne kontakt med omverdenen, ga også fremmede skip en vei inn. Tenk på forskjellen mellom å stå på bredden og å sitte om bord. En avtale om fri passasje kan se ut som en løsning fra skipet, men den kan flytte faren videre til folk lenger oppe langs elva.",
    prompt:
      "Hvem bør få uttale seg om en avtale om fri passasje? Forklar med utgangspunkt i elva.",
    source: "France Culture via Médiathèques de Strasbourg",
    url: "https://www.mediatheques.strasbourg.eu/doc/RADIOFRANCE/2024C36128S0268/siege-de-paris-les-vikings-entrent-en-seine",
    question: "Hvorfor kunne elva være både nyttig og farlig for byen?",
    options: [
      "Den ga adgang til byen for både venner og angripere",
      "Den lot byen kontrollere alle skip i havet",
      "Den gjorde avtaler overflødige",
    ],
    correct: 0,
  },
  hebrides: {
    title: "To språk på samme kart",
    reading:
      "På Hebridene møttes gæliskspråklige og norrønspråklige miljøer. På Lewis ble navn med norrøne røtter brukt videre av folk som snakket gælisk. Et stedsnavn kunne dermed leve lenger enn kunnskapen om hva ordet først betydde. Et kart kan hjelpe oss å finne spor etter kontakt. For å tolke navnet trenger vi også språkhistorie.",
    prompt:
      "Hvordan kan ett navn fortelle om mennesker som snakket to ulike språk?",
    source: "University of Nottingham",
    url: "https://www.nottingham.ac.uk/research/groups/csva/documents/lmfpublications/lmf2-isleoflewis%2Cthevikingsinlewis.pdf",
    question: "Hva kan skje når et stedsnavn lever videre i et nytt språk?",
    options: [
      "Alle begynner å snakke det gamle språket",
      "Navnet brukes selv om betydningen blir uklar",
      "Navnet viser nøyaktig når språket skiftet",
    ],
    correct: 1,
  },
  sameland: {
    title: "Hvem kalte det skatt?",
    reading:
      "Ottar fortalte mot slutten av 800-tallet om forholdet sitt til samer i nord. Han beskrev blant annet skinn og fjær som han mottok som skatt. Ordene er bevart gjennom en beretning ved et engelsk hoff. Vi kan undersøke hva Ottar ville framheve om sin egen rikdom. De som leverte skinnene, fikk ikke samme plass til å forklare sitt syn i denne kilden.",
    prompt:
      "Hva ville dere spurt en av dem som leverte skinn om, og hva kan svaret tilføre Ottars fortelling?",
    source: "Store norske leksikon",
    url: "https://snl.no/finnskatten",
    question: "Hvem sitt ståsted kommer klarest fram i beretningen?",
    options: [
      "Alle som leverte skinn",
      "Alle ved det engelske hoffet",
      "Ottar, som fortalte om rikdommen sin",
    ],
    correct: 2,
  },
  faroyene: {
    title: "Et låneord ved beiteplassen",
    reading:
      "På Færøyene finnes stedsnavn med ordet argi. Forskere knytter ordet til et gælisk ord for en seter eller beiteplass. Et ord som fulgte mennesker over havet, kunne få et varig hjem i et nytt landskap. Det gir oss noe annet enn en liste over høvdinger: et spor etter hverdagsliv og kontakt rundt dyrehold.",
    prompt:
      "Hva kan navnet på en beiteplass fortelle som et kart over seilingsruter alene ikke viser?",
    source: "Archaeology of Viking Age Faroe Islands",
    url: "https://doi.org/10.59500/wjof2444",
    question: "Hva slags kulturkontakt kan argi være spor etter?",
    options: [
      "Et navn som fulgte med kunnskap om beite",
      "En skriftlig avtale om eierskap",
      "At alle øyboere kom fra samme gård",
    ],
    correct: 0,
  },
  island: {
    title: "Hvem fikk plass på tinget?",
    reading:
      "Blant dem som bosatte seg på Island, var mennesker fra både Skandinavia og De britiske øyer. På Alltinget møttes folk fra ulike deler av øya for å behandle lover og tvister. En felles møteplass kunne knytte bygdene sammen. For å vite hvem som faktisk hadde innflytelse, må vi undersøke hvem som kunne tale og få støtte for sin sak.",
    prompt:
      "Tenk dere at to naboer er uenige om en grense. Hva må vi vite om tinget for å vurdere om begge ble hørt?",
    source: "Þingvellir nasjonalpark",
    url: "https://www.thingvellir.is/en/education/history/settlement-of-iceland/",
    question: "Hvilken bakgrunn hadde bosetterne ifølge teksten?",
    options: [
      "Alle kom fra én norsk bygd",
      "De kom blant annet fra Skandinavia og De britiske øyer",
      "De kom bare fra De britiske øyer",
    ],
    correct: 1,
  },
  vinland: {
    title: "Hvem var stedet nytt for?",
    reading:
      "På Newfoundland er det funnet tufter etter norrøne bygninger ved L’Anse aux Meadows. Urfolk hadde en lang historie i området før de norrøne sjøfarerne kom. Ordet «oppdagelse» kan derfor bety noe helt forskjellig alt etter hvem som forteller. Tuftene forteller oss om bygninger og mennesker på stedet. En bestemt samtale mellom to personer krever andre belegg.",
    prompt:
      "Skriv en museumstekst på to setninger om ankomsten. Hvordan får dere fram både sjøfarernes og lokalbefolkningens ståsted?",
    source: "Parks Canada",
    url: "https://www.parcs.canada.ca/lhn-nhs/nl/meadows/culture/sites",
    question: "Hva viser tuftene ved L’Anse aux Meadows?",
    options: [
      "Hva alle besøkende kalte landet",
      "Hvordan en bestemt samtale lød",
      "At norrøne folk bygde her",
    ],
    correct: 2,
  },
  novgorod: {
    title: "Når elva tar slutt",
    reading:
      "Elvene rundt Novgorod inngikk i ruter mellom Østersjøen og områdene lenger sør. Mellom vassdrag måtte reisende også over land. Tenk dere to mannskap som møtes ved et slikt skille. Det ene kjenner farvannet de kommer fra, det andre kjenner neste elv. Kunnskap om hvor man kunne laste om, kunne være like viktig som selve båten.",
    prompt:
      "Hvordan kunne et mannskap som kjente neste elv få innflytelse i dette møtet?",
    source: "Viking Archaeology",
    url: "https://viking.archeurope.com/settlement/russia/rus-trade-routes-to-the-east/",
    question: "Hvilken kunnskap kunne en lokal veiviser bidra med?",
    options: [
      "Hvor båtene kunne legges til og lasten flyttes",
      "Hvem som hadde eid hver mynt",
      "Hva været ville bli hele neste år",
    ],
    correct: 0,
  },
  baghdad: {
    title: "Et møte skrevet ned ved Volga",
    reading:
      "Ibn Fadlan reiste som utsending fra Bagdad og beskrev mennesker han møtte ved Volga. Han la blant annet merke til smykker og sølv. Når han beskrev det som var uvant for ham, valgte han samtidig hva leserne hjemme fikk vite. I denne havna følger vi forbindelsen til Bagdad gjennom teksten hans. Selve møtet med rus fant sted ved elva.",
    prompt:
      "Hva ville dere spurt en av dem Ibn Fadlan beskrev, hvis dere kunne lese begge versjonene av møtet?",
    source: "Historiska museet",
    url: "https://historiska.se/en/explore-history/history-hub/large-rings-of-gold/",
    question:
      "Hvorfor har utsendingens lesere betydning for hvordan vi tolker teksten?",
    options: [
      "Leserne var alle til stede",
      "Han valgte hva han ville forklare for dem hjemme",
      "Leserne skrev ned begge parters opplevelser",
    ],
    correct: 1,
  },
  miklagard: {
    title: "En nykommer i keiserens tjeneste",
    reading:
      "Miklagard var det norrøne navnet på Konstantinopel. Blant dem som tjente den bysantinske keiseren i væringgarden, var det folk fra Norden. Møtet handlet dermed også om arbeid og om å lære reglene ved et fremmed hoff. En bysantinsk mynt funnet i nord kan ha vært lønn, men den kan også ha kommet dit gjennom flere andre hender.",
    prompt:
      "Et museum vil merke en mynt «lønn fra keiseren». Hva vil dere vite før dere godtar teksten?",
    source: "Historiska museet",
    url: "https://vikingar.historiska.se/objects.php?e=no&l=sv&showcase=afd13204-61d6-4a0f-be06-4125b7c62580",
    question: "Hvorfor er lønn bare én mulig forklaring på et myntfunn?",
    options: [
      "Mynten kan bare ha vært en gave",
      "Ingen fra Norden reiste til byen",
      "Mynten kan ha skiftet eier flere ganger",
    ],
    correct: 2,
  },
};
type Followup = [
  question: string,
  options: [string, string, string],
  correct: number,
  explanation: string,
];
const FOLLOWUPS: Record<string, [Followup, Followup]> = {
  lindisfarne: [
    [
      "Hva går tapt hvis et kirkekar bare beskrives med vekta i sølv?",
      [
        "Karets plass i gudstjenesten",
        "Opplysninger om sølvets vekt",
        "Muligheten for å frakte det med skip",
      ],
      0,
      "Karet hadde en funksjon i munkenes fellesskap som en vektangivelse ikke fanger.",
    ],
    [
      "En elev skriver at angriperne ville ramme kristendommen. Hva trenger eleven?",
      [
        "En ny beskrivelse av selve karet",
        "En kilde som belyser angripernes hensikt",
        "Enda en beskrivelse av munkenes tap",
      ],
      1,
      "Alkuins reaksjon forteller mye om virkningen av angrepet. Et motiv krever kilder som belyser angripernes side.",
    ],
  ],
  hedeby: [
    [
      "Hvilken opplysning manglet etter at begge nikket?",
      [
        "Hvor kjøperen var født",
        "Hvor tøystykket var vevd",
        "Hvilken mengde hver av dem mente",
      ],
      2,
      "Det samme nikket kunne vise til to forskjellige mengder tøy.",
    ],
    [
      "Hvilken handling tester best om de har forstått hverandre?",
      [
        "Begge viser hvor mye tøy de mener avtalen gjelder",
        "Selgeren gjentar samme ord høyere",
        "Kjøperen nikker en gang til",
      ],
      0,
      "Når begge viser mengden, kan motparten oppdage forskjellen før byttet.",
    ],
  ],
  dublin: [
    [
      "Hvorfor er en voksende havn et ufullstendig mål på hvordan folk hadde det?",
      [
        "En havn har alltid flere navn",
        "Velstand for noen kunne henge sammen med tvang for andre",
        "Håndverkere la sjelden igjen spor",
      ],
      1,
      "Den samme økonomien kunne gi levebrød til en håndverker og ta friheten fra en annen.",
    ],
    [
      "Hvilket spørsmål vil utvide en utstilling om produksjon og salg?",
      [
        "Hvordan ble skrinene dekorert?",
        "Hvor lå de største verkstedene?",
        "Hvem kunne velge å reise fra byen?",
      ],
      2,
      "Spørsmålet om bevegelsesfrihet gjør at også fangenskap blir synlig.",
    ],
  ],
  paris: [
    [
      "En avtale lar skipene passere Paris. Hvilket ståsted mangler hvis vi bare spør byfolket?",
      [
        "Folk som bodde lenger oppe langs elva",
        "Folk som bodde i Paris året etter",
        "De som forsvarte brua i byen",
      ],
      0,
      "En avtale som lettet presset på byen, kunne endre situasjonen for folk langs resten av ruta.",
    ],
    [
      "Hva må vi finne ut for å vurdere om avtalen ga trygghet?",
      [
        "Hvor bred Seinen var",
        "Hva skipene og folk langs elva gjorde etterpå",
        "Hva skipene var bygget av",
      ],
      1,
      "Følgene for de berørte avgjør om en lovnad faktisk gjorde dem tryggere.",
    ],
  ],
  hebrides: [
    [
      "Hva kan et norrønt navn brukt på gælisk gi spor etter?",
      [
        "At alle i bygda var tospråklige",
        "At navnet beholdt uttalen uendret",
        "At ord kunne bli tatt i bruk av nye språkbrukere",
      ],
      2,
      "Et lån viser en forbindelse mellom språkmiljøer. Det gir begrenset informasjon om hvert individ.",
    ],
    [
      "To navn ligner. Hvilken undersøkelse styrker forklaringen på likheten?",
      [
        "Sammenlign eldre navneformer og hvordan lydene har endret seg",
        "Velg navnet som er lettest å uttale",
        "Tell hvor mange bokstaver som er like i dag",
      ],
      0,
      "Eldre former lar oss undersøke en utvikling over tid.",
    ],
  ],
  sameland: [
    [
      "Hva kan vi tryggest bruke Ottars ord om skinnene til?",
      [
        "Å fastslå at begge sider kalte dem skatt",
        "Å forstå hvordan han framstilte rikdommen sin",
        "Å beregne hva hver familie leverte",
      ],
      1,
      "Beretningen gir direkte tilgang til Ottars framstilling. Andre sider av forholdet krever flere kilder.",
    ],
    [
      "Hva ville gitt oss et annet ståsted i saken?",
      [
        "Enda en avskrift av Ottars ord",
        "Et kart med reiseruta hans",
        "En beretning fra noen som leverte skinnene",
      ],
      2,
      "En annen parts erfaring kan belyse både hva ytelsen kostet og hvordan den ble oppfattet.",
    ],
  ],
  faroyene: [
    [
      "Hvorfor kan et låneord være en historisk kilde?",
      [
        "Et ord kan bære spor av kontakt mellom språkbrukere",
        "Et ord oppgir hvem som var øyas første innbygger",
        "Et ord gir en presis dato for bosettingen",
      ],
      0,
      "At et ord vandrer mellom språk kan fortelle om kontakt. Ordets form alene daterer ikke reisen.",
    ],
    [
      "Hvilken påstand om argi trenger flere kilder?",
      [
        "Forskere sammenligner ordet med gælisk",
        "En bestemt gjeter brakte ordet til Færøyene",
        "Ordet er knyttet til beitebruk",
      ],
      1,
      "Et språklig slektskap identifiserer ingen enkelt person som bar ordet med seg.",
    ],
  ],
  island: [
    [
      "Hvilket spørsmål undersøker politisk innflytelse mest direkte?",
      [
        "Hvor langt det var å gå til tinget",
        "Hvor mange som kunne høre møtet",
        "Hvem som kunne føre en sak og få den avgjort",
      ],
      2,
      "Tilgang til tale, støtte og avgjørelser forteller om fordelingen av makt.",
    ],
    [
      "Hva kunne et felles ting bety for folk fra ulike bygder?",
      [
        "De fikk et sted der tvister kunne behandles etter felles regler",
        "Alle med ulike skikker ville straks bli enige",
        "Tilknytningen til hjemstedet mistet all betydning",
      ],
      0,
      "En møteplass kunne gjøre uenighet håndterbar selv om forskjellene mellom folk fortsatte.",
    ],
  ],
  vinland: [
    [
      "Hva skjuler ordet «oppdagelse» hvis fortelleren aldri oppgir et ståsted?",
      [
        "Hvilke byggematerialer som ble brukt",
        "At området allerede inngikk i andre menneskers historie",
        "Hvor lenge husene sto",
      ],
      1,
      "Det som var nytt land for en sjøfarer, kunne være et kjent landskap for andre.",
    ],
    [
      "Hvilken museumsopplysning krever andre kilder enn hustuftene?",
      [
        "Det var bygninger på stedet",
        "Bygningene kan undersøkes arkeologisk",
        "To personer ønsket å slutte en bestemt avtale",
      ],
      2,
      "Bygningsspor kan ikke alene gjengi ord, ønsker eller motiver i et møte.",
    ],
  ],
  novgorod: [
    [
      "Hvorfor kunne en lokal veiviser få noe å si i en forhandling?",
      [
        "Mannskapet trengte kunnskap om neste etappe",
        "Veiviseren eide nødvendigvis begge elvene",
        "Alle varene måtte være laget lokalt",
      ],
      0,
      "Kunnskap om farvann og omlasting kunne gi forhandlingsmakt også til den som ikke eide båten.",
    ],
    [
      "En fremmed mynt dukker opp ved elva. Hvilken slutning er mest holdbar?",
      [
        "Myntens første eier seilte hele veien",
        "Mynten kom hit, men kan ha byttet hender underveis",
        "Alle på stedet kjente myntens språk",
      ],
      1,
      "Funnstedet gir ett holdepunkt. En full reiserute trenger flere spor.",
    ],
  ],
  baghdad: [
    [
      "Hvor fant møtet med rus i denne fortellingen sted?",
      ["I et verksted i Bagdad", "Ved keiserens hoff", "Ved Volga"],
      2,
      "Forbindelsen til Bagdad går gjennom utsendingen. Han beskrev folk han møtte ved Volga.",
    ],
    [
      "Hvilken formulering skiller best mellom iakttakelse og tolkning?",
      [
        "Han beskrev et smykke. Hva det betydde for eieren, må undersøkes videre.",
        "Han så smykket og kjente derfor eierens hensikt.",
        "Leseren kan uten videre bruke beskrivelsen om alle i området.",
      ],
      0,
      "En gjenstand kan beskrives av en utenforstående, mens eierens tolkning kan kreve en annen kilde.",
    ],
  ],
  miklagard: [
    [
      "Hvilken form for kulturkontakt viser eksempelet med væringgarden?",
      [
        "Folk som flykter fra en beleiring",
        "Folk som lærer å arbeide i en fremmed institusjon",
        "Folk som får en felles religion ved første møte",
      ],
      1,
      "Tjeneste ved hoffet satte folk med ulik bakgrunn i et arbeidsfellesskap.",
    ],
    [
      "Hva ville styrket tolkningen av mynten som lønn?",
      [
        "At den var rund",
        "At den hadde reist langt",
        "Et uavhengig spor som knytter den til en person i keiserens tjeneste",
      ],
      2,
      "Et spor etter eieren og tjenesten hjelper oss å skille lønn fra andre forklaringer.",
    ],
  ],
};

export function harbourQuiz(id: string) {
  const h = HARBOURS[id];
  return [
    { q: h.question, opts: h.options, correct: h.correct, feedback: h.reading },
    ...FOLLOWUPS[id].map(([q, opts, correct, feedback]) => ({
      q,
      opts,
      correct,
      feedback,
    })),
  ];
}
export const GATES: Record<string, number> = {
  paris: 1,
  dublin: 1,
  island: 1,
  novgorod: 2,
  miklagard: 2,
  vinland: 3,
  baghdad: 3,
};
export const PRACTICES = [
  {
    id: "tolk",
    port: "hedeby",
    title: "Markedstolken",
    task: "Spill ut et bytte av et tenkt tøystykke. Avtal i hemmelighet hver deres mengde. Bruk bare gester først. Stopp når begge tror dere er enige, og sjekk hva hver av dere mente.",
    proof:
      "Skriv hva hver part trodde var avtalt, og hvilken gest som oppklarte misforståelsen.",
  },
  {
    id: "museum",
    port: "lindisfarne",
    title: "Én gjenstand, to stemmer",
    task: "Velg en liten gjenstand i rommet til en miniutstilling. Én i gruppa lager en merkelapp sett fra klosteret. En annen lager en sett fra skipet. Les begge høyt ved gjenstanden.",
    proof:
      "Lever begge merkelappene ordrett. La en detalj fra Lindisfarne forklare hvorfor gjenstanden har ulik verdi.",
  },
  {
    id: "kart",
    port: "hebrides",
    title: "Kart med to språk",
    task: "Tegn en kyst med to landemerker på papir eller skjerm. Gi ett sted et navn. La en annen være karttegner som hører navnet og forsøker å plassere stedet. Sammenlign kartene.",
    proof:
      "Lever en kartnøkkel med de to navnene, hva karttegneren hørte, og én ting dere måtte oppklare.",
  },
] as const;
