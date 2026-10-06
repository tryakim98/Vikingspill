import { content } from "../src/content";
console.log(
  `${content.ports.length} havner, ${content.ports.reduce((n, p) => n + p.port.choices.length, 0)} valg og ${Object.values(content.skillQuestions).reduce((n, b) => n + b.tier2.length + b.tier3.length, 0)} prøvespørsmål er validert.`,
);
