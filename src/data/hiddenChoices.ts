/**
 * hiddenChoices.ts
 * Skjulte valg på utvalgte destinasjoner. Hvis gruppen svarer riktig på et
 * lesespørsmål om historien/kulturmøtet, låses et ekstra (og ofte klokere)
 * valg opp. Feil svar = bare standardvalgene, ingen straff.
 *
 * Brukt skjønn: 5 destinasjoner med klare, konkrete detaljer i historien som
 * man finner ved å lese nøye, og der et alternativt klokere valg gir mening.
 */

import type { Choice } from '../types';

export interface ReadingTest {
  q: string;
  opts: string[];
  correct: number;
  feedback?: string;
}

export interface HiddenChoiceEntry {
  test: ReadingTest;
  choice: Choice;
}

export const HIDDEN_CHOICES: Record<string, HiddenChoiceEntry> = {
  lindisfarne: {
    test: {
      q: 'Hva dato falt det første store vikingangrepet på Lindisfarne?',
      opts: ['1. juni 793', '8. juni 793', '8. juli 793'],
      correct: 1,
      feedback: 'Det stod tydelig i historien: 8. juni 793.',
    },
    choice: {
      id: 'lindisfarne-bevare-manuskripter',
      title: 'Bevare manuskriptene',
      desc: 'I stedet for å la alt brenne — redde de hellige manuskriptene fra ilden. Munkene vil spre historien om vikinger som «hadde vidd».',
      tag: 'respect',
      baseRoll: { bad: 1, mid: 1, good: 3, crit: 1 },
      outcomes: {
        bad:  { text: 'Manuskriptene smuldrer i hendene deres. Munkene anklager dere likevel.', und: 0, trade: -1, rep: -1 },
        mid:  { text: 'Dere redder noen tekster. Munkene ser dere som menn med uvant vidd.', und: 2, trade: 0, rep: 1 },
        good: { text: 'Dere redder hovedbiblioteket. Karl den store hører om dere som annerledes-vikinger.', und: 4, trade: 0, rep: 2 },
        crit: { text: 'Munkene takker dere personlig. En kopi av Lindisfarne-evangeliene følger skipet hjem som gave.', und: 5, trade: 1, rep: 3 },
      },
      lesson: 'Det krevde mot å holde tilbake sverdet — og det banet vei for noe ingen viking hadde fått: respekt fra dem dere møtte.',
    },
  },

  paris: {
    test: {
      q: 'Hvor mye sølv fikk Ragnar i 845 av Karl den skallede?',
      opts: ['3000 pund', '5000 pund', '7000 pund'],
      correct: 2,
      feedback: '7000 pund — en astronomisk sum som satte standarden for danegeld.',
    },
    choice: {
      id: 'paris-handelsavtale',
      title: 'Forhandle frem en langvarig handelsavtale',
      desc: 'Sett dere ned med kongens menn og foreslå en avtale som varer flere år, ikke bare én avbetaling. Karl ser i dere noe han ikke fant hos de andre.',
      tag: 'trade',
      baseRoll: { bad: 1, mid: 1, good: 3, crit: 1 },
      outcomes: {
        bad:  { text: 'Forhandlingene strander — Karl mister tålmodigheten.', und: 0, trade: 0, rep: -1 },
        mid:  { text: 'Avtalen blir mindre enn dere håpet, men signert.', und: 1, trade: 2, rep: 1 },
        good: { text: 'En femårsavtale med årlige leveranser. Sølvet renner — og dere har gjort dere uunnværlige.', und: 2, trade: 4, rep: 2 },
        crit: { text: 'Karl utnevner en av dere til rådgiver. Frankrike blir aldri det samme.', und: 3, trade: 5, rep: 3 },
      },
      lesson: 'Den som ser lenger enn det neste byttet, høster lenger enn det neste vinteren.',
    },
  },

  sameland: {
    test: {
      q: 'Hva het høvdingen som beskrev det respektfulle forholdet mellom nordmenn og samer?',
      opts: ['Egil Skallagrimsson', 'Ottar fra Hålogaland', 'Harald Hårfagre'],
      correct: 1,
      feedback: 'Ottar fra Hålogaland — hans beretning til kong Alfred er en av kildene.',
    },
    choice: {
      id: 'sameland-noaidi-drommesyn',
      title: 'Be om noaidiens drømmesyn',
      desc: 'Gi en gave til en samisk noaidi og be om å få være med på en seid-rite. Få et glimt av noe nordmenn sjelden får.',
      tag: 'respect',
      baseRoll: { bad: 1, mid: 1, good: 3, crit: 1 },
      outcomes: {
        bad:  { text: 'Trommen tier. Noaiden ber dere gå med en alvorlig mine.', und: 1, trade: 0, rep: 0 },
        mid:  { text: 'Dere ser bilder dere ikke helt forstår — men dere takker.', und: 3, trade: 0, rep: 1 },
        good: { text: 'En åpenbaring om sjøveien videre. Dere forstår at samenes verden er stor og fremmed.', und: 4, trade: 1, rep: 2 },
        crit: { text: 'Noaiden gir dere en liten trumme som amulett. Dere kommer hjem som forandrede menn.', und: 5, trade: 1, rep: 2 },
      },
      lesson: 'Det er en gave å bli sluppet inn i andres helligdom — og en oppgave å bære den med ydmykhet.',
    },
  },

  vinland: {
    test: {
      q: 'Hva het Leif Erikssons far, mannen som koloniserte Grønland?',
      opts: ['Olav Tryggvason', 'Erik den røde', 'Harald Hardråde'],
      correct: 1,
      feedback: 'Erik den røde — landflyktet fra Island, koloniserte Grønland rundt 985.',
    },
    choice: {
      id: 'vinland-skraelingenes-sang',
      title: 'Lytt til skrælingenes sang før dere handler',
      desc: 'Sett dere ned. Vis at dere lytter. Da kommer kvinnene fram med ull, menn med pelser. Den røde stoffhandelen kan vare lenge.',
      tag: 'respect',
      baseRoll: { bad: 1, mid: 1, good: 3, crit: 1 },
      outcomes: {
        bad:  { text: 'En misforståelse — dere skylder feil i feil retning.', und: 0, trade: -1, rep: 0 },
        mid:  { text: 'Et tentativ bytte, en gjensidig nikking. Ikke mer, ikke mindre.', und: 2, trade: 1, rep: 1 },
        good: { text: 'Et fast handelssted etableres. Skipet seiler hjem fullt av varer ingen viking har sett.', und: 4, trade: 3, rep: 1 },
        crit: { text: 'En skræling blir med tilbake som tolk neste år. Vinland-veien er åpen.', und: 5, trade: 3, rep: 2 },
      },
      lesson: 'Tålmodighet på fremmed strand er det viktigste verktøyet — viktigere enn øksen.',
    },
  },

  baghdad: {
    test: {
      q: 'Hvilket år møtte den arabiske diplomaten Ibn Fadlan rus-vikingene ved Volga?',
      opts: ['812', '921', '966'],
      correct: 1,
      feedback: 'År 921 — hans beretning er en av de mest detaljerte vi har om vikinger.',
    },
    choice: {
      id: 'baghdad-ibn-fadlans-veiviser',
      title: 'Bli Ibn Fadlans norrøn-veiviser',
      desc: 'Vis dere som lærevillige. Forklar gravferden, ritualene, ekteskapet. Ibn Fadlan skriver om dere som «de mest fullkomne kropper» — og som folk verdt å forstå.',
      tag: 'respect',
      baseRoll: { bad: 1, mid: 1, good: 3, crit: 1 },
      outcomes: {
        bad:  { text: 'Ibn Fadlan noterer noe, men forstår fortsatt ikke. Dere er fremmed.', und: 1, trade: 0, rep: 0 },
        mid:  { text: 'En lang samtale. Han noterer nøye, dere lærer ord.', und: 3, trade: 0, rep: 1 },
        good: { text: 'Beretningen om dere blir en av de mest leste tekstene fra 900-tallet.', und: 4, trade: 1, rep: 2 },
        crit: { text: 'Kalifen selv ber om å få lese referatet. Dere får audiens som ingen har fått.', und: 5, trade: 2, rep: 3 },
      },
      lesson: 'Å bli forstått av en fremmed kultur — det er en seier som ingen plyndring kan kjøpe.',
    },
  },
};
