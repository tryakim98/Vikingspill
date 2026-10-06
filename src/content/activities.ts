import type { Destination } from "../types";

// These workshop scenarios are invented exercises, not claims about specific events.
export type JourneyQuestion = {
  q: string;
  opts: string[];
  correct: number;
  feedback: string;
  source: string[];
};
export type JourneyLesson = { notes: string[]; questions: JourneyQuestion[] };
const question = (
  port: string,
  q: string,
  right: string,
  wrong: string[],
  feedback: string,
): JourneyQuestion => {
  const correct =
    [...q].reduce((sum, c) => sum + c.charCodeAt(0), 0) % (wrong.length + 1);
  const opts = [...wrong];
  opts.splice(correct, 0, right);
  return { q, opts, correct, feedback, source: [port] };
};
const lesson = (
  port: string,
  notes: string[],
  questions: [string, string, string[]][],
): JourneyLesson => ({
  notes,
  questions: questions.map(([q, right, wrong], i) =>
    question(port, q, right, wrong, notes[i]),
  ),
});

export const JOURNEY_LESSONS: Record<string, JourneyLesson> = {
  lindisfarne: lesson(
    "lindisfarne",
    [
      "En gjenstand kan ha handelsverdi for én part og religiøs eller personlig verdi for en annen. Pris forklarer ikke hele tapet.",
      "En dramatisk scene viser en mulig opplevelse. For å hevde at en bestemt person faktisk sa eller gjorde noe, trenger vi en kilde.",
    ],
    [
      [
        "Lindisfarne: Hva mangler hvis vi beskriver tapet bare som sølv?",
        "Betydningen gjenstanden har for dem som mister den",
        ["Antallet skip på sjøkartet", "En høyere terningverdi"],
      ],
      [
        "Lindisfarne: Kan en replikk i spillscenen brukes som dokumentert sitat?",
        "Bare hvis en kilde faktisk dokumenterer den",
        ["Ja, fordi scenen har en dato", "Ja, hvis den høres troverdig ut"],
      ],
    ],
  ),
  hedeby: lesson(
    "hedeby",
    [
      "På markedet må partene forstå både varen, mengden og vilkårene. Gjenta avtalen med egne ord for å oppdage misforståelser.",
      "En besøkendes vurdering av sang, mat eller skikker er et perspektiv. Smaken til én person er ikke en fasit for en hel kultur.",
    ],
    [
      [
        "Hedeby: Hva gjør en bytteavtale tydelig?",
        "Begge gjentar vare, mengde og vilkår",
        ["Bare selgeren snakker", "Partene nikker uten å sjekke betydningen"],
      ],
      [
        "Hedeby: En gjest misliker sangen. Hva kan vi slutte?",
        "Det forteller om gjestens opplevelse",
        ["Alle i byen sang dårlig", "Sangen hadde ingen verdi for innbyggerne"],
      ],
    ],
  ),
  dublin: lesson(
    "dublin",
    [
      "Handel og kulturkontakt kan skje samtidig med vold og tvang. Et bilde av velstand alene sier ikke hvem som betalte prisen.",
      "To parter kan beskrive samme by forskjellig. Sammenlign ståsted og kildegrunnlag før du trekker en konklusjon.",
    ],
    [
      [
        "Dublin: Hvorfor er bare handelsmannens fortelling utilstrekkelig?",
        "Andre kan ha opplevd tvang eller tap i samme by",
        ["Handel utelukker vold", "Bare de rikeste kan ha kilder"],
      ],
      [
        "Dublin: To beskrivelser er forskjellige. Hva gjør vi først?",
        "Undersøker ståsted og hva hver beskrivelse bygger på",
        [
          "Velger den som liker byen best",
          "Kaster terningen for å finne den sanne",
        ],
      ],
    ],
  ),
  paris: lesson(
    "paris",
    [
      "I en forhandling bør et forslag være konkret: hva tilbys, hva kreves og hva skjer hvis avtalen brytes? En trussel er ikke det samme som en avtale.",
      "Et angrep kan koste tid, forsyninger og liv selv om det gir gevinst. Vurder også konsekvensene for dem som forsvarer byen.",
    ],
    [
      [
        "Paris: Hvilket forslag kan begge parter kontrollere?",
        "Et forslag med tydelig tilbud, krav og vilkår",
        ["En vag lovnad om fred", "En trussel uten noe tilbud"],
      ],
      [
        "Paris: Hva bør være med i vurderingen av et angrep?",
        "Tid, forsyninger, liv og konsekvenser for begge parter",
        ["Bare mulig sølvgevinst", "Bare om skipet har en kriger"],
      ],
    ],
  ),
  hebrides: lesson(
    "hebrides",
    [
      "Et stedsnavn kan være et språklig spor, men navnelikhet alene beviser ikke opprinnelsen. Kontroller forklaringen i en kilde.",
      "Kontakt mellom språk kan gi lån og endringer. Ett språklig spor forteller ikke at alle på stedet hadde samme språk eller identitet.",
    ],
    [
      [
        "Hebridene: Et navn ligner et norrønt ord. Hva trengs før vi sier hvor det kommer fra?",
        "En kilde som forklarer navnets opprinnelse",
        [
          "Bare at endelsen ser kjent ut",
          "Et moderne kart uten navneforklaring",
        ],
      ],
      [
        "Hebridene: Hva viser et enkelt språklig spor?",
        "Et mulig spor etter kontakt, ikke hele befolkningens identitet",
        ["At alle snakket samme språk", "At én kultur erstattet alle andre"],
      ],
    ],
  ),
  sameland: lesson(
    "sameland",
    [
      "Når en reisende beskriver andre, får vi den reisendes ståsted. Den andre partens ønsker og grenser må også undersøkes.",
      "Å lære om en religiøs tradisjon krever ikke å etterligne hellige ritualer. Vi kan undersøke betydning og kilder gjennom en samtale.",
    ],
    [
      [
        "Sápmi: Hva mangler i en reisendes beskrivelse av et møte?",
        "Den andre partens eget ståsted",
        ["En mer dramatisk fortellerstemme", "En høyere handelsgevinst"],
      ],
      [
        "Sápmi: Hvordan kan vi undersøke en hellig tradisjon respektfullt?",
        "Snakke om betydning og kildegrunnlag",
        [
          "Lage en parodi på ritualet",
          "Anta at alle praktiserer på samme måte",
        ],
      ],
    ],
  ),
  faroyene: lesson(
    "faroyene",
    [
      "En seilingsplan trenger både rute, forsyninger og en plan for uvær. Korteste avstand er ikke nødvendigvis det tryggeste valget.",
      "Skill det du vet fra det du anslår. Ukjent vind og sikt gir usikkerhet selv om et moderne kart viser en nøyaktig avstand.",
    ],
    [
      [
        "Færøyene: Hva gjør en ruteplan nyttig?",
        "Rute, forsyninger og et alternativ ved uvær",
        ["Bare den korteste linjen", "Bare navnet på reisemålet"],
      ],
      [
        "Færøyene: Hvorfor må en plan ha usikkerhetsmerknader?",
        "Vind og sikt kan være ukjent selv om avstanden er kjent",
        ["Alle avstander på kart er gjetninger", "Kartet bestemmer været"],
      ],
    ],
  ),
  island: lesson(
    "island",
    [
      "En regel bør forklare hvem den gjelder, hvordan en tvist avgjøres og hvilke hensyn den ivaretar. Enighet om ordene alene er ikke nok.",
      "Et ting er ikke automatisk likt et moderne demokrati. Undersøk hvem som kunne delta og hvem som hadde makt.",
    ],
    [
      [
        "Island: Hva bør en regel for en konflikt inneholde?",
        "Hvem den gjelder og hvordan en tvist avgjøres",
        ["Bare en fengende tittel", "Bare at høvdingen alltid har rett"],
      ],
      [
        "Island: Hva må vi undersøke før vi sammenligner tinget med demokrati i dag?",
        "Hvem som kunne delta og hadde makt",
        ["Om møtet var utendørs", "Om folk snakket høyt"],
      ],
    ],
  ),
  vinland: lesson(
    "vinland",
    [
      "En gest kan tolkes forskjellig. Sjekk hva mottakeren faktisk forstod, i stedet for å anta at beskjeden var tydelig.",
      "En fortelling om et møte kan være bevart fra bare én part. Skill denne fortellingen fra det vi kan si sikkert om begge parters motiver.",
    ],
    [
      [
        "Vinland: Hvordan oppdager vi en misforståelse uten felles språk?",
        "Lar mottakeren vise hva beskjeden betydde",
        ["Gjentar gesten stadig hardere", "Antar at et smil betyr enighet"],
      ],
      [
        "Vinland: En fortelling kommer fra én part. Hva må vi passe på?",
        "Den dokumenterer ikke automatisk begge parters motiver",
        ["Den andre parten må ha ment det samme", "Alle detaljer må være feil"],
      ],
    ],
  ),
  novgorod: lesson(
    "novgorod",
    [
      "En elverute kan kreve omlasting og transport over land. En sammenhengende strek på et kart er ikke bevis for at hele reisen kunne seiles.",
      "En vare forteller ikke alene hvilken vei eller hvilke hender den har vært gjennom. Skill funn fra din foreslåtte reiserute.",
    ],
    [
      [
        "Novgorod: Hva må vi sjekke når en handelsrute følger flere elver?",
        "Hvor varer eller båter må flyttes over land",
        ["Bare om linjen er rett", "At alle elver renner mot sør"],
      ],
      [
        "Novgorod: Beviser én mynt hele reiseruten?",
        "Nei, ruten krever flere holdepunkter",
        [
          "Ja, eieren må ha besøkt myntstedet",
          "Ja, mynten viser alle mellomstopp",
        ],
      ],
    ],
  ),
  baghdad: lesson(
    "baghdad",
    [
      "Ibn Fadlans skildring av rus ble skrevet etter møter ved Volga. Den er ikke bevis for at det samme møtet fant sted i Bagdad.",
      "Beskriv først den konkrete observasjonen, og skill den fra forfatterens vurdering. En reaksjon forteller også om den som reagerer.",
    ],
    [
      [
        "Bagdad: Hvor knytter teksten Ibn Fadlans møte med rus til?",
        "Volgaområdet",
        ["Keiserpalasset i Miklagard", "Klosteret i Lindisfarne"],
      ],
      [
        "Bagdad: Hva er forskjellen på observasjon og vurdering?",
        "Hva som beskrives, og hva forfatteren mener om det",
        ["De er alltid det samme", "En sterk reaksjon beviser alle detaljer"],
      ],
    ],
  ),
  miklagard: lesson(
    "miklagard",
    [
      "I møte med et hoff kan språk og forventninger skape misforståelser. Spør om vilkårene og gjenta dem før du binder deg.",
      "En konkret kilde om en livvakt sier ikke automatisk hva alle i byen tenkte. Skill det dokumenterte fra deres egen dramatisering.",
    ],
    [
      [
        "Miklagard: Hva gjør vi før vi godtar en avtale vi ikke fullt ut forstår?",
        "Spør om og gjentar vilkårene",
        ["Bukker uten å spørre", "Lover alt straks"],
      ],
      [
        "Miklagard: Hva bør merkes som deres egen dramatisering?",
        "Replikker og motiver dere selv finner på",
        ["Kildens tittel", "Havnen dere har besøkt i spillet"],
      ],
    ],
  ),
};

