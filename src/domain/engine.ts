import {
  CommandSchema,
  DEFAULT_SETTINGS,
  GameSchema,
  HELM_FAILOVER_MS,
  availableChoices,
  emptyBrev,
  portFor,
} from "./model";
import type {
  Actor,
  Command,
  Content,
  Encounter,
  Game,
  Group,
  GroupView,
  PrivateView,
  PublicView,
  Settings,
  Challenge,
} from "./model";
import type { TradeGoodId } from "../types";
import { seededRandom, shuffle } from "./random";
import { resolveRoll } from "./odds";
import { tallyVotes } from "../lib/council";
import { isAccessible } from "../lib/unlocks";
import { SPECIAL_ACTIONS } from "../data/specialActions";
import { evaluateAction } from "../lib/specialActions";
import { fateCards } from "../data/fateCards";
import { SKJEBNEMOTER } from "../data/skjebnemoter";
import { journeyTrialBank, trialAvailability, trialBank } from "./trials";
import {
  PARTY_GAMES,
  PARTY_IDS,
  partyMembers,
  partyScores,
  partyWinners,
} from "./party";
import type { PartyId } from "./party";
import {
  WHEEL_FIELDS,
  GAVE_FATE_IDS,
  STORM_FATE_IDS,
} from "../data/wheelFields";

export class RuleError extends Error {
  code: "permission" | "conflict" | "invalid";
  constructor(message: string, code: RuleError["code"] = "invalid") {
    super(message);
    this.code = code;
  }
}
function requireRule(
  ok: unknown,
  message: string,
  code: RuleError["code"] = "invalid",
): asserts ok {
  if (!ok) throw new RuleError(message, code);
}
export function newGame(
  code: string,
  teacherUid: string,
  now: number,
  mode: Game["mode"] = "classroom",
  settings: Settings = DEFAULT_SETTINGS,
): Game {
  return GameSchema.parse({
    schemaVersion: 2,
    contentVersion: 1,
    code,
    mode,
    teacherUid,
    version: 0,
    createdAt: now,
    endsAt: now + settings.minutes * 60000,
    closed: false,
    settings,
    members: {},
    groups: {},
    trades: {},
    challenges: {},
    receipts: {},
    log: [],
  });
}
export function requiredMembers(encounter: Encounter): string[] {
  return encounter.eligible.filter((id) => !encounter.excused[id]);
}
export function quizResults(encounter: Encounter, content: Content) {
  const questions = portFor(content, encounter.destId).port.stedsquiz;
  return Object.fromEntries(
    Object.entries(encounter.answers).map(([uid, answers]) => [
      uid,
      {
        correct: answers.filter((a, i) => a === questions[i]?.correct).length,
        total: questions.length,
      },
    ]),
  );
}
export function hasAdvantage(
  group: Group | GroupView,
  content: Content,
): boolean {
  const e = group.encounter;
  if (!e) return false;
  const results = "quizResults" in e ? e.quizResults : quizResults(e, content);
  const required = e.eligible.filter((id) => !e.excused[id]);
  const totals = required.map((id) => results[id]);
  const quizReady =
    totals.length > 0 &&
    totals.every((r) => r && r.total > 0 && r.correct / r.total >= 0.75);
  // Advantages do not stack, and never turn the worst outcome into a guaranteed success.
  return e.approval === "approved" || quizReady;
}
export function rollPenalty(group: Group | GroupView): number {
  return group.encounter?.destId === "paris" &&
    group.saga.some(
      (s) => s.destId === "lindisfarne" && s.choiceId === "plunder",
    )
    ? -1
    : 0;
}
function resolveCouncil(group: Group) {
  const e = group.encounter!;
  const eligible = requiredMembers(e);
  const tally = tallyVotes(e.votes, eligible, e.choiceIds);
  if (eligible.length > 0 && tally.votedCount === eligible.length) {
    e.topIds = tally.topIds;
    e.choiceId = tally.topIds.length === 1 ? tally.topIds[0] : null;
    e.phase = "decision";
  }
}
function scores(group: Group, delta: { trade?: number; rep?: number }) {
  group.scores.tradeGain += delta.trade ?? 0;
  group.scores.reputation += delta.rep ?? 0;
}
function goodsEnough(
  group: Group,
  goods: Partial<Record<TradeGoodId, number>>,
) {
  return Object.entries(goods).every(
    ([id, amount]) => (group.goods[id as TradeGoodId] ?? 0) >= amount!,
  );
}
function goodsChange(
  group: Group,
  goods: Partial<Record<TradeGoodId, number>>,
  sign: 1 | -1,
) {
  for (const [id, amount] of Object.entries(goods))
    group.goods[id as TradeGoodId] =
      (group.goods[id as TradeGoodId] ?? 0) + sign * amount!;
}
function questionBank(group: Group, content: Content) {
  return trialBank(group.trial!, content);
}
function createParty(
  game: Game,
  id: string,
  kind: Challenge["kind"],
  groups: string[],
  activity: PartyId,
  seed: number,
  title: string,
): Challenge {
  requireRule(
    groups.length &&
      groups.every((g) => Object.keys(game.groups[g].members).length),
    "Alle skip må ha et mannskap.",
  );
  requireRule(
    !Object.values(game.challenges).some(
      (c) => c.status === "open" && c.groups.some((g) => groups.includes(g)),
    ),
    "Fullfør eller avlys den åpne lagleken først.",
  );
  return {
    id,
    kind,
    groups,
    activity,
    title,
    status: "open",
    winnerId: null,
    winnerIds: [],
    phase: "waiting",
    roster: Object.fromEntries(
      groups.map((g) => [g, Object.keys(game.groups[g].members)]),
    ),
    ready: [],
    excused: {},
    results: {},
    startsAt: null,
    endsAt: null,
    seed,
  };
}
function beginParty(challenge: Challenge, now: number) {
  requireRule(
    challenge.status === "open" && challenge.phase === "waiting",
    "Lagleken er allerede startet.",
  );
  const members = challenge.groups.flatMap((g) => partyMembers(challenge, g));
  requireRule(
    challenge.groups.every((g) => partyMembers(challenge, g).length > 0) &&
      members.every((uid) => challenge.ready.includes(uid)),
    "Alle aktive medlemmer må være klare før start.",
  );
  challenge.phase = "playing";
  challenge.startsAt = now + 5000;
  challenge.endsAt =
    challenge.startsAt + PARTY_GAMES[challenge.activity].duration * 1000;
}

