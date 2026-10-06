import { useState, type Dispatch, type SetStateAction } from "react";
import type { Evidence, GroupView, Rubric, Saga } from "../../domain/model";
import { content } from "../../content";
import VikingShip from "../../components/ship/VikingShip";
import { groupStatus } from "../../lib/groupStatus";
import type { Intent } from "../store";
import { Button, Field } from "../ui";
import { onlineMembers, reviewCount, type Presence } from "./status";
import { TOPIC_LABEL } from "../../domain/trials";

type Send = (intent: Intent) => Promise<void>;
type GroupNotes = {
  feedback: string;
  summon: string;
  excuse: string;
  memberId: string;
};
export type ReviewDrafts = {
  assessments: Record<string, Rubric>;
  notes: Record<string, GroupNotes>;
};
type UpdateDrafts = Dispatch<SetStateAction<ReviewDrafts>>;
const EMPTY_NOTES: GroupNotes = {
  feedback: "",
  summon: "",
  excuse: "",
  memberId: "",
};
export default function Review({
  groups,
  presence,
  now,
  selectedId,
  onSelect,
  send,
  busy,
  closed,
  drafts,
  updateDrafts,
}: {
  groups: Record<string, GroupView>;
  presence: Presence;
  now: number;
  selectedId: string | null;
  onSelect: (id: string) => void;
  send: Send;
  busy: boolean;
  closed: boolean;
  drafts: ReviewDrafts;
  updateDrafts: UpdateDrafts;
}) {
  const [query, setQuery] = useState("");
  const [onlyWaiting, setOnlyWaiting] = useState(false);
  const fleet = Object.values(groups).sort(
    (a, b) =>
      reviewCount(b) - reviewCount(a) ||
      a.shipName.localeCompare(b.shipName, "nb"),
  );
  const filtered = fleet.filter(
    (g) =>
      g.shipName
        .toLocaleLowerCase("nb")
        .includes(query.toLocaleLowerCase("nb")) &&
      (!onlyWaiting || reviewCount(g) > 0),
  );
  const current = filtered.find((g) => g.id === selectedId) ?? filtered[0];
  return (
    <>
      <div className="td-section-heading">
        <div>
          <p className="td-kicker">Fagarbeidet i sentrum</p>
          <h2>Oppgaver og vurdering</h2>
        </div>
        <p className="td-caption">
          Velg mannskapet. Åpne bidragene du vil lese.
        </p>
      </div>
      <div className="td-review-layout">
        <aside
          className="td-card td-review-rail"
          aria-label="Velg skip til vurdering"
        >
          <Field
            label="Finn skip"
            value={query}
            onChange={setQuery}
            maxLength={80}
            required={false}
          />
          <label className="td-checkbox td-filter">
            <input
              type="checkbox"
              checked={onlyWaiting}
              onChange={(event) => setOnlyWaiting(event.target.checked)}
            />
            <span>Bare ventende vurderinger</span>
          </label>
          <label className="cg-field td-mobile-ship-select">
            Velg skip
            <select
              aria-label="Velg skip til vurdering"
              value={current?.id ?? ""}
              disabled={!filtered.length}
              onChange={(event) => onSelect(event.target.value)}
            >
              {!filtered.length && <option value="">Ingen skip</option>}
              {filtered.map((group) => (
                <option value={group.id} key={group.id}>
                  {group.shipName}
                </option>
              ))}
            </select>
          </label>
          <div className="td-review-ships">
            {filtered.map((group) => (
              <button
                key={group.id}
                type="button"
                aria-label={group.shipName}
                className={`td-review-ship ${current?.id === group.id ? "is-selected" : ""}`}
                aria-pressed={current?.id === group.id}
                onClick={() => onSelect(group.id)}
              >
                <VikingShip
                  color={group.shipColor}
                  symbol={group.shipSymbol}
                  size={42}
                />
                <span>
                  <strong>{group.shipName}</strong>
                  <small>
                    {onlineMembers(group, presence, now).length} /{" "}
                    {Object.keys(group.members).length} tilkoblet
                  </small>
                </span>
                <span
                  className={`td-badge ${reviewCount(group) ? "td-badge-wait" : ""}`}
                >
                  {reviewCount(group)}
                  <span className="sr-only"> ventende vurderinger</span>
                </span>
              </button>
            ))}
          </div>
          {!filtered.length && (
            <p className="td-caption">
              {fleet.length
                ? "Ingen skip passer til søket eller filteret."
                : "Skipene dukker opp her når elevene blir med."}
            </p>
          )}
        </aside>
        {current ? (
          <GroupReview
            key={current.id}
            group={current}
            presence={presence}
            now={now}
            send={send}
            busy={busy}
            closed={closed}
            drafts={drafts}
            updateDrafts={updateDrafts}
          />
        ) : (
          <section className="td-card td-empty">
            <h3>
              {fleet.length
                ? "Ingen ventende skip"
                : "Klar for første mannskap"}
            </h3>
            <p>
              {fleet.length
                ? "Vis alle skip eller endre søket for å lese tidligere arbeid."
                : "Når elevene har opprettet et skip, kan du lese bidrag og gi tilbakemelding her."}
            </p>
          </section>
        )}
      </div>
    </>
  );
}

