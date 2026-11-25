import packs from './packs.json';
import quiz from '../data/vikingspill_quiz.json';
import { validateContent } from './validate';

// Build, browser, solo and server all consume this same validated package.
export const content = validateContent(packs, quiz);