/** Pure state transition. No UI, clock, network or Math.random; commands supply all context. */
export function applyCommand(
  previous: Game,
  input: unknown,
  actor: Actor,
  content: Content,
): Game {
  const parsed = CommandSchema.safeParse(input);
  requireRule(parsed.success, "Kommandoen har ugyldige felt.");
  const cmd = parsed.data;
  const receiptId = `${actor.uid}:${cmd.id}`;
  if (Object.hasOwn(previous.receipts, receiptId)) return previous;
  const teacher = previous.teacherUid === actor.uid;
  requireRule(
    !previous.closed ||
      (teacher && ["join", "assess", "approve_trial"].includes(cmd.type)),
    "Spillet er avsluttet.",
  );
  const game = structuredClone(previous);
  const random = seededRandom(actor.seed);
  const group = cmd.groupId ? game.groups[cmd.groupId] : undefined;
  // Game-wide commands and member-local commands use versions at the relevant aggregate.
  requireRule(
    cmd.expectedVersion === (group?.version ?? game.version),
    "Tilstanden er endret. Hent den nyeste og prøv igjen.",
    "conflict",
  );
  requireRule(
    !cmd.encounterId || group?.encounter?.id === cmd.encounterId,
    "Handlingen gjelder et tidligere kulturmøte.",
  );
  requireRule(
    !cmd.trialId || group?.trial?.id === cmd.trialId,
    "Handlingen gjelder en tidligere prøve.",
  );
  const isMember = !!group?.members[actor.uid];
  const member = () =>
    requireRule(
      group && isMember && game.members[actor.uid]?.groupId === group.id,
      "Du er ikke medlem av dette skipet.",
      "permission",
    );
  const chief = () => {
    member();
    requireRule(
      group!.chiefId === actor.uid,
      "Bare høvdingen kan gjøre dette.",
      "permission",
    );
  };
  const teacherOnly = () =>
    requireRule(teacher, "Bare spillets lærer kan gjøre dette.", "permission");
  const encounter = (...phases: Encounter["phase"][]) => {
    requireRule(
      group?.encounter && phases.includes(group.encounter.phase),
      "Dette passer ikke i steget dere er i.",
    );
    return group.encounter;
  };
  let message: string = cmd.type;
  const notice = (g: Group, title: string, text: string) =>
    g.notices.push({ id: cmd.id, title, text, at: actor.now, ackedBy: [] });

  switch (cmd.type) {
    case "join":
      requireRule(
        !cmd.groupId,
        "Innmelding gjelder klasserommet, ikke en gruppe.",
      );
      game.members[actor.uid] ??= { groupId: null };
      message = "Et medlem koblet seg til klasserommet.";
      break;
    case "create_ship": {
      requireRule(
        game.members[actor.uid] && !game.members[actor.uid].groupId,
        "Bli med i spillet først.",
      );
      requireRule(cmd.groupId && !group, "Skipet finnes allerede.");
      game.groups[cmd.groupId] = {
        id: cmd.groupId,
        version: 0,
        shipName: cmd.shipName,
        shipSymbol: cmd.shipSymbol,
        shipColor: cmd.shipColor,
        members: {
          [actor.uid]: {
            label: cmd.label,
            joinedAt: actor.now,
          },
        },
        chiefId: actor.uid,
        scores: { culturalUnderstanding: 0, tradeGain: 0, reputation: 0 },
        svennebrev: emptyBrev(),
        conditions: {},
        goods: {},
        visited: [],
        locked: [],
        unlockedSides: [],
        performedActions: [],
        saga: [],
        encounter: null,
        trial: null,
        ting: null,
        lastTingAt: 0,
        cardCounts: {},
        notices: [],
        seenJourneys: [],
        lastJourneyVisits: 0,
        nextInterlude: false,
      };
      game.members[actor.uid].groupId = cmd.groupId;
      message = `Skipet ${cmd.shipName} ble opprettet.`;
      break;
    }
    case "join_ship":
      requireRule(
        group && game.members[actor.uid],
        "Skipet eller spillet finnes ikke.",
      );
      requireRule(
        !game.members[actor.uid].groupId ||
          game.members[actor.uid].groupId === group.id,
        "Du er allerede ombord på et annet skip.",
      );
      group.members[actor.uid] = {
        joinedAt: group.members[actor.uid]?.joinedAt ?? actor.now,
        label: cmd.label,
      };
      if (!group.members[group.chiefId]) group.chiefId = actor.uid;
      game.members[actor.uid].groupId = group.id;
      message = `${cmd.label} ble med ombord.`;
      break;
    case "leave_ship":
      member();
      requireRule(
        !Object.values(game.challenges).some(
          (c) =>
            c.status === "open" &&
            partyMembers(c, group!.id).includes(actor.uid),
        ),
        "Fullfør lagleken eller be læreren frita deg først.",
      );
      requireRule(
        group!.trial?.ownerId !== actor.uid,
        "Avslutt prøven før du forlater skipet.",
      );
      requireRule(
        !group!.encounter ||
          !requiredMembers(group!.encounter).includes(actor.uid),
        "Læreren må frita deg fra den pågående runden før du forlater skipet.",
      );
      delete group!.members[actor.uid];
      game.members[actor.uid].groupId = null;
      if (group!.chiefId === actor.uid)
        group!.chiefId = Object.keys(group!.members)[0] ?? actor.uid;
      break;
    case "sail": {
      chief();
      requireRule(
        !group!.encounter && !group!.trial,
        "Avslutt møtet eller prøven først.",
      );
      const pack = portFor(content, cmd.destId);
      requireRule(
        !group!.visited.includes(cmd.destId) && isAccessible(pack.port, group!),
        "Denne havnen er besøkt eller ikke åpen ennå.",
      );
      const eligible = Object.keys(group!.members).filter(
        (id) =>
          actor.now - (actor.presence[id] ?? 0) <= 60000 || id === actor.uid,
      );
      group!.encounter = {
        id: cmd.id,
        destId: cmd.destId,
        settings: structuredClone(game.settings),
        phase: "sailing",
        arrivesAt: actor.now + 3000,
        eligible,
        excused: {},
        evidence: {},
        answers: {},
        votes: {},
        choiceIds: availableChoices(group!, pack.port).map((c) => c.id),
        topIds: [],
        choiceId: null,
        reason: "",
        reflection: "",
        card: null,
        approval: "none",
        approvalFeedback: "",
        roll: null,
        settled: false,
        interlude: null,
      };
      if (
        group!.nextInterlude ||
        (group!.visited.length - group!.lastJourneyVisits >= 2 &&
          random() < 0.22)
      ) {
        const journey = shuffle(
          SKJEBNEMOTER.filter(
            (j) => group!.nextInterlude || !group!.seenJourneys.includes(j.id),
          ),
          random,
        )[0];
        if (journey) {
          group!.encounter.interlude = {
            id: journey.id,
            choiceId: null,
            text: "",
            roll: null,
            bonus: 0,
          };
          group!.seenJourneys.push(journey.id);
          group!.lastJourneyVisits = group!.visited.length;
        }
        group!.nextInterlude = false;
      }
      message = `Seilas til ${pack.port.name}; mannskapet for runden er fastsatt.`;
      break;
    }
    case "arrive":
      member();
      if (!group!.encounter || group!.encounter.phase !== "sailing") break;
      requireRule(
        actor.now >= encounter("sailing").arrivesAt,
        "Seilasen pågår ennå.",
      );
      requireRule(
        !group!.encounter!.interlude || group!.encounter!.interlude.choiceId,
        "Avslutt skjebnemøtet før ankomst.",
      );
      group!.encounter!.phase = "reading";
      break;
    case "journey_choice": {
      chief();
      const e = encounter("sailing");
      const interlude = e.interlude;
      requireRule(
        interlude && !interlude.choiceId,
        "Skjebnemøtet er allerede avgjort.",
      );
      const choice = SKJEBNEMOTER.find(
        (j) => j.id === interlude.id,
      )?.choices.find((c) => c.id === cmd.choiceId);
      requireRule(choice, "Ukjent valg i skjebnemøtet.");
      let text = choice.outcome ?? "";
      let effect = choice.effects;
      if (choice.roll) {
        interlude.roll = 1 + Math.floor(random() * 6);
        interlude.bonus = choice.roll.skill
          ? Math.max(
              0,
              Math.min(
                1,
                group!.svennebrev[choice.roll.skill] +
                  (group!.conditions[choice.roll.skill] ?? 0),
              ),
            )
          : 0;
        const result =
          interlude.roll + interlude.bonus >= (choice.roll.threshold ?? 4)
            ? choice.roll.win
            : choice.roll.lose;
        text = result.outcome;
        effect = result.effects;
      }
      scores(group!, { trade: effect?.tradeGain, rep: effect?.reputation });
      if (effect?.skill)
        group!.conditions[effect.skill.key] = Math.max(
          -2,
          Math.min(
            2,
            (group!.conditions[effect.skill.key] ?? 0) + effect.skill.delta,
          ),
        );
      interlude.choiceId = cmd.choiceId;
      interlude.text = text;
      message = `Skjebnemøte ${interlude.id}: ${cmd.choiceId}; alle virkninger gjennomført samlet, uten å endre kompetansebevis.`;
      break;
    }
    case "advance": {
      chief();
      const e = encounter("reading", "tasks", "result");
      if (e.phase === "reading") e.phase = "tasks";
      else if (e.phase === "tasks") {
        const eligible = requiredMembers(e);
        requireRule(
          eligible.length > 0 &&
            eligible.every(
              (id) =>
                e.evidence[id] &&
                (!e.settings.requireQuiz || e.answers[id]?.length === 4),
            ),
          "Alle i rundens mannskap må levere sitt bidrag først.",
        );
        e.phase =
          e.settings.requireCouncil && game.mode === "classroom"
            ? "council"
            : "decision";
        e.approval = game.mode === "classroom" ? "pending" : "none";
      } else e.phase = "reflection";
      break;
    }
    case "contribute": {
      member();
      const e = encounter("tasks");
      requireRule(
        requiredMembers(e).includes(actor.uid),
        "Du deltar fra neste runde.",
      );
      const pack = portFor(content, e.destId);
      requireRule(
        pack.sources.some((s) => s.id === cmd.evidence.sourceId),
        "Velg en kilde fra denne havnen.",
      );
      requireRule(
        !e.settings.requireQuiz ||
          cmd.answers.length === pack.port.stedsquiz.length,
        "Svar på alle spørsmålene.",
      );
      requireRule(
        cmd.answers.every(
          (answer, i) => answer < pack.port.stedsquiz[i].opts.length,
        ),
        "Ugyldig svaralternativ.",
      );
      requireRule(
        !e.settings.requirePerspective || cmd.evidence.perspective.length >= 20,
        "Undersøk den andre partens perspektiv.",
      );
      requireRule(!e.evidence[actor.uid], "Bidraget ditt er allerede levert.");
      e.evidence[actor.uid] = cmd.evidence;
      e.answers[actor.uid] = cmd.answers;
      message = "Et individuelt fagbidrag ble levert.";
      break;
    }
    case "vote": {
      member();
      const e = encounter("council");
      requireRule(
        requiredMembers(e).includes(actor.uid) &&
          e.choiceIds.includes(cmd.choiceId),
        "Ugyldig stemme.",
      );
      requireRule(!e.votes[actor.uid], "Stemmen din er forseglet.");
      e.votes[actor.uid] = {
        choiceId: cmd.choiceId,
        note: cmd.note,
        suspicion: cmd.suspicion,
      };
      resolveCouncil(group!);
      message = "En hemmelig stemme ble forseglet.";
      break;
    }
    case "decide": {
      chief();
      const e = encounter("decision");
      requireRule(
        (e.settings.requireCouncil && game.mode === "classroom"
          ? e.topIds
          : e.choiceIds
        ).includes(cmd.choiceId),
        "Valget må følge flertallet; høvdingen bryter bare likhet.",
      );
      requireRule(
        !e.settings.requireSaga || cmd.reason.length >= 20,
        "Begrunn avgjørelsen med minst 20 tegn.",
      );
      e.choiceId = cmd.choiceId;
      e.reason = cmd.reason;
      message = `Avgjørelsen ${cmd.choiceId} ble begrunnet før terningen.`;
      break;
    }
    case "roll": {
      chief();
      const e = encounter("decision");
      requireRule(
        e.choiceId &&
          (!e.settings.requireSaga || e.reason.length >= 20) &&
          !e.settled,
        "Begrunn og bekreft avgjørelsen først.",
      );
      const pack = portFor(content, e.destId);
      const choice = [
        ...pack.port.choices,
        ...(pack.port.hiddenChoice ? [pack.port.hiddenChoice.choice] : []),
      ].find((c) => c.id === e.choiceId)!;
      const roll = resolveRoll(
        choice.baseRoll,
        hasAdvantage(group!, content),
        rollPenalty(group!),
        random,
      );
      const outcome = choice.outcomes[roll.tier];
      requireRule(outcome, "Innholdet mangler dette utfallet.");
      e.roll = roll;
      e.settled = true;
      e.phase = "result";
      // Knowledge is assessed separately; luck changes only the expedition's resources/reputation.
      scores(group!, { trade: outcome.trade, rep: outcome.rep });
      const reward = Object.fromEntries(
        pack.port.goodsReward.map((id) => [
          id,
          pack.port.goodsReward.filter((g) => g === id).length,
        ]),
      );
      goodsChange(group!, reward, 1);
      group!.visited.push(e.destId);
      group!.locked = [
        ...new Set([
          ...group!.locked,
          ...(choice.locks ?? []).filter((id) => id !== "paris"),
        ]),
      ];
      const honors =
        e.card?.kind === "agenda"
          ? Object.entries(e.votes)
              .filter(
                ([, v]) =>
                  v.suspicion &&
                  v.choiceId !== e.card!.favors &&
                  v.note.length >= 20,
              )
              .map(([id]) => id)
          : [];
      group!.saga.push({
        id: e.id,
        destId: e.destId,
        destName: pack.port.name,
        choiceId: choice.id,
        choiceTitle: choice.title,
        reason: e.reason,
        at: actor.now,
        roll,
        trade: outcome.trade,
        reputation: outcome.rep,
        goods: reward,
        quiz: quizResults(e, content),
        evidence: e.evidence,
        reflection: "",
        historicalComparison: "",
        cardReveal: e.card?.reveal ?? "",
        honors,
        assessment: null,
      });
      message = `Kast ${roll.dice.join("/")} → ${roll.tier}; handel ${outcome.trade}, rykte ${outcome.rep}. Oppgjør gjennomført én gang.`;
      break;
    }
    case "reflect": {
      chief();
      const e = encounter("reflection");
      const pack = portFor(content, e.destId);
      requireRule(
        !e.settings.requireBridge ||
          !pack.port.modernBridge ||
          cmd.reflection.length >= 20,
        "Skriv refleksjonen før dere seiler videre.",
      );
      const saga = group!.saga.find((s) => s.id === e.id)!;
      saga.reflection = cmd.reflection;
      saga.historicalComparison = cmd.historicalComparison;
      e.reflection = cmd.historicalComparison;
      break;
    }
    case "finish":
      chief();
      requireRule(
        encounter("reflection").reflection.length >= 20,
        "Sammenlign med historien først.",
      );
      group!.encounter = null;
      break;
    case "action": {
      chief();
      const action = SPECIAL_ACTIONS.find((a) => a.id === cmd.actionId);
      requireRule(
        action && group!.visited.includes(action.destId),
        "Handling krever at havnen er besøkt.",
      );
      const result = evaluateAction(action, group!, group!.performedActions);
      requireRule(
        result.available,
        result.performed
          ? "Handlingen er allerede utført."
          : `Dere mangler: ${result.missing.join(", ")}.`,
      );
      scores(group!, {
        trade: -(action.cost?.trade ?? 0) + (action.effect.trade ?? 0),
        rep: -(action.cost?.rep ?? 0) + (action.effect.rep ?? 0),
      });
      requireRule(
        !action.cost?.und ||
          group!.scores.culturalUnderstanding >= action.cost.und,
        "Faglig vurdering kan ikke brukes som valuta.",
      );
      goodsChange(group!, action.cost?.goods ?? {}, -1);
      goodsChange(group!, action.effect.goods ?? {}, 1);
      if (action.effect.skill)
        group!.conditions[action.effect.skill.key] = Math.max(
          -2,
          Math.min(
            2,
            (group!.conditions[action.effect.skill.key] ?? 0) +
              action.effect.skill.delta,
          ),
        );
      group!.unlockedSides = [
        ...new Set([...group!.unlockedSides, ...(action.effect.unlocks ?? [])]),
      ];
      group!.performedActions.push(action.id);
      message = `Spesialhandling ${action.label}; kostnad og virkning ble gjennomført samlet. Kompetansebevis krever fortsatt prøve.`;
      break;
    }
    case "transfer":
      if (teacher) teacherOnly();
      else chief();
      requireRule(group?.members[cmd.memberId], "Kandidaten er ikke ombord.");
      group.chiefId = cmd.memberId;
      message = "Roret ble overført.";
      break;
    case "remove_member": {
      teacherOnly();
      requireRule(group?.members[cmd.memberId], "Medlemmet er ikke ombord.");
      requireRule(
        Object.keys(group.members).length > 1,
        "Det siste medlemmet kan ikke fjernes fra skipet.",
      );

      // Et medlem som er låst inn i en pågående runde må ikke kunne blokkere resten
      // etter at læreren har fjernet en feilregistrert/frakoblet enhet.
      if (group.encounter?.eligible.includes(cmd.memberId) && !group.encounter.settled) {
        group.encounter.excused[cmd.memberId] =
          "Fjernet av læreren fra mannskapet.";
        resolveCouncil(group);
      }

      // En individuell svenneprøve kan ikke bli stående eid av en bruker som ikke
      // lenger finnes ombord.
      if (group.trial?.ownerId === cmd.memberId) {
        group.trial = null;
        notice(
          group,
          "Svenneprøven ble avbrutt",
          "Prøven ble lukket fordi deltakeren ble fjernet fra skipet.",
        );
      }

      // Åpne lagleker har et frosset roster. Fritak bevarer hendelsen, men den
      // fjernede enheten teller ikke lenger som et krav for å komme videre.
      for (const challenge of Object.values(game.challenges)) {
        if (
          challenge.status === "open" &&
          partyMembers(challenge, group.id).includes(cmd.memberId)
        ) {
          challenge.excused[cmd.memberId] = "Fjernet av læreren fra mannskapet.";
        }
      }

      // Et pågående ting med en fjernet kandidat/sittende høvding er ikke lenger
      // meningsfullt. Start heller et nytt ting med det faktiske mannskapet.
      if (
        group.ting &&
        (group.ting.candidateId === cmd.memberId ||
          group.ting.incumbentId === cmd.memberId ||
          group.ting.eligible.includes(cmd.memberId))
      ) {
        group.ting = null;
      }

      delete group.members[cmd.memberId];
      if (game.members[cmd.memberId]) game.members[cmd.memberId].groupId = null;
      if (group.chiefId === cmd.memberId) {
        group.chiefId = Object.keys(group.members)[0];
        notice(
          group,
          "Nytt ror",
          `${group.members[group.chiefId].label} tok over roret etter at læreren ryddet mannskapet.`,
        );
      }
      message = "Læreren fjernet et medlem fra skipet uten å nullstille fremgangen.";
      break;
    }
    case "take_helm":
      member();
      requireRule(
        actor.now - (actor.presence[group!.chiefId] ?? 0) > HELM_FAILOVER_MS,
        "Høvdingen er tilkoblet eller innenfor gjenoppkoblingsfristen.",
      );
      group!.chiefId = actor.uid;
      message = `Et medlem tok roret etter ${HELM_FAILOVER_MS / 1000} sekunders frakobling.`;
      break;
    case "call_ting":
      member();
      requireRule(
        group!.members[cmd.candidateId] &&
          cmd.candidateId !== group!.chiefId &&
          !group!.ting &&
          actor.now - group!.lastTingAt >= 180000,
        "Tinget kan ikke åpnes nå.",
      );
      group!.ting = {
        id: cmd.id,
        candidateId: cmd.candidateId,
        incumbentId: group!.chiefId,
        eligible: Object.keys(group!.members).filter(
          (id) =>
            actor.now - (actor.presence[id] ?? 0) <= 60000 || id === actor.uid,
        ),
        votes: {},
        startedAt: actor.now,
      };
      group!.lastTingAt = actor.now;
      break;
    case "ting_vote": {
      member();
      const ting = group!.ting;
      requireRule(
        ting &&
          ting.eligible.includes(actor.uid) &&
          [ting.incumbentId, ting.candidateId].includes(cmd.candidateId) &&
          !ting.votes[actor.uid],
        "Stemmen er ugyldig eller allerede avgitt.",
      );
      ting.votes[actor.uid] = cmd.candidateId;
      if (ting.eligible.every((id) => ting.votes[id])) {
        const votes = ting.eligible.filter(
          (id) => ting.votes[id] === ting.candidateId,
        ).length;
        if (votes > ting.eligible.length / 2) group!.chiefId = ting.candidateId;
        notice(
          group!,
          "Tinget er avsluttet",
          `Roret går til ${group!.members[group!.chiefId].label}.`,
        );
        group!.ting = null;
      }
      break;
    }
    case "start_trial": {
      chief();
      requireRule(
        !group!.encounter && !group!.trial && group!.svennebrev[cmd.skill] < 2,
        "Prøven kan ikke åpnes nå.",
      );
      const level = (group!.svennebrev[cmd.skill] + 1) as 1 | 2;
      const availability = trialAvailability(group!, cmd.skill);
      requireRule(
        availability.available,
        `Fullfør besøkene i ${availability.missing.map((id) => portFor(content, id).port.name).join(", ")} for å låse opp prøven.`,
      );
      const bank = journeyTrialBank(content, cmd.skill, level);
      const candidates = shuffle(
        bank
          .map((q, i) => ({ q, i }))
          .filter(({ q }) =>
            q.source.every((id) => group!.visited.includes(id)),
          )
          .map(({ i }) => i),
        random,
      );
      // Include every prerequisite location, then fill the remaining question slots.
      const coverage = availability.route.ports.map(
        (id) => candidates.find((i) => bank[i].source.includes(id))!,
      );
      const indices = shuffle(
        [
          ...coverage,
          ...candidates
            .filter((i) => !coverage.includes(i))
            .slice(0, (level === 1 ? 3 : 4) - coverage.length),
        ],
        random,
      );
      requireRule(
        indices.length === (level === 1 ? 3 : 4),
        "Besøk flere havner før denne prøven.",
      );
      group!.trial = {
        id: cmd.id,
        ownerId: actor.uid,
        skill: cmd.skill,
        level,
        questionIndices: indices,
        bankVersion: "journey-v1",
        requiredPorts: [...availability.route.ports],
        practiceTitle: availability.route.title,
        practicePrompt: availability.route.practice,
        answers: [],
        phase: "quiz",
        practice: "",
        feedback: "",
      };
      break;
    }
    case "answer_trial": {
      member();
      const trial = group!.trial;
      requireRule(
        trial &&
          trial.ownerId === actor.uid &&
          trial.phase === "quiz" &&
          cmd.answers.length === trial.questionIndices.length,
        "Dette er ikke din åpne prøve.",
      );
      const bank = questionBank(group!, content);
      requireRule(
        cmd.answers.every(
          (a, i) => a < bank[trial.questionIndices[i]].opts.length,
        ),
        "Ugyldig svar.",
      );
      trial.answers = cmd.answers;
      const correct = cmd.answers.filter(
        (a, i) => a === bank[trial.questionIndices[i]].correct,
      ).length;
      trial.phase =
        correct >= (trial.level === 1 ? 2 : 3) ? "practice" : "failed";
      trial.feedback = `${correct} av ${trial.answers.length} riktige.`;
      break;
    }
    case "practice":
      member();
      requireRule(
        group!.trial?.ownerId === actor.uid &&
          group!.trial.phase === "practice",
        "Du kan ikke levere denne prøven.",
      );
      group!.trial.practice = cmd.text;
      group!.trial.phase = "pending";
      break;
    case "close_trial":
      member();
      requireRule(
        group!.trial?.ownerId === actor.uid &&
          ["failed", "passed"].includes(group!.trial.phase),
        "Prøven eies av den som startet den; åpne vurderinger kan ikke lukkes.",
      );
      group!.trial = null;
      break;
    case "offer_trade": {
      chief();
      requireRule(
        game.groups[cmd.to] &&
          cmd.to !== group!.id &&
          Object.values(cmd.offer).some((n) => n! > 0) &&
          Object.values(cmd.request).some((n) => n! > 0),
        "Velg to skip og minst én vare hver vei.",
      );
      requireRule(
        goodsEnough(group!, cmd.offer),
        "Dere har ikke varene som tilbys.",
      );
      game.trades[cmd.id] = {
        id: cmd.id,
        from: group!.id,
        to: cmd.to,
        offer: cmd.offer,
        request: cmd.request,
        status: "pending",
        at: actor.now,
        resolvedAt: null,
      };
      break;
    }
    case "accept_trade": {
      chief();
      const trade = game.trades[cmd.tradeId];
      requireRule(
        trade?.status === "pending" && trade.to === group!.id,
        "Handelen er allerede avsluttet eller gjelder et annet skip.",
      );
      const from = game.groups[trade.from];
      requireRule(
        goodsEnough(from, trade.offer) && goodsEnough(group!, trade.request),
        "En av gruppene har brukt varene. Lag en ny avtale.",
      );
      goodsChange(from, trade.offer, -1);
      goodsChange(from, trade.request, 1);
      goodsChange(group!, trade.request, -1);
      goodsChange(group!, trade.offer, 1);
      from.version++;
      trade.status = "accepted";
      trade.resolvedAt = actor.now;
      message = "Byttehandelen ble gjennomført atomisk mellom begge skip.";
      break;
    }
    case "reject_trade":
      chief();
      requireRule(
        game.trades[cmd.tradeId]?.status === "pending" &&
          [game.trades[cmd.tradeId].from, game.trades[cmd.tradeId].to].includes(
            group!.id,
          ),
        "Handelen kan ikke avslås.",
      );
      game.trades[cmd.tradeId].status = "rejected";
      game.trades[cmd.tradeId].resolvedAt = actor.now;
      break;
    case "challenge":
      chief();
      requireRule(
        game.groups[cmd.to] && cmd.to !== group!.id,
        "Velg et annet skip.",
      );
      game.challenges[cmd.id] = createParty(
        game,
        cmd.id,
        "duel",
        [group!.id, cmd.to],
        cmd.activity,
        actor.seed,
        `Holmgang · ${PARTY_GAMES[cmd.activity].title}`,
      );
      break;
    case "ready_challenge": {
      member();
      const c = game.challenges[cmd.challengeId];
      requireRule(
        c?.status === "open" &&
          c.phase === "waiting" &&
          partyMembers(c, group!.id).includes(actor.uid),
        "Du deltar ikke i denne åpne lagleken.",
      );
      if (!c.ready.includes(actor.uid)) c.ready.push(actor.uid);
      if (
        (c.kind === "duel" || game.mode === "solo") &&
        c.groups
          .flatMap((g) => partyMembers(c, g))
          .every((uid) => c.ready.includes(uid))
      )
        beginParty(c, actor.now);
      break;
    }
    case "start_challenge": {
      teacherOnly();
      const c = game.challenges[cmd.challengeId];
      requireRule(c, "Lagleken finnes ikke.");
      beginParty(c, actor.now);
      break;
    }
    case "submit_challenge": {
      member();
      const c = game.challenges[cmd.challengeId];
      requireRule(
        c?.status === "open" &&
          c.phase === "playing" &&
          partyMembers(c, group!.id).includes(actor.uid) &&
          c.ready.includes(actor.uid),
        "Du deltar ikke i denne lagleken.",
      );
      requireRule(
        c.endsAt && actor.now >= c.endsAt,
        "Lagleken pågår fortsatt.",
      );
      requireRule(
        !Object.hasOwn(c.results, actor.uid),
        "Resultatet ditt er allerede levert.",
      );
      const activity = PARTY_GAMES[c.activity];
      requireRule(
        activity.digital
          ? cmd.score <= activity.duration * 25
          : cmd.score === 0,
        "Resultatet er utenfor lekens grenser.",
      );
      c.results[actor.uid] = cmd.score;
      break;
    }
    case "excuse_challenge": {
      teacherOnly();
      const c = game.challenges[cmd.challengeId];
      requireRule(
        c?.status === "open" &&
          c.phase === "waiting" &&
          Object.values(c.roster).some((ids) => ids.includes(cmd.memberId)),
        "Fritak må gjøres før leken starter.",
      );
      requireRule(
        !c.groups.some(
          (g) =>
            partyMembers(c, g).includes(cmd.memberId) &&
            partyMembers(c, g).length <= 1,
        ),
        "Et skip må ha minst én deltaker.",
      );
      c.excused[cmd.memberId] = cmd.reason;
      break;
    }
    case "cancel_challenge": {
      teacherOnly();
      const c = game.challenges[cmd.challengeId];
      requireRule(c?.status === "open", "Lagleken er allerede avsluttet.");
      c.status = "resolved";
      c.phase = "finished";
      break;
    }
    case "ack":
      member();
      requireRule(
        group!.notices.some((n) => n.id === cmd.noticeId),
        "Varslet finnes ikke.",
      );
      for (const n of group!.notices)
        if (n.id === cmd.noticeId && !n.ackedBy.includes(actor.uid))
          n.ackedBy.push(actor.uid);
      message = "Et medlem kvitterte for et allerede gjennomført varsel.";
      break;
    case "settings":
      teacherOnly();
      game.settings = cmd.settings;
      game.endsAt = game.createdAt + cmd.settings.minutes * 60000;
      message = "Læreren endret øktoppsettet.";
      break;
    case "close_game":
      teacherOnly();
      game.closed = true;
      break;
    case "excuse": {
      teacherOnly();
      requireRule(group, "Skipet finnes ikke.");
      if (group.encounter) {
        const e = group.encounter;
        requireRule(
          e.eligible.includes(cmd.memberId) &&
            !e.votes[cmd.memberId] &&
            !e.settled &&
            requiredMembers(e).length > 1,
          "Medlemmet kan ikke fritas nå.",
        );
        e.excused[cmd.memberId] = cmd.reason;
        if (e.phase === "council") resolveCouncil(group);
      } else if (group.ting) {
        requireRule(
          group.ting.eligible.includes(cmd.memberId) &&
            !group.ting.votes[cmd.memberId],
          "Medlemmet kan ikke fritas fra tinget.",
        );
        group.ting.eligible = group.ting.eligible.filter(
          (id) => id !== cmd.memberId,
        );
        const t = group.ting;
        if (t.eligible.every((id) => t.votes[id])) {
          if (
            t.eligible.filter((id) => t.votes[id] === t.candidateId).length >
            t.eligible.length / 2
          )
            group.chiefId = t.candidateId;
          group.ting = null;
        }
      } else throw new RuleError("Ingen aktiv avstemning eller runde.");
      message = `Læreren fritok ett medlem: ${cmd.reason}`;
      break;
    }
    case "approve_task":
      teacherOnly();
      requireRule(
        group?.encounter &&
          group.encounter.approval === "pending" &&
          !group.encounter.settled,
        "Oppgaven venter ikke på godkjenning eller kastet er allerede gjennomført.",
      );
      group.encounter.approval = cmd.approved ? "approved" : "rejected";
      group.encounter.approvalFeedback = cmd.feedback;
      message = `Oppgaven ble ${cmd.approved ? "godkjent" : "returnert"} med faglig tilbakemelding.`;
      break;
    case "approve_trial":
      teacherOnly();
      requireRule(
        group?.trial?.phase === "pending",
        "Prøven venter ikke på vurdering.",
      );
      group.trial.phase = cmd.approved ? "passed" : "failed";
      group.trial.feedback = cmd.feedback;
      if (cmd.approved) group.svennebrev[group.trial.skill] = group.trial.level;
      break;
    case "assess": {
      teacherOnly();
      const saga = group?.saga.find((s) => s.id === cmd.sagaId);
      requireRule(saga && group, "Sagaen finnes ikke.");
      saga.assessment = cmd.rubric;
      group.scores.culturalUnderstanding = group.saga.reduce(
        (sum, s) =>
          sum +
          (s.assessment
            ? s.assessment.reasoning +
              s.assessment.sourceUse +
              s.assessment.perspective
            : 0),
        0,
      );
      message =
        "Begrunnelse, kildebruk og perspektiv ble vurdert uavhengig av terningen.";
      break;
    }
    case "event": {
      teacherOnly();
      const ids = Object.keys(game.groups).filter(
        (id) => Object.keys(game.groups[id].members).length > 0,
      );
      requireRule(ids.length > 0, "Ingen skip i spillet ennå.");
      if (cmd.kind === "trial") {
        game.challenges[cmd.id] = createParty(
          game,
          cmd.id,
          "trial",
          ids,
          cmd.activity ?? "tapping",
          actor.seed,
          cmd.title,
        );
      } else {
        const card = cmd.kind === "fate" ? shuffle(fateCards, random)[0] : null;
        const targets =
          card?.targetMode === "group"
            ? [shuffle(ids, random)[0]]
            : card?.condition
              ? ids.filter(
                  (id) =>
                    game.groups[id].svennebrev[card.condition!.skill] <
                    card.condition!.below,
                )
              : cmd.kind === "summon" && group
                ? [group.id]
                : ids;
        for (const id of targets) {
          const target = game.groups[id];
          if (cmd.kind === "ragnarok" && target.scores.tradeGain > 0)
            target.scores.tradeGain = Math.ceil(target.scores.tradeGain / 2);
          if (card) {
            scores(target, card.effect);
            if (card.effect.skill) {
              const { key, delta } = card.effect.skill;
              target.conditions[key] = Math.max(
                -2,
                Math.min(2, (target.conditions[key] ?? 0) + delta),
              );
            }
          }
          notice(
            target,
            card?.title ?? cmd.title,
            `${card?.text ?? cmd.message}${card?.effect.skill ? " Dette endrer mannskapets midlertidige tilstand, ikke beståtte kompetansebevis." : ""}`,
          );
          if (target !== group) target.version++;
        }
      }
      message = `Lærerhendelse ${cmd.kind} ble gjennomført på serveren.`;
      break;
    }
    case "spin_wheel": {
      teacherOnly();
      const ids = Object.keys(game.groups).filter(
        (id) => Object.keys(game.groups[id].members).length,
      );
      requireRule(ids.length, "Ingen skip i spillet ennå.");
      const field = shuffle(WHEEL_FIELDS, random)[0];
      let text: string;
      if (field.id === "gudenes-prove") {
        const open = Object.values(game.challenges).find(
          (c) => c.status === "open",
        );
        if (open)
          text =
            "Gudenes prøve: fullfør den åpne lagleken først. Reisen og leken fortsetter der dere var.";
        else {
          const activity = shuffle(PARTY_IDS, random)[0];
          game.challenges[cmd.id] = createParty(
            game,
            cmd.id,
            "trial",
            ids,
            activity,
            actor.seed,
            "Gudenes prøve",
          );
          text = `Gudenes prøve · ${PARTY_GAMES[activity].title}. Alle gjør seg klare på sin egen skjerm.`;
        }
      } else if (field.id === "ragnarok") {
        for (const id of ids)
          if (game.groups[id].scores.tradeGain > 0)
            game.groups[id].scores.tradeGain = Math.ceil(
              game.groups[id].scores.tradeGain / 2,
            );
        text =
          "Ragnarok halverer positiv handelsgevinst. Besøk, fagbidrag, stemmer, prøver og kompetansebevis beholdes.";
      } else if (field.id === "skjebnemote") {
        for (const id of ids) game.groups[id].nextInterlude = true;
        text =
          "Et skjebnemøte venter ved neste seilas. Det pågående havnebesøket fortsetter.";
      } else {
        const targetId =
          field.id === "gunstig-vind"
            ? [...ids].sort(
                (a, b) =>
                  game.groups[a].scores.tradeGain -
                    game.groups[b].scores.tradeGain || a.localeCompare(b),
              )[0]
            : shuffle(ids, random)[0];
        const pool =
          field.id === "storm"
            ? STORM_FATE_IDS
            : field.id === "gudenes-gave"
              ? GAVE_FATE_IDS
              : ["gunstig-vind"];
        const card = shuffle(
          fateCards.filter(
            (c) =>
              pool.includes(c.id) &&
              (c.effect.trade || c.effect.rep || c.effect.skill),
          ),
          random,
        )[0];
        scores(game.groups[targetId], card.effect);
        if (card.effect.skill) {
          const { key, delta } = card.effect.skill;
          game.groups[targetId].conditions[key] = Math.max(
            -2,
            Math.min(2, (game.groups[targetId].conditions[key] ?? 0) + delta),
          );
        }
        text = `${game.groups[targetId].shipName}: ${card.title}. ${card.text} Pågående arbeid og beståtte prøver beholdes.`;
      }
      game.wheel = { id: cmd.id, fieldId: field.id, at: actor.now, text };
      for (const id of ids) {
        notice(game.groups[id], field.label, text);
        if (game.groups[id] !== group) game.groups[id].version++;
      }
      message = `Skjebnehjulet landet på ${field.label}; virkningen ble gjennomført én gang.`;
      break;
    }
    case "resolve_challenge": {
      teacherOnly();
      const challenge = game.challenges[cmd.challengeId];
      requireRule(
        challenge?.status === "open" && challenge.groups.includes(cmd.winnerId),
        "Utfordringen er avsluttet eller vinneren deltar ikke.",
      );
      const legacy = Object.keys(challenge.roster).length === 0;
      if (!legacy)
        requireRule(
          challenge.endsAt &&
            actor.now >= challenge.endsAt &&
            partyScores(challenge).every((s) => s.complete),
          "Alle aktive medlemmer må levere resultat eller bekrefte deltakelse før vinneren avgjøres.",
        );
      const winners =
        !legacy && PARTY_GAMES[challenge.activity].digital
          ? partyWinners(challenge)
          : [cmd.winnerId];
      requireRule(
        winners.includes(cmd.winnerId),
        "Vinneren må ha høyest snitt. Ved likt resultat deler lagene seieren.",
      );
      challenge.status = "resolved";
      challenge.phase = "finished";
      challenge.winnerId = winners[0];
      challenge.winnerIds = winners;
      const winnerNames = winners
        .map((id) => game.groups[id].shipName)
        .join(" og ");
      for (const id of challenge.groups) {
        if (winners.includes(id))
          scores(game.groups[id], { rep: challenge.kind === "trial" ? 4 : 2 });
        if (game.groups[id] !== group) game.groups[id].version++;
        notice(
          game.groups[id],
          challenge.title,
          `${winnerNames} ${winners.length > 1 ? "delte seieren" : "vant"}; ${game.mode === "solo" ? "øvingsleken er avsluttet" : "læreren bekreftet utfallet"}. Faglig vurdering påvirkes ikke.`,
        );
      }
      message = `${game.mode === "solo" ? "Øvingsleken er avsluttet" : "Læreren avgjorde utfordringen"}; belønningen er gjennomført én gang.`;
      break;
    }
  }
  if (group) group.version++;
  game.version++;
  game.receipts[receiptId] = game.version;
  game.log.push({
    id: cmd.id,
    actorId: actor.uid,
    groupId: cmd.groupId ?? null,
    at: actor.now,
    seed: actor.seed,
    presence: structuredClone(actor.presence),
    command: structuredClone(cmd) as Record<string, unknown>,
    message,
  });
  return game;
}