function EvidenceCard({
  id,
  evidence,
  group,
  destId,
  quiz,
  number,
}: {
  id: string;
  evidence: Evidence;
  group: GroupView;
  destId: string;
  quiz?: { correct: number; total: number };
  number: number;
}) {
  const member = group.members[id];
  const source = content.ports
    .find((p) => p.port.id === destId)
    ?.sources.find((s) => s.id === evidence.sourceId);
  return (
    <details className="td-evidence">
      <summary>
        <span>
          <strong>{member?.label ?? `Tidligere medlem ${number}`}</strong>
        </span>
        <span className="td-evidence-state">
          {quiz && quiz.total > 0
            ? `${quiz.correct} / ${quiz.total} i quiz`
            : "Fagbidrag levert"}
        </span>
      </summary>
      <dl className="td-evidence-text">
        <div>
          <dt>Fakta fra teksten eller kilden</dt>
          <dd>{evidence.fact}</dd>
        </div>
        <div>
          <dt>Tolkning og begrunnelse</dt>
          <dd>{evidence.interpretation}</dd>
        </div>
        {evidence.perspective && (
          <div>
            <dt>Den andre partens perspektiv</dt>
            <dd>{evidence.perspective}</dd>
          </div>
        )}
        <div>
          <dt>Valgt kilde</dt>
          <dd>
            {source ? (
              <a href={source.url} target="_blank" rel="noreferrer">
                {source.title}
              </a>
            ) : (
              evidence.sourceId
            )}
          </dd>
        </div>
      </dl>
    </details>
  );
}

