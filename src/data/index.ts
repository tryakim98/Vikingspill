/**
 * DATA/INDEX.TS
 * Sentral export-fil for all spilldata
 * 
 * Brukes som: import { destinations, skillTreeData, skillQuizBank } from '../data'
 */

export { skillTreeData, getSkillName, getSkillIcon } from './skillTree';
export { CREW_ROLES, CREW_ROLE_ORDER, type CrewRole } from './crewRoles';
export { KEY_CARDS, keyCardsFor, type KeyCard } from './keyCards';
export { destinations, getDestinationById, getAllDestinations, getRandomDestination } from './destinations';
export { skillQuizBank, getQuizQuestionsForSkill, isQuizPassed } from './quizBank';
export { gudenesProveChallenges, holmgangDueller, randomGudenesProve, randomHolmgangDuell } from './mekanikk';
export { fateCards, fateEffectLines, type FateEffect, type FateCard } from './fateCards';
export { TRADE_GOODS, GOODS_BY_DEST, type TradeGood, type TradeGoodInfo } from './tradeGoods';