const task = (
  title: string,
  desc: string,
  rationale: string,
  type: Destination["task"]["type"] = "innspilling",
  typeLabel = "Lagverksted",
): Destination["task"] => ({
  type,
  icon: "scroll",
  typeLabel,
  title,
  desc,
  rationale,
});
export const PORT_TASKS: Record<string, Destination["task"]> = {
  lindisfarne: task(
    "To verdier, én gjenstand",
    "Velg en ufarlig ting på bordet. Lag to 20-sekunders lydguider: én som beskriver mulig handelsverdi, én som forklarer hva eieren kan miste. Alle bidrar med en setning eller en detalj. Avslutt med å merke én opplysning som kildebasert og én som deres dramatisering. Fremfør direkte; opptak er valgfritt.",
    "Øv på forskjellen mellom pris, betydning og hvem som får fortelle historien.",
  ),
  hedeby: task(
    "Markedets dårligste salgspitch",
    "Lag først en 15-sekunders salgspitch der en bytteavtale blir komisk uklar. Spill den på nytt med tydelig vare, mengde og vilkår. Hver person sier eller viser ett av vilkårene. En annen gruppe gjentar avtalen: fikk dere samme forståelse? Bruk ting på bordet; ingen ekte handel er nødvendig.",
    "Markedsscenen trener tydelig kommunikasjon og viser hvorfor en avtale må forstås av begge.",
  ),
  dublin: task(
    "Byen i to lydspor",
    "Lag en 30-sekunders byguide med to fortellerstemmer: én viser handel og kulturkontakt, én spør hvem som opplevde tvang eller tap. Alle legger inn en lyd, setning eller kildeopplysning. Ikke spill personer utsatt for slaveri; fortell om perspektivene. Slutt med ett spørsmål kildene deres ikke besvarer.",
    "Velstand og kulturutveksling må undersøkes sammen med makt og tvang.",
  ),
  paris: task(
    "Sølv eller fastlåst forhandling?",
    "Tegn en byport på et ark. I et oppdiktet møte vil reisende ha adgang og byen ha trygghet. Laget har 60 sekunder til å lage en avtale med tilbud, krav og en måte å håndtere avtalebrudd på. Alle foreslår ett hensyn. Les avtalen med en dramatisk heroldstemme, og pek på det vanskeligste kompromisset.",
    "En konkret avtale gjør forskjellen mellom press, forhandling og felles vilkår synlig.",
  ),
  hebrides: task(
    "Navnedetektivens felle",
    "Finn ett stedsnavn på kartet eller i en kilde til havnen. Lag et miniskilt med to forklaringer: en kildebasert forklaring og en tydelig merket, oppdiktet forklaring. La en annen gruppe velge og forklare hva som kan kontrollere svaret. Alle bidrar med et spor, en tegning eller et kontrollspørsmål. Hvis opprinnelsen er uklar, er «vi vet ikke» et godt svar.",
    "Navnelikhet er et spor, ikke et bevis. Kildekontrollen er selve poenget.",
    "foto",
    "Navneverksted",
  ),
  sameland: task(
    "Kartet som manglet en stemme",
    "Tegn et lite kart til et oppdiktet møte i nord med reisested, møteplass og en grense dere må spørre om. Lag en 30-sekunders samtale der en reisende tror kartet forteller alt, men laget legger til spørsmål om den andre partens ønsker. Alle legger til ett spørsmål. Bruk vanlige stemmer og ingen etterligning av hellige ritualer.",
    "Undersøk hva en reisendes ståsted kan utelate, og hvorfor andres grenser må tas med.",
    "geoguesser",
    "Kartverksted",
  ),
  faroyene: task(
    "Værmeldingen som kom for sent",
    "Tegn en seilingsplan mot Færøyene med proviant og et alternativ ved uvær. En person gir en oppdiktet melding: «Sikten forsvinner!» Resten endrer planen på 30 sekunder; hver person må legge til én beslutning. Merk hva dere vet fra havneteksten, og hva dere har anslått. Presentér planen som en værmelding.",
    "En plan må håndtere risiko og usikkerhet, ikke bare avstanden på et moderne kart.",
    "geoguesser",
    "Ruteverksted",
  ),
  island: task(
    "Alltinget og den siste teltplassen",
    "Et oppdiktet ting skal fordele én tørr teltplass mellom reisende som alle mener de trenger den. Hvert medlem foreslår ett hensyn. Lag en regel på 30 sekunder som sier hvem den gjelder og hvordan uenighet avgjøres. Les den høyt. Prøv deretter et grensetilfelle: virker regelen fortsatt? Dette er deres verksted, ikke en rekonstruksjon av Alltingets lover.",
    "Prøv hvordan muntlige regler, makt og konfliktløsning henger sammen.",
  ),
  vinland: task(
    "Den misforståtte beskjeden",
    "Del laget i avsendere og mottakere. Avsenderne velger «vi ønsker å bytte», «vi trenger vann» eller «vi vil dra», og formidler det uten ord i 20 sekunder. Mottakerne skriver eller viser hva de oppfattet før beskjeden avsløres. Bytt side så alle prøver. Forklar én tvetydig gest. Ingen etterligner bestemte folkegrupper.",
    "Sjekk mottakerens forståelse, og knytt øvelsen til kildenes begrensede perspektiver.",
  ),
  novgorod: task(
    "Pakken som ikke kunne seile hele veien",
    "Tegn en handelsrute med elvestrekninger og ett mulig omlastingspunkt. En liten gjenstand er lasten. Hvert medlem flytter den én etappe og sier hva som må undersøkes: elv, transport over land, forsyning eller handelspartner. Marker det kartet eller kilden faktisk viser, og det dere bare foreslår.",
    "En pen strek på et kart skjuler både mellomledd og arbeid på reisen.",
    "geoguesser",
    "Ruteverksted",
  ),
  baghdad: task(
    "Redaksjonen retter overskriften",
    "Lag en overdrevet, oppdiktet overskrift om kulturmøtet. Vær så en redaksjon: ett medlem sjekker hvor møtet fant sted, ett skiller observasjon fra vurdering, og resten forbedrer ordvalget og finner et spørsmål som står ubesvart. Slå sammen oppgavene hvis dere er færre. Les før- og etteroverskriften som en nyhetssending. Ingen nye faktapåstander uten kilde.",
    "Ibn Fadlans møte med rus ved Volga må skilles fra spillhavnen Bagdad og fra hans vurderinger.",
  ),
  miklagard: task(
    "Hoffets kontrakt med liten skrift",
    "Skriv en oppdiktet arbeidsavtale på tre linjer: oppdrag, betaling og ett uklart vilkår. Laget spiller et 30-sekunders kontraktsmøte. Alle stiller ett spørsmål før avtalen signeres symbolsk. Avslutt med ett kildebasert poeng om byen og merk resten som deres scene. En høytidelig heroldstemme er lov; en bestemt historisk hilsen er ikke nødvendig.",
    "Tilpasning handler også om å forstå forventninger og vilkår, ikke bare å etterligne en seremoni.",
  ),
};