function GroupReview({
  group,
  presence,
  now,
  send,
  busy,
  closed,
  drafts,
  updateDrafts,
}: {
  group: GroupView;
  presence: Presence;
  now: number;
  send: Send;
  busy: boolean;
  closed: boolean;
  drafts: ReviewDrafts;
  updateDrafts: UpdateDrafts;
}) {
  const { feedback, summon, excuse, memberId } =
    drafts.notes[group.id] ?? EMPTY_NOTES;
  const note = (key: keyof GroupNotes, value: string) =>
    updateDrafts((previous) => ({
      ...previous,
      notes: {
        ...previous.notes,
        [group.id]: {
          ...(previous.notes[group.id] ?? EMPTY_NOTES),
          [key]: value,
        },
      },
    }));
  const e = group.encounter;
  const taskPending = !closed && e?.approval === "pending" && !e.settled;
  const trialPending = group.trial?.phase === "pending";
  const online = onlineMembers(group, presence, now);
  return (
    <section
      className="td-card td-group-review"
      aria-label={`Vurdering av ${group.shipName}`}
    >
      <div className="td-section-heading">
        <div className="td-ship-heading">
          <VikingShip
            color={group.shipColor}
            symbol={group.shipSymbol}
            size={66}
          />
          <div>
            <h2>{group.shipName}</h2>
            <p>{groupStatus(group).text}</p>
          </div>
        </div>
        <span
          className={`td-badge ${reviewCount(group) ? "td-badge-wait" : "td-badge-good"}`}
        >
          {reviewCount(group)} til vurdering
        </span>
      </div>
      <p className="td-caption">
        Høvding: {group.members[group.chiefId]?.label ?? "Ingen"} ·{" "}
        {online.length} av {Object.keys(group.members).length} i mannskapet
        tilkoblet
      </p>
      {e && (
        <div className="td-review-section">
          <h3>Bidrag i pågående kulturmøte</h3>
          <p className="td-caption">
            {Object.keys(e.evidence).length} bidrag levert. Åpne et navn for å
            lese fakta, tolkning og perspektiv.
          </p>
          {Object.entries(e.evidence).map(([id, v], i) => (
            <EvidenceCard
              key={id}
              id={id}
              evidence={v}
              group={group}
              destId={e.destId}
              quiz={e.quizResults[id]}
              number={i + 1}
            />
          ))}
          {!Object.keys(e.evidence).length && (
            <p className="td-caption">
              Mannskapet har ikke levert fagbidrag ennå.
            </p>
          )}
        </div>
      )}
      {(taskPending || trialPending) && (
        <div className="td-review-section td-pending-task">
          <span className="td-badge td-badge-wait">Venter på deg</span>
          <h3>
            {trialPending
              ? "Praksisprøve til godkjenning"
              : "Oppgave til godkjenning"}
          </h3>
          {trialPending && (
            <>
              <p className="td-caption">
                {group.members[group.trial!.ownerId]?.label ??
                  "Tidligere medlem"}{" "}
                · {TOPIC_LABEL[group.trial!.skill]} · nivå {group.trial!.level}
              </p>
              <h4>{group.trial!.practiceTitle}</h4>
              <p className="td-caption">{group.trial!.practicePrompt}</p>
              <p className="td-prose">{group.trial!.practice}</p>
            </>
          )}
          <Field
            label="Tilbakemelding til oppgaven eller praksisprøven"
            value={feedback}
            onChange={(value) => note("feedback", value)}
            multiline
            maxLength={1000}
          />
          {taskPending && (
            <div className="cg-actions">
              <Button
                disabled={busy || feedback.trim().length < 5}
                onClick={() => {
                  void send({
                    type: "approve_task",
                    groupId: group.id,
                    approved: true,
                    feedback,
                  });
                }}
              >
                Godkjenn oppgaven
              </Button>
              <Button
                secondary
                disabled={busy || feedback.trim().length < 5}
                onClick={() => {
                  void send({
                    type: "approve_task",
                    groupId: group.id,
                    approved: false,
                    feedback,
                  });
                }}
              >
                Gi beskjed om forbedring
              </Button>
            </div>
          )}
          {trialPending && (
            <div className="cg-actions">
              <Button
                disabled={busy || feedback.trim().length < 5}
                onClick={() => {
                  void send({
                    type: "approve_trial",
                    groupId: group.id,
                    approved: true,
                    feedback,
                  });
                }}
              >
                Godkjenn praksis og svennebrev
              </Button>
              <Button
                secondary
                disabled={busy || feedback.trim().length < 5}
                onClick={() => {
                  void send({
                    type: "approve_trial",
                    groupId: group.id,
                    approved: false,
                    feedback,
                  });
                }}
              >
                Be om mer øving
              </Button>
            </div>
          )}
        </div>
      )}
      <div className="td-review-section">
        <h3>Kulturmøter og faglig vurdering</h3>
        <p className="td-caption">
          Begrunnelse, kildebruk og perspektiv vurderes hver for seg.
        </p>
        {group.saga.length ? (
          [...group.saga].reverse().map((saga) => (
            <Assessment
              key={saga.id}
              group={group}
              saga={saga}
              send={send}
              busy={busy}
              draft={drafts.assessments[saga.id]}
              onDraft={(rubric) =>
                updateDrafts((previous) => ({
                  ...previous,
                  assessments: { ...previous.assessments, [saga.id]: rubric },
                }))
              }
            />
          ))
        ) : (
          <p className="td-caption">
            Fullførte kulturmøter kommer hit. Faglig vurdering er uavhengig av
            terningutfallet.
          </p>
        )}
      </div>
      <details className="td-details">
        <summary>Kontakt mannskapet</summary>
        <Field
          label="Beskjed til gruppen"
          value={summon}
          onChange={(value) => note("summon", value)}
          multiline
          required={false}
          maxLength={1000}
        />
        <Button
          secondary
          disabled={busy || closed}
          onClick={() => {
            void send({
              type: "event",
              groupId: group.id,
              kind: "summon",
              title: "Kom til læreren",
              message: summon || "Kom bort til læreren med gruppen.",
            });
          }}
        >
          Kall inn gruppen
        </Button>
      </details>
      <details className="td-details">
        <summary>Hjelp når noen har falt ut</summary>
        <label className="cg-field">
          Medlem
          <select
            aria-label="Medlem"
            value={memberId}
            onChange={(event) => note("memberId", event.target.value)}
          >
            <option value="">Velg medlem</option>
            {Object.entries(group.members).map(([id, m]) => (
              <option key={id} value={id}>
                {m.label} · {online.includes(id) ? "tilkoblet" : "frakoblet"}
              </option>
            ))}
          </select>
        </label>
        <Field
          label="Begrunn hvorfor medlemmet fritas i denne runden"
          value={excuse}
          onChange={(value) => note("excuse", value)}
          multiline
        />
        <div className="cg-actions">
          <Button
            secondary
            disabled={
              busy ||
              closed ||
              !memberId ||
              !e ||
              e.settled ||
              excuse.trim().length < 10
            }
            onClick={() => {
              void send({
                type: "excuse",
                groupId: group.id,
                memberId,
                reason: excuse,
              });
            }}
          >
            Frita fra runden / avstemningen
          </Button>
          <Button
            secondary
            disabled={busy || closed || !memberId}
            onClick={() => {
              void send({ type: "transfer", groupId: group.id, memberId });
            }}
          >
            Gi medlemmet roret
          </Button>
        </div>
      </details>
    </section>
  );
}