export function groupView(group: Group, content: Content): GroupView {
  const { encounter: e, trial, ting, cardCounts: _counts, ...visible } = group;
  let encounter: GroupView["encounter"] = null;
  if (e) {
    const { votes, card, answers: _answers, ...rest } = e;
    const tally = tallyVotes(votes, requiredMembers(e), e.choiceIds);
    encounter = {
      ...rest,
      votedCount: tally.votedCount,
      quizResults: quizResults(e, content),
      cardAvailable: !!card,
      voteCounts: ["decision", "result", "reflection"].includes(e.phase)
        ? tally.counts
        : {},
    };
  }
  return {
    ...visible,
    encounter,
    trial: trial
      ? (({ questionIndices: _indices, answers: _answers, ...rest }) => ({
          ...rest,
          questions: trial.questionIndices.map((i) => {
            const q = questionBank(group, content)[i];
            return {
              q: q.q,
              opts: q.opts,
              source: q.source,
              feedback: trial.phase === "quiz" ? null : q.feedback,
            };
          }),
          correct:
            trial.phase === "quiz"
              ? null
              : trial.answers.filter(
                  (a, i) =>
                    a ===
                    questionBank(group, content)[trial.questionIndices[i]]
                      .correct,
                ).length,
        }))(trial)
      : null,
    ting: ting
      ? (({ votes, ...rest }) => ({
          ...rest,
          votedCount: Object.keys(votes).length,
        }))(ting)
      : null,
  };
}
export function privateView(
  group: Group | undefined,
  uid: string,
): PrivateView {
  return {
    vote: group?.encounter?.votes[uid] ?? null,
    card:
      group?.encounter?.card?.holderId === uid ? group.encounter.card : null,
    tingVote: group?.ting?.votes[uid] ?? null,
    answers: group?.encounter?.answers[uid] ?? [],
    trialAnswers: group?.trial?.ownerId === uid ? group.trial.answers : [],
  };
}
export function publicView(game: Game): PublicView {
  return {
    code: game.code,
    version: game.version,
    settings: game.settings,
    endsAt: game.endsAt,
    closed: game.closed,
    trades: game.trades,
    challenges: game.challenges,
    wheel: game.wheel,
    groups: Object.fromEntries(
      Object.entries(game.groups).map(([id, g]) => [
        id,
        {
          id,
          version: g.version,
          shipName: g.shipName,
          shipColor: g.shipColor,
          shipSymbol: g.shipSymbol,
          chiefId: g.chiefId,
          members: g.members,
          visited: g.visited,
          scores: g.scores,
          goods: g.goods,
          notices: g.notices,
          phase: g.encounter?.phase ?? g.trial?.phase ?? "map",
          destId: g.encounter?.destId ?? g.visited.at(-1) ?? null,
          pendingTask:
            g.encounter?.approval === "pending" && !g.encounter.settled,
          pendingTrial: g.trial?.phase === "pending",
          learningReviews: g.saga.filter((s) => s.assessment).length,
        },
      ]),
    ),
  };
}
export function projectGame(game: Game, content: Content) {
  return {
    control: {
      teacherUid: game.teacherUid,
      members: Object.fromEntries(
        Object.entries(game.members).map(([uid, m]) => [
          uid,
          { groupId: m.groupId ?? "", joined: true },
        ]),
      ),
    },
    stateJson: JSON.stringify(game),
    publicJson: JSON.stringify(publicView(game)),
    groups: Object.fromEntries(
      Object.entries(game.groups).map(([id, g]) => [
        id,
        JSON.stringify(groupView(g, content)),
      ]),
    ),
    private: Object.fromEntries(
      Object.entries(game.members).map(([uid, m]) => [
        uid,
        JSON.stringify(
          privateView(m.groupId ? game.groups[m.groupId] : undefined, uid),
        ),
      ]),
    ),
  };
}
export function expectedVersion(game: Game, cmd: Pick<Command, "groupId">) {
  return cmd.groupId && game.groups[cmd.groupId]
    ? game.groups[cmd.groupId].version
    : game.version;
}
