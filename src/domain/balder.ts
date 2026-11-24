import { z } from "zod";
import { GATES, HARBOURS, PRACTICES, harbourQuiz } from "../content/balder";
import { requireRule } from "./rules";
import { shuffle, seededRandom } from "./random";
import type { Game, Group, GroupView } from "./model";

const key = z.string().regex(/^[a-z0-9_-]{1,80}$/);
const note = z.string().trim().min(20).max(2000);
const level = z.number().int().min(1).max(3);
const slots = z.array(z.number().int().min(0).max(3));
export const BalderAction = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("visit"), port: key }),
  z.object({ kind: z.literal("reflect"), port: key, text: note }),
  z.object({ kind: z.literal("quiz"), port: key, answers: slots.length(3) }),
  z.object({ kind: z.literal("submit"), trial: key, text: note }),
  z.object({
    kind: z.literal("review"),
    trial: key,
    submission: z.string(),
    approved: z.boolean(),
    feedback: z.string().trim().max(300),
  }),
  z.object({ kind: z.literal("bonus"), level, answers: slots.length(4) }),
]);
export const BalderShip = z.object({
  current: key.nullable().default(null),
  visits: z
    .record(
      key,
      z.object({
        reflection: z.string(),
        answers: slots.nullable(),
        correct: z.number().int().min(0).max(3),
      }),
    )
    .default({}),
  trials: z
    .record(
      key,
      z.object({
        id: z.string(),
        text: note,
        status: z.enum(["pending", "approved", "revise"]),
        feedback: z.string(),
      }),
    )
    .default({}),
  bonuses: z.record(z.string(), z.number().int().min(0).max(4)).default({}),
});
export type BalderState = z.infer<typeof BalderShip>;
export type Action = z.infer<typeof BalderAction>;
export const SIGNALS = ["Sol", "Måne", "Fjell", "Bølge"];
export const BONUS_RULES = [
  "Send signalene i omvendt rekkefølge.",
  "Flytt det første signalet til slutt. Behold rekkefølgen på resten.",
  "Bytt plass på signal én og to, og deretter på tre og fire.",
];
export function signalPuzzle(tier: number, seed: number) {
  const shown = shuffle([0, 1, 2, 3], seededRandom(seed));
  const [a, b, c, d] = shown;
  return {
    shown,
    solution:
      tier === 1 ? [d, c, b, a] : tier === 2 ? [b, c, d, a] : [b, a, d, c],
  };
}
export function approvedCount(state: BalderState) {
  return Object.values(state.trials).filter((t) => t.status === "approved")
    .length;
}
export function balderPoints(group: Group | GroupView) {
  const s = group.balder;
  return (
    group.scores.reputation +
    Object.values(s?.visits ?? {}).reduce((n, v) => n + v.correct, 0) +
    Object.values(s?.bonuses ?? {}).reduce((a, b) => a + b, 0)
  );
}
export function validateBalderShip(group: Group, game: Game) {
  const s = group.balder;
  if (!s) {
    requireRule(!group.visited.length, "Skipet mangler reisebok.");
    return;
  }
  const gates = approvedCount(s);
  for (const id of group.visited)
    requireRule(s.visits[id]?.answers, "Besøket mangler quizsvar.");
  if (s.current)
    requireRule(
      s.visits[s.current] && !group.visited.includes(s.current),
      "Ugyldig aktiv Balder-havn.",
    );
  for (const [id, visit] of Object.entries(s.visits)) {
    requireRule(
      Object.hasOwn(HARBOURS, id) && (GATES[id] ?? 0) <= gates,
      "Ugyldig eller låst Balder-havn.",
    );
    if (visit.answers) {
      const quiz = harbourQuiz(id),
        answers = visit.answers;
      requireRule(
        group.visited.includes(id) &&
          visit.reflection.trim().length >= 20 &&
          answers.length === quiz.length &&
          answers.every((a, i) => a < quiz[i].opts.length) &&
          visit.correct ===
            answers.filter((a, i) => a === quiz[i].correct).length,
        "Ugyldige quizsvar i reiseboka.",
      );
    } else
      requireRule(
        id === s.current && visit.correct === 0,
        "Ufullstendig besøk i reiseboka.",
      );
  }
  for (const id of Object.keys(s.trials)) {
    const trial = PRACTICES.find((t) => t.id === id);
    requireRule(
      trial && group.visited.includes(trial.port),
      "Svenneprøven mangler havnebesøk.",
    );
  }
  for (const tier of Object.keys(s.bonuses))
    requireRule(
      ["1", "2", "3"].includes(tier) &&
        game.balderSignals?.[tier] !== undefined,
      "Ukjent klasseutfordring.",
    );
}
export function applyBalder(
  game: Game,
  group: Group,
  action: Action,
  id: string,
  seed: number,
) {
  const state = (group.balder ??= BalderShip.parse({}));
  switch (action.kind) {
    case "visit": {
      requireRule(Object.hasOwn(HARBOURS, action.port), "Ukjent havn.");
      if (state.current === action.port) return;
      requireRule(!state.current, "Fullfør havna dere er i.");
      requireRule(
        !group.visited.includes(action.port),
        "Denne havna er allerede besøkt.",
      );
      const gate = GATES[action.port] ?? 0;
      const approved = approvedCount(state);
      if (gate > 0) {
        const milestone = Math.min(gate, approved + 1);
        (game.balderSignals ??= {})[String(milestone)] ??= seed;
      }
      if (gate > approved) return;
      state.current = action.port;
      state.visits[action.port] = { reflection: "", answers: null, correct: 0 };
      return;
    }
    case "reflect":
    case "quiz": {
      requireRule(
        state.current === action.port,
        "Dette gjelder en annen havn.",
      );
      const visit = state.visits[action.port];
      if (action.kind === "reflect") {
        requireRule(
          !visit.reflection,
          "Gruppa har allerede levert refleksjonen.",
        );
        visit.reflection = action.text;
      } else {
        requireRule(visit.reflection, "Lever refleksjonen før quizen.");
        const questions = harbourQuiz(action.port);
        requireRule(
          action.answers.every((a, i) => a < questions[i].opts.length),
          "Svar på alle spørsmålene.",
        );
        visit.answers = action.answers;
        visit.correct = questions.filter(
          (q, i) => q.correct === action.answers[i],
        ).length;
        group.visited.push(action.port);
        state.current = null;
      }
      return;
    }
    case "submit":
    case "review": {
      const trial = PRACTICES.find((t) => t.id === action.trial);
      requireRule(
        trial && group.visited.includes(trial.port),
        "Fullfør besøket som hører til prøven først.",
      );
      const entry = state.trials[trial.id];
      if (action.kind === "submit") {
        requireRule(
          !entry || entry.status === "revise",
          "Prøven er allerede levert.",
        );
        state.trials[trial.id] = {
          id,
          text: action.text,
          status: "pending",
          feedback: "",
        };
      } else {
        requireRule(
          entry?.id === action.submission && entry.status === "pending",
          "Denne innleveringen er allerede behandlet eller erstattet.",
        );
        requireRule(
          action.approved || action.feedback.length >= 3,
          "Skriv hva gruppa skal endre.",
        );
        entry.status = action.approved ? "approved" : "revise";
        entry.feedback = action.feedback;
      }
      return;
    }
    case "bonus": {
      const signal = game.balderSignals?.[action.level];
      requireRule(signal !== undefined, "Klasseutfordringen er ikke åpnet.");
      requireRule(
        !Object.hasOwn(state.bonuses, action.level),
        "Skipet har allerede levert.",
      );
      requireRule(
        new Set(action.answers).size === 4,
        "Bruk hvert signal én gang.",
      );
      const { solution } = signalPuzzle(action.level, signal);
      state.bonuses[action.level] = action.answers.filter(
        (a, i) => a === solution[i],
      ).length;
      return;
    }
  }
}
