/**
 * DATA/INDEX.TS
 * Sentral export-fil for all spilldata
 * 
 * Brukes som: import { destinations, skillTreeData, skillQuizBank } from '../data'
 */

export { skillTreeData, getSkillName, getSkillIcon } from './skillTree';
export { destinations, getDestinationById, getAllDestinations, getRandomDestination } from './destinations';
export { skillQuizBank, getQuizQuestionsForSkill, isQuizPassed } from './quizBank';
export { gudenesProveChallenges, holmgangDueller, randomGudenesProve, randomHolmgangDuell } from './mekanikk';
export { fateCards, fateEffectLines, type FateEffect, type FateCard } from './fateCards';
