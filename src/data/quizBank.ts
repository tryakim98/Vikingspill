/**
 * QUIZ-DATA — Ferdighetstre-quizen (67 spørsmål)
 *
 * Importeres fra vikingspill_quiz.json. Dette er den OPPSUMMERENDE quizen om alle
 * 12 land som brukes til å låse opp ferdighetsnivå 2 og 3 (verdighetsprøven, §3.2 /
 * §6.4) — IKKE stedsquizen (som ligger på hver destinasjon i innhold_v2).
 *
 * Spørsmålene filtreres på besøkte steder via `source`, slik at gruppen kun får
 * spørsmål om steder de faktisk har vært.
 */

import type { SkillQuizBank, FerdighetsTreeQuestion } from '../types';
import quizRaw from './vikingspill_quiz.json';

// Cast via unknown fordi JSON-literalen inferes med brede typer (f.eks. correct: number).
// _meta/_schema i filen utelates ved å plukke kun de fem ferdighetsnøklene.
const bank = quizRaw as unknown as SkillQuizBank;

export const skillQuizBank: SkillQuizBank = {
  språk: bank.språk,
  sjømannskap: bank.sjømannskap,
  krigskunst: bank.krigskunst,
  diplomati: bank.diplomati,
  tro: bank.tro,
};

/**
 * Hent quiz-spørsmål for en ferdighet og tier, filtrert på besøkte steder og stokket.
 * @param count antall spørsmål som returneres (3 for tier2, 4 for tier3)
 */
export function getQuizQuestionsForSkill(
  skillKey: keyof typeof skillQuizBank,
  tier: 2 | 3,
  visitedDestinations: string[],
  count: number = tier === 2 ? 3 : 4,
): FerdighetsTreeQuestion[] {
  const questions = skillQuizBank[skillKey]?.[`tier${tier}`] ?? [];
  const filtered = questions.filter((q) =>
    q.source.some((destId) => visitedDestinations.includes(destId)),
  );
  return filtered.sort(() => Math.random() - 0.5).slice(0, count);
}

/** Bestått-terskel: tier2 = 2 av 3, tier3 = 3 av 4. */
export function isQuizPassed(tier: 2 | 3, correctCount: number): boolean {
  if (tier === 2) return correctCount >= 2;
  if (tier === 3) return correctCount >= 3;
  return false;
}
