/**
 * QUIZ-DATA
 * Importer av quiz-spørsmål fra vikingspill_quiz.json
 * 
 * Det finnes to ulike quiz-systemer:
 * 1. Ferdighetstre-quiz: Låser opp ferdigheter (tier 2 og 3)
 * 2. Stedsquiz: Bonus-poeng i encounter-flyten (kommer fra v2-innhold)
 */

import type { SkillQuizBank, FerdighetsTreeQuestion } from '../types';

/**
 * FERDIGHETSTRE-QUIZ
 * 
 * Brukes når en gruppe ønsker å låse opp tier 2 eller tier 3 i en ferdighet.
 * Spørsmålene filtreres slik at gruppen kun får spørsmål om steder de har besøkt.
 * 
 * Tier 2 krever: 2 av 3 spørsmål riktig
 * Tier 3 krever: 3 av 4 spørsmål riktig + en ferdighetsspesifikk handling
 */

export const skillQuizBank: SkillQuizBank = {
  språk: {
    tier2: [
      {
        q: 'Hva betyr hilsenen «As-salamu alaykum» som vikingene lærte i Bagdad?',
        opts: ['«Lykke til med handelen»', '«Fred være med dere»', '«Vi kommer i fred»', '«Allah er stor»'],
        correct: 1,
        feedback: '«As-salamu alaykum» er arabisk for «fred være med dere». Det riktige svaret når noen sier det til deg er «Wa alaykum as-salam» — «og fred være med deg».',
        source: ['baghdad']
      },
      {
        q: 'Vikingene som styrte Novgorod ble kalt noe spesielt av slaverne. Hva?',
        opts: ['Væringer', 'Skrælinger', 'Rus', 'Normannere'],
        correct: 2,
        feedback: 'Rus — det er derfor selve landet kalles «Russland». Selv det moderne navnet på et helt land kommer fra det slaviske ordet for de svenske vikingene.',
        source: ['novgorod']
      },
      {
        q: 'På Hebridene oppstod en blandet kultur som snakket både norrønt og gælisk. Hva ble dette folket kalt?',
        opts: ['Rus', 'Væringer', 'Gall-Gàidheal', 'Skrælinger'],
        correct: 2,
        feedback: 'Gall-Gàidheal — «de utenlandske gæliske». En blanding av norrøn og keltisk kultur som varte i over 400 år.',
        source: ['hebrides']
      }
    ],
    tier3: [
      {
        q: 'Hvilket av disse engelske ordene har norrønt opphav?',
        opts: ['Bread', 'Window', 'Tree', 'Bird'],
        correct: 1,
        feedback: '«Window» kommer fra norrønt «vindauga» — vind-øye. Også egg, sky, happy, knife, law, skill, give, take og they er norrøne ord i moderne engelsk.',
        source: ['lindisfarne', 'hedeby']
      },
      {
        q: 'Hva betyr ordet «Miklagard» — det norrøne navnet på Konstantinopel?',
        opts: ['Den hellige byen', 'Den store byen', 'Den gylne byen', 'Den rike byen'],
        correct: 1,
        feedback: '«Miklagard» betyr «den store byen» (mikla = stor, garðr = by/gård). Vikingene var imponert over størrelsen — Konstantinopel hadde over en halv million innbyggere på 900-tallet.',
        source: ['miklagard']
      },
      {
        q: 'Hilsenen «Doxa to Theo» som vikingene måtte lære ved keiserhoffet — på hvilket språk er den?',
        opts: ['Latin', 'Arabisk', 'Gresk', 'Slavisk'],
        correct: 2,
        feedback: '«Doxa to Theo» er gresk og betyr «ære være Gud». Bysants-rikets offisielle språk var gresk, ikke latin — selv om de regnet seg som arvtakere etter Romerriket.',
        source: ['miklagard']
      },
      {
        q: 'Den jødiske handelsmannen Ibrahim ibn Yaqub som besøkte Hedeby kom fra hvilket område?',
        opts: ['Bagdad', 'Konstantinopel', 'Andalusia (muslimsk Spania)', 'Roma'],
        correct: 2,
        feedback: 'Ibrahim ibn Yaqub var sefardisk jøde fra al-Andalus — det muslimske Spania. Han snakket arabisk, hebraisk og latin, og hans Hedeby-beskrivelse er en sjelden utenforstående kilde.',
        source: ['hedeby']
      }
    ]
  },
  sjømannskap: {
    tier2: [
      {
        q: 'Hva var «knarr»?',
        opts: ['En type viking-øks', 'En bredhullskip designet for handel', 'En navigationsinstrument', 'Et norsk betalingsmiddel'],
        correct: 1,
        feedback: 'Knarr var et bredt, stabilt handelsskip — helt ulik drakkar (kampskoip). Knarren brukes til lange handelsreiser som til Island og Vinland.',
        source: ['island', 'vinland', 'færøyene']
      }
    ],
    tier3: []
  },
  krigskunst: {
    tier2: [],
    tier3: []
  },
  diplomati: {
    tier2: [],
    tier3: []
  },
  tro: {
    tier2: [],
    tier3: []
  }
};

/**
 * HJELPEFUNKSJON: Hent quiz-spørsmål for en gitt ferdighet og tier
 * @param skillKey - Ferdighets-nøkkel (f.eks. 'språk')
 * @param tier - 2 eller 3
 * @param visitedDestinations - Liste over destinasjons-IDer gruppen har besøkt
 * @param count - Hvor mange spørsmål skal returneres (2 for tier2, 3-4 for tier3)
 */
export function getQuizQuestionsForSkill(
  skillKey: keyof typeof skillQuizBank,
  tier: 2 | 3,
  visitedDestinations: string[],
  count: number = tier === 2 ? 3 : 4
): FerdighetsTreeQuestion[] {
  const questions = skillQuizBank[skillKey]?.[`tier${tier}`] || [];
  
  // Filtrer spørsmål slik at bare spørsmål om besøkte steder vises
  const filtered = questions.filter(q =>
    q.source.some(destId => visitedDestinations.includes(destId))
  );

  // Shuffle og returner ønsket antall
  return filtered
    .sort(() => Math.random() - 0.5)
    .slice(0, count);
}

/**
 * HJELPEFUNKSJON: Sjekk om en prøve er bestått
 * @param tier - 2 eller 3
 * @param correctCount - Antall riktige svar
 */
export function isQuizPassed(tier: 2 | 3, correctCount: number): boolean {
  if (tier === 2) return correctCount >= 2; // 2 av 3
  if (tier === 3) return correctCount >= 3; // 3 av 4
  return false;
}