function Assessment({
  group,
  saga,
  send,
  busy,
  draft,
  onDraft,
}: {
  group: GroupView;
  saga: Saga;
  send: Send;
  busy: boolean;
  draft?: Rubric;
  onDraft: (rubric: Rubric) => void;
}) {
  const [saving, setSaving] = useState(false);
  const rubric = draft ??
    saga.assessment ?? {
      reasoning: 0,
      sourceUse: 0,
      perspective: 0,
      feedback: "",
    };
  const labels = {
    reasoning: "Begrunnelse",
    sourceUse: "Kildebruk",
    perspective: "Perspektiv",
  } as const;
  const saved =
    saga.assessment &&
    (["reasoning", "sourceUse", "perspective", "feedback"] as const).every(
      (key) => rubric[key] === saga.assessment![key],
    );
  return (
    <details className="td-details td-assessment">
      <summary>
        <span>
          {saga.destName} · faglig vurdering{" "}
          {saga.assessment ? "registrert" : "venter"}
        </span>
        <span
          className={`td-badge ${saga.assessment ? "td-badge-good" : "td-badge-wait"}`}
        >
          {saga.assessment
            ? `${saga.assessment.reasoning + saga.assessment.sourceUse + saga.assessment.perspective} / 6`
            : "Venter"}
        </span>
      </summary>
      <div className="td-assessment-body">
        <dl className="td-evidence-text">
          <div>
            <dt>Gruppens valg og begrunnelse</dt>
            <dd>
              <strong>{saga.choiceTitle}</strong>
              <p>{saga.reason || "Ingen begrunnelse levert."}</p>
            </dd>
          </div>
          <div>
            <dt>Kilder og sammenligning</dt>
            <dd>
              {saga.historicalComparison ||
                "Etterarbeidet er ikke levert ennå."}
            </dd>
          </div>
          <div>
            <dt>Bro til i dag</dt>
            <dd>{saga.reflection || "Ingen bro til i dag levert."}</dd>
          </div>
        </dl>
        <h4>Individuelle elevbidrag</h4>
        {Object.entries(saga.evidence).map(([id, evidence], i) => (
          <EvidenceCard
            key={id}
            id={id}
            evidence={evidence}
            group={group}
            destId={saga.destId}
            quiz={saga.quiz[id]}
            number={i + 1}
          />
        ))}
        <fieldset className="td-rubric">
          <legend>Faglig vurdering</legend>
          <p className="td-caption">
            0 = ikke vist · 1 = noe forklart · 2 = konkret, faglig begrunnet og
            nyansert.
          </p>
          <div className="td-rubric-grid">
            {(["reasoning", "sourceUse", "perspective"] as const).map((key) => (
              <label className="cg-field" key={key}>
                {labels[key]}
                <select
                  aria-label={labels[key]}
                  value={rubric[key]}
                  disabled={busy || saving}
                  onChange={(event) =>
                    onDraft({ ...rubric, [key]: Number(event.target.value) })
                  }
                >
                  {[0, 1, 2].map((n) => (
                    <option key={n} value={n}>
                      {n} · {["Ikke vist", "Noe forklart", "Godt begrunnet"][n]}
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </div>
          <Field
            label="Faglig tilbakemelding"
            value={rubric.feedback}
            onChange={(feedback) => onDraft({ ...rubric, feedback })}
            multiline
            maxLength={1000}
          />
          <div className="td-save-row">
            <Button
              disabled={busy || saving || rubric.feedback.trim().length < 5}
              onClick={() => {
                setSaving(true);
                void send({
                  type: "assess",
                  groupId: group.id,
                  sagaId: saga.id,
                  rubric,
                }).finally(() => setSaving(false));
              }}
            >
              Lagre faglig vurdering
            </Button>
            {saved ? (
              <span className="td-saved" role="status">
                Vurdering lagret
              </span>
            ) : draft ? (
              <span className="td-unsaved" role="status">
                Ulagret utkast · beholdes når du bytter visning
              </span>
            ) : null}
          </div>
        </fieldset>
      </div>
    </details>
  );
}
