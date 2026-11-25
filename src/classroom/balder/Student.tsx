import { useRef, useState } from "react";
import { HARBOURS, PRACTICES, harbourQuiz } from "../../content/balder";
import {
  approvedCount,
  balderPoints,
  BalderShip,
  SIGNALS,
  BONUS_RULES,
  signalPuzzle,
} from "../../domain/balder";
import type { BalderState, Action } from "../../domain/balder";
import { useTextDraft, useAnswerDraft } from "../drafts";
import type { GameStore, Snapshot, Session } from "../store";
import { Button, Field, Panel, Shell, SyncStatus } from "../ui";
import Feedback from "../Feedback";
import Holmgang from "../Holmgang";
import ShipSetup from "../ShipSetup";
import Map from "./Map";
import { harbourName } from "./harbours";
import "./balder.css";

type Controls = { busy: boolean; act: (action: Action) => void };
const empty = BalderShip.parse({});
export default function BalderStudent({
  state,
  store,
  session,
  onHome,
}: {
  state: Snapshot;
  store: GameStore;
  session: Session;
  onHome: () => void;
}) {
  const view = state.public!,
    group = state.group,
    busy = state.pending > 0;
  const s = group?.balder ?? empty,
    current = s.current;
  const [selected, setSelected] = useState<string | null>(null);
  const [review, setReview] = useState<string | null>(null);
  const result = useRef<HTMLDetailsElement>(null);
  const approved = approvedCount(s);
  const scope = [session.code, group?.id, session.uid].join(":");
  const act = (action: Action) => {
    void store.send({ type: "balder", action });
  };
  const completed = group?.visited ?? [];
  const last = completed.at(-1);
  function pick(id: string) {
    setSelected(id);
    setReview(null);
    if (!completed.includes(id) && !busy) act({ kind: "visit", port: id });
    else if (completed.includes(id)) {
      setReview(id);
      requestAnimationFrame(() => {
        if (!result.current) return;
        result.current.open = true;
        result.current.querySelector("summary")?.focus();
      });
    }
  }
  return (
    <Shell
      className="bd bd-crew"
      title={group?.shipName ?? "Balder · finn skipet ditt"}
      subtitle={`Spillkode ${view.code}${group ? ` · ${completed.length}/12 havner · ${balderPoints(group)} poeng` : ""}`}
      action={
        <Button secondary onClick={onHome}>
          Hovedmeny
        </Button>
      }
    >
      <SyncStatus state={state} store={store} solo={false} />
      {view.closed ? (
        <Panel title="Seilasen er over">
          <p>
            Dere besøkte {completed.length} havner, fikk {approved} prøver
            godkjent og samlet {group ? balderPoints(group) : 0} poeng.
          </p>
        </Panel>
      ) : !group ? (
        session.groupId ? (
          <p>Henter skipet …</p>
        ) : (
          <ShipSetup
            groups={view.groups}
            busy={busy}
            send={store.send}
            onBack={onHome}
            guided
          />
        )
      ) : (
        <>
          <Holmgang
            group={group}
            view={view}
            uid={session.uid}
            busy={busy}
            send={store.send}
            clockOffset={state.clockOffset}
          />
          {Object.entries(view.balderSignals ?? {}).map(([tier, seed]) => (
            <Bonus
              key={tier}
              level={Number(tier)}
              seed={seed}
              state={s}
              scope={scope}
              act={act}
              busy={busy}
            />
          ))}
          {current ? (
            <Visit
              key={current}
              id={current}
              state={s}
              scope={scope}
              busy={busy}
              act={act}
            />
          ) : (
            <>
              {last && (
                <Result
                  key={review ?? last}
                  id={review ?? last}
                  s={s}
                  detailsRef={result}
                />
              )}
              <Map
                approved={approved}
                visited={completed}
                selected={selected}
                busy={busy}
                onPick={pick}
              />
              <Panel title={`Praktiske svenneprøver · ${approved}/3 godkjent`}>
                <p>
                  Gjør oppgaven sammen og lever produktet i feltet. Dere kan
                  fortsette til en annen åpen havn mens læreren leser.
                </p>
                <div className="bd-workshop">
                  {PRACTICES.map((t) => (
                    <Practice
                      key={t.id}
                      trial={t}
                      state={s}
                      scope={scope}
                      visited={completed}
                      act={act}
                      busy={busy}
                    />
                  ))}
                </div>
              </Panel>
              <details className="cg-help">
                <summary>Utfordre et skip til holmgang</summary>
                <p>
                  Alle på begge skip bruker egen skjerm. Høyest snitt vinner to
                  poeng. Ved likt positivt snitt får begge skip poeng.
                </p>
                {Object.keys(view.groups).length < 2 && (
                  <p>Venter på et annet skip.</p>
                )}
                {Object.values(view.groups)
                  .filter(
                    (g) =>
                      g.id !== group.id && Object.keys(g.members).length > 0,
                  )
                  .map((g) => (
                    <Button
                      secondary
                      key={g.id}
                      disabled={
                        busy ||
                        Object.values(view.challenges).some(
                          (c) =>
                            c.status === "open" &&
                            (c.groups.includes(group.id) ||
                              c.groups.includes(g.id)),
                        )
                      }
                      onClick={() =>
                        void store.send({
                          type: "challenge",
                          to: g.id,
                          title: "Holmgang",
                          activity: completed.length % 2 ? "signal" : "tapping",
                        })
                      }
                    >
                      Utfordre {g.shipName}
                    </Button>
                  ))}
              </details>
            </>
          )}
        </>
      )}
      <Feedback
        code={session.code}
        uid={session.uid}
        destId={current ?? undefined}
        screen={
          view.closed
            ? "avsluttet"
            : current
              ? "reading"
              : group
                ? "sjøkart"
                : "mannskap"
        }
        endOfSession={view.closed}
      />
    </Shell>
  );
}
function Visit({
  id,
  state,
  scope,
  act,
  busy,
}: { id: string; state: BalderState; scope: string } & Controls) {
  const h = HARBOURS[id],
    visit = state.visits[id],
    questions = harbourQuiz(id);
  const [draft, setDraft] = useTextDraft(scope + ":reflect:" + id);
  const [answers, setAnswers] = useAnswerDraft(scope + ":quiz:" + id);
  return (
    <Panel title={harbourName(id)}>
      <div className="bd-harbour">
        <div className="bd-print">
          <img
            alt={`Illustrasjon av ${harbourName(id)}`}
            src={`/game/balder/havn-${id}.webp`}
          />
        </div>
        <div>
          <h3>{h.title}</h3>
          <p>{h.reading}</p>
          <a href={h.url} target="_blank" rel="noreferrer">
            Historisk kilde · {h.source}
          </a>
        </div>
      </div>

      <ol className="bd-steps" aria-label="Steg i havna">
        <li aria-current={!visit.reflection ? "step" : undefined}>
          1 · Refleksjon
        </li>
        <li aria-current={visit.reflection ? "step" : undefined}>
          2 · Havnequiz
        </li>
      </ol>
      {!visit.reflection ? (
        <div className="bd-step">
          <h3>Skriv sammen før quizen</h3>
          <p>{h.prompt}</p>
          <Field
            multiline
            label="Skipets refleksjon"
            value={draft}
            onChange={setDraft}
          />
          <p>Bruk minst 20 tegn. Én på skipet leverer.</p>
          <Button
            disabled={busy || draft.trim().length < 20}
            onClick={() => act({ kind: "reflect", port: id, text: draft })}
          >
            Lever og åpne quizen
          </Button>
        </div>
      ) : (
        <div className="bd-step">
          <h3>Havnequiz</h3>
          <p>Diskuter svarene. Hvert riktig svar gir ett poeng.</p>
          {questions.map((q, i) => (
            <fieldset className="bd-question" key={q.q}>
              <legend>
                {i + 1}. {q.q}
              </legend>
              {q.opts.map((opt, j) => (
                <label key={opt}>
                  <input
                    type="radio"
                    name={"q" + i}
                    checked={answers[i] === j}
                    onChange={() =>
                      setAnswers(
                        questions.map((_, n) =>
                          n === i ? j : (answers[n] ?? -1),
                        ),
                      )
                    }
                  />
                  {opt}
                </label>
              ))}
            </fieldset>
          ))}
          <Button
            disabled={
              busy || !questions.every((_, i) => (answers[i] ?? -1) >= 0)
            }
            onClick={() => act({ kind: "quiz", port: id, answers })}
          >
            Lever quizsvarene
          </Button>
        </div>
      )}
    </Panel>
  );
}
function Result({
  id,
  s,
  detailsRef,
}: {
  id: string;
  s: BalderState;
  detailsRef: React.RefObject<HTMLDetailsElement | null>;
}) {
  const v = s.visits[id];
  return (
    <Panel title={`${harbourName(id)} · ${v.correct}/3 riktige`}>
      <details ref={detailsRef}>
        <summary>Se svar og forklaringer</summary>
        <p>{v.reflection}</p>
        {harbourQuiz(id).map((q, i) => (
          <div key={q.q}>
            <h3>{q.q}</h3>
            <p>
              Dere svarte: {q.opts[v.answers![i]]}. Riktig svar:{" "}
              {q.opts[q.correct]}.
            </p>
            <p>{q.feedback}</p>
          </div>
        ))}
      </details>
    </Panel>
  );
}
function Practice({
  trial: t,
  state,
  scope,
  visited,
  act,
  busy,
}: {
  trial: (typeof PRACTICES)[number];
  state: BalderState;
  scope: string;
  visited: string[];
} & Controls) {
  const entry = state.trials[t.id];
  const [draft, setDraft] = useTextDraft(
    scope + ":trial:" + t.id,
    entry?.text ?? "",
  );
  const status =
    entry?.status ?? (visited.includes(t.port) ? "ready" : "locked");
  const labels = {
    approved: "Godkjent",
    pending: "Hos læreren",
    revise: "Prøv igjen",
    ready: "Klar",
    locked: `Besøk ${harbourName(t.port)} først`,
  };
  return (
    <details className="bd-practice" data-status={status}>
      <summary>
        <img
          src={`/game/balder/${t.id}.webp`}
          alt=""
          width={600}
          height={400}
          loading="lazy"
        />
        <span className="bd-practice-label">
          <strong>{t.title}</strong>
          <span className="bd-sr-only"> · </span>
          <small>{labels[status]}</small>
        </span>
      </summary>
      <div className="bd-practice-body">
        <p>{t.task}</p>
        {entry && <blockquote>{entry.text}</blockquote>}
        {entry?.feedback && <p>Fra læreren: {entry.feedback}</p>}
        {visited.includes(t.port) && (!entry || entry.status === "revise") && (
          <>
            <p>{t.proof}</p>
            <Field
              label="Dokumentasjon fra gruppa"
              multiline
              value={draft}
              onChange={setDraft}
            />
            <Button
              disabled={busy || draft.trim().length < 20}
              onClick={() => act({ kind: "submit", trial: t.id, text: draft })}
            >
              Lever svenneprøven
            </Button>
          </>
        )}
      </div>
    </details>
  );
}
function Bonus({
  level,
  seed,
  state,
  scope,
  act,
  busy,
}: {
  level: number;
  seed: number;
  state: BalderState;
  scope: string;
} & Controls) {
  const { shown } = signalPuzzle(level, seed);
  const [answer, set] = useAnswerDraft(scope + ":signal:" + level);
  const points = state.bonuses[level];
  if (points !== undefined)
    return (
      <p className="cg-note">
        Flåtesignal {level} løst · {points}/4 bonuspoeng.
      </p>
    );
  return (
    <details className="bd-bonus cg-help">
      <summary>Ny klasseutfordring · Flåtesignal {level}</summary>
      <p>
        En havn har utløst et signal til alle skip. Dere får ett bonuspoeng per
        riktig plass. Én på skipet sender svaret.
      </p>
      <div className="bd-signal-order">
        {shown.map((i) => (
          <img
            key={i}
            src={`/game/balder/signal-${i}.webp`}
            alt=""
            width={64}
            height={64}
          />
        ))}
      </div>
      <p>
        <b>{shown.map((i) => SIGNALS[i]).join(" · ")}</b>
      </p>
      <p>{BONUS_RULES[level - 1]}</p>
      <div className="cg-actions">
        {SIGNALS.map((v, i) => (
          <Button
            secondary
            key={v}
            disabled={answer.includes(i)}
            onClick={() => set([...answer, i])}
          >
            <span className="bd-signal-choice">
              <img
                src={`/game/balder/signal-${i}.webp`}
                alt=""
                width={28}
                height={28}
              />
              {v}
            </span>
          </Button>
        ))}
      </div>
      <p aria-live="polite">
        Deres signal:{" "}
        {answer.map((i) => SIGNALS[i]).join(" · ") ||
          "Velg det første symbolet."}
      </p>
      <div className="cg-actions">
        <Button secondary disabled={!answer.length} onClick={() => set([])}>
          Start på nytt
        </Button>
        <Button
          disabled={busy || answer.length !== 4}
          onClick={() => act({ kind: "bonus", level, answers: answer })}
        >
          Send signalet
        </Button>
      </div>
    </details>
  );
}
