import { content } from "../src/content";
console.log(
  `${content.ports.length} havner/lagverksteder, ${content.ports.reduce((n, p) => n + p.port.choices.length, 0)} valg, ${Object.values(content.journey).reduce((n, p) => n + p.questions.length, 0)} reisespørsmål og ${Object.values(content.skillQuestions).reduce((n, b) => n + b.tier2.length + b.tier3.length, 0)} eldre prøvespørsmål er validert.`,
);
