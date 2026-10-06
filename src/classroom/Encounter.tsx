import { useNow } from "../hooks/useNow";
import { useEffect, useRef, useState } from "react";
import { content } from "../content";
import { availableChoices, portFor } from "../domain/model";
import type {
  ContentPack,
  GroupView,
  PrivateView,
  Settings,
} from "../domain/model";
import { hasAdvantage, rollPenalty } from "../domain/engine";
import { effectiveOdds } from "../domain/odds";
import { TIER_LABEL } from "../lib/oddsEngine";
import { CREW_ROLES } from "../data/crewRoles";
import { npcVotes } from "../lib/council";
import { SKJEBNEMOTER } from "../data/skjebnemoter";
import { Button, Field, Panel } from "./ui";
import type { Intent } from "./store";

type Props = {
  group: GroupView;
  privateView: PrivateView;
  uid: string;
  settings: Settings;
  solo: boolean;
  busy: boolean;
  send: (intent: Intent) => Promise<void>;
};
const LABELS = {
  sailing: "Seilas",
  reading: "Kulturmøte",
  tasks: "Mannskapets bidrag",
  council: "Rådslagning",
  decision: "Avgjørelse",
  result: "Utfall",
  reflection: "Etterarbeid",
};
export default function Encounter(props: Props) {
  const { group, uid, privateView, settings, send, busy } = props;
  const e = group.encounter!;
  const now = useNow(e.phase === "sailing");
  const pack = portFor(content, e.destId);
  const [length, setLength] = useState<"short" | "full">(() =>
    settings.textLength === "full" ? "full" : "short",
  );
  const chief = group.chiefId === uid;
  const arrivalAttempt = useRef<string | null>(null);
  useEffect(() => {
    if (
      !chief ||
      e.phase !== "sailing" ||
      (e.interlude && !e.interlude.choiceId) ||
      busy ||
      arrivalAttempt.current === e.id
    )
      return;
    const timer = setTimeout(
      () => {
        arrivalAttempt.current = e.id;
        void send({ type: "arrive" });
      },
      Math.max(0, e.arrivesAt - Date.now()),
    );
    return () => clearTimeout(timer);
  }, [chief, e.id, e.phase, e.arrivesAt, e.interlude, busy, send]);
  return (
    <>
      <div className="cg-progress" aria-label="Spillets steg">
        {Object.entries(LABELS).map(([key, label]) => (
          <span
            key={key}
            className={key === e.phase ? "active" : ""}
            aria-current={key === e.phase ? "step" : undefined}
          >
            {label}
          </span>
        ))}
      </div>
      {privateView.card && !e.settled && (
        <aside className="cg-private">
          <h2>Ditt private rollekort</h2>
          <p>{privateView.card.text}</p>
          <p className="cg-small">
            Opplysningen er dramatisert. Bruk den i samtalen; de andre har ikke
            fått dette kortet.
          </p>
        </aside>
      )}
      {e.cardAvailable && !privateView.card && !e.settled && (
        <p className="cg-note">
          Ett medlem har et privat rollekort. Lytt til mannskapets opplysninger
          før dere velger.
        </p>
      )}
      <Panel title={`${pack.port.name} · ${LABELS[e.phase]}`}>
        {e.phase === "sailing" && (
          <>
            <p>
              Skipet er på vei. Seilasen fortsetter også etter at siden er
              lastet på nytt.
            </p>
            {e.interlude && (
              <>
                <h3>
                  {SKJEBNEMOTER.find((j) => j.id === e.interlude!.id)?.title}
                </h3>
                {e.interlude.choiceId ? (
                  <p>
                    {e.interlude.text}
                    {e.interlude.roll
                      ? ` Kast ${e.interlude.roll}, bonus ${e.interlude.bonus}.`
                      : ""}
                  </p>
                ) : (
                  <>
                    <p>
                      {
                        SKJEBNEMOTER.find((j) => j.id === e.interlude!.id)
                          ?.scene
                      }
                    </p>
                    {chief && (
                      <div className="cg-actions">
                        {SKJEBNEMOTER.find(
                          (j) => j.id === e.interlude!.id,
                        )?.choices.map((c) => (
                          <Button
                            key={c.id}
                            disabled={busy}
                            onClick={() => {
                              void send({
                                type: "journey_choice",
                                choiceId: c.id,
                              });
                            }}
                          >
                            {c.label}
                          </Button>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </>
            )}
            <Button
              disabled={
                now < e.arrivesAt ||
                busy ||
                (!!e.interlude && !e.interlude.choiceId)
              }
              onClick={() => {
                void send({ type: "arrive" });
              }}
            >
              Vi er framme
            </Button>
          </>
        )}
        {e.phase === "reading" && (
          <>
            <img
              src={pack.port.image}
              alt={`Stemningsbilde fra ${pack.port.name}`}
              className="cg-image"
            />
            <div className="cg-actions">
              <Button secondary onClick={() => setLength("short")}>
                Kort tekst
              </Button>
              <Button secondary onClick={() => setLength("full")}>
                Full tekst
              </Button>
            </div>
            <div className="cg-reading">
              <h3>Ankomsten</h3>
              <p>
                {length === "short"
                  ? (pack.port.historyShort ?? pack.port.history)
                  : pack.port.history}
              </p>
              <h3>{pack.port.episkeKulturmote.tittel}</h3>
              <p>
                {length === "short"
                  ? (pack.port.kulturmoteSceneShort ??
                    pack.port.episkeKulturmote.scene)
                  : pack.port.episkeKulturmote.scene}
              </p>
            </div>
            <p className="cg-note">
              Fortellingen er dramatisert. {pack.editorial.caution}
            </p>
            {pack.port.governance && (
              <div>
                <h3>{pack.port.governance.styreform}</h3>
                <p>{pack.port.governance.body}</p>
              </div>
            )}
            <Sources pack={pack} />
            {chief ? (
              <Button
                disabled={busy}
                onClick={() => {
                  void send({ type: "advance" });
                }}
              >
                Til mannskapets oppgaver
              </Button>
            ) : (
              <p>
                Les i ditt tempo. Høvdingen åpner oppgavene når dere er klare.
              </p>
            )}
          </>
        )}
        {e.phase === "tasks" && <Tasks {...props} pack={pack} />}
        {e.phase === "council" && <Council {...props} pack={pack} />}
        {e.phase === "decision" && <Decision {...props} pack={pack} />}
        {e.phase === "result" && <Result {...props} pack={pack} />}
        {e.phase === "reflection" && <Reflection {...props} pack={pack} />}
      </Panel>
    </>
  );
}
function Sources({ pack }: { pack: ContentPack }) {
  return (
    <details className="cg-help">
      <summary>Kilder og kildekritikk</summary>
      {pack.sources.map((s) => (
        <p key={s.id}>
          <a href={s.url} target="_blank" rel="noreferrer">
            {s.title}
          </a>
          <br />
          {s.scope}
        </p>
      ))}
      <p>{pack.editorial.caution}</p>
      <p className="cg-small">
        Historiske påstander i originalinnholdet er merket for faglig
        gjennomgang. Dialog, motiver og spillgevinster er ikke dokumenterte
        hendelser.
      </p>
    </details>
  );
}
function Tasks({
  group,
  uid,
  settings,
  busy,
  send,
  pack,
}: Props & { pack: ContentPack }) {
  const e = group.encounter!;
  const role = group.members[uid].role;
  const [fact, setFact] = useState("");
  const [interpretation, setInterpretation] = useState("");
  const [perspective, setPerspective] = useState("");
  const [sourceId, setSourceId] = useState(pack.sources[0].id);
  const [answers, setAnswers] = useState<number[]>([]);
  const eligible = e.eligible.filter((id) => !e.excused[id]);
  const submitted = !!e.evidence[uid];
  const ready = eligible.every((id) => e.evidence[id]);
  return (
    <>
      <h3>{pack.port.task.title}</h3>
      <p>{pack.port.task.desc}</p>
      <p className="cg-note">
        Gjør oppgaven sammen, og lever deretter ditt eget fagbidrag. Rollen din
        er <strong>{CREW_ROLES[role].title}</strong>: {pack.roleTasks[role]}
      </p>
      {eligible.includes(uid) && !submitted ? (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void send({
              type: "contribute",
              evidence: { fact, interpretation, perspective, sourceId },
              answers: settings.requireQuiz ? answers : [],
            });
          }}
        >
          <Field
            label="Hva står konkret i teksten eller kilden? (minst 20 tegn)"
            value={fact}
            onChange={setFact}
            multiline
          />
          <label className="cg-field">
            Kilden du bygger på
            <select
              value={sourceId}
              onChange={(event) => setSourceId(event.target.value)}
            >
              {pack.sources.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title}
                </option>
              ))}
            </select>
          </label>
          <Field
            label="Hva betyr dette for valget vårt, og hvorfor?"
            value={interpretation}
            onChange={setInterpretation}
            multiline
          />
          <Field
            required={settings.requirePerspective}
            label={`Hvordan kan den andre parten oppleve møtet?${pack.port.perspectivePrompt ? ` ${pack.port.perspectivePrompt.otherQuestion}` : ""}`}
            value={perspective}
            onChange={setPerspective}
            multiline
          />
          {settings.requireQuiz &&
            pack.port.stedsquiz.map((q, i) => (
              <fieldset className="cg-choice" key={q.q}>
                <legend>
                  {i + 1}. {q.q}
                </legend>
                {q.opts.map((option, index) => (
                  <label key={option}>
                    <input
                      type="radio"
                      name={`quiz-${i}`}
                      checked={answers[i] === index}
                      onChange={() =>
                        setAnswers((old) => {
                          const next = [...old];
                          next[i] = index;
                          return next;
                        })
                      }
                      required
                    />
                    {option}
                  </label>
                ))}
              </fieldset>
            ))}
          <Button
            type="submit"
            disabled={
              busy ||
              fact.trim().length < 20 ||
              interpretation.trim().length < 20 ||
              (settings.requirePerspective && perspective.trim().length < 20) ||
              (settings.requireQuiz &&
                (answers.length !== 4 ||
                  Array.from({ length: 4 }, (_, i) => answers[i]).some(
                    (a) => a === undefined,
                  )))
            }
          >
            Lever mitt bidrag
          </Button>
        </form>
      ) : submitted ? (
        <p className="cg-note">
          Ditt bidrag er levert.{" "}
          {e.quizResults[uid] && settings.requireQuiz
            ? `Du fikk ${e.quizResults[uid].correct} av ${e.quizResults[uid].total} riktige.`
            : ""}
        </p>
      ) : (
        <p>Du deltar fra neste runde. Følg samtalen og hjelp mannskapet.</p>
      )}
      {submitted && settings.requireQuiz && (
        <details className="cg-help">
          <summary>Se forklaringer til quizen</summary>
          {pack.port.stedsquiz.map((q) => (
            <p key={q.q}>
              <strong>{q.q}</strong>
              <br />
              {q.feedback}
            </p>
          ))}
        </details>
      )}
      <h3>Mannskapet</h3>
      {e.eligible.map((id) => (
        <p key={id}>
          {group.members[id]?.label}:{" "}
          {e.excused[id]
            ? `fritatt av læreren (${e.excused[id]})`
            : e.evidence[id]
              ? "levert"
              : "arbeider"}
        </p>
      ))}
      <Sources pack={pack} />
      {group.chiefId === uid && (
        <Button
          disabled={busy || !ready}
          onClick={() => {
            void send({ type: "advance" });
          }}
        >
          Åpne rådslagningen
        </Button>
      )}
    </>
  );
}
function Choices({
  group,
  pack,
  selected,
  onSelect,
  disabled = false,
  allowed,
}: {
  group: GroupView;
  pack: ContentPack;
  selected: string;
  onSelect: (id: string) => void;
  disabled?: boolean;
  allowed?: string[];
}) {
  const advantage = hasAdvantage(group, content),
    penalty = rollPenalty(group);
  return (
    <>
      {availableChoices(group, pack.port)
        .filter((c) => group.encounter!.choiceIds.includes(c.id))
        .filter((c) => !allowed || allowed.includes(c.id))
        .map((c) => {
          const odds = effectiveOdds(c.baseRoll, advantage, penalty);
          return (
            <div className="cg-choice" key={c.id}>
              <label>
                <input
                  type="radio"
                  name="choice"
                  value={c.id}
                  checked={selected === c.id}
                  disabled={disabled}
                  onChange={() => onSelect(c.id)}
                />
                {c.title}
              </label>
              <p>{c.desc}</p>
              <div className="cg-odds" aria-label="Faktiske utfallssjanser">
                {Object.entries(odds).map(([tier, n]) => (
                  <span key={tier}>
                    {TIER_LABEL[tier as keyof typeof TIER_LABEL]} {n.toFixed(1)}{" "}
                    %
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      <p className="cg-small">
        {advantage
          ? "Forberedelsen gir ett ekstra kast; det beste av to beholdes. Fordeler stables ikke."
          : "Ett vanlig terningkast. Minst 3 av 4 rette hos alle i runden, eller lærergodkjenning, gir ett ekstra kast."}
        {penalty < 0 && " Svidd mottakelse i Paris gir −1 på begge kast."}
      </p>
    </>
  );
}
function Council({
  group,
  uid,
  privateView,
  busy,
  send,
  pack,
}: Props & { pack: ContentPack }) {
  const e = group.encounter!;
  const [choiceId, setChoiceId] = useState("");
  const [note, setNote] = useState("");
  const [suspicion, setSuspicion] = useState(false);
  const eligible = e.eligible.filter((id) => !e.excused[id]);
  return (
    <>
      <p>
        {e.votedCount} av {eligible.length} stemmer er forseglet. Flertallet
        bestemmer. Høvdingen bryter bare likhet.
      </p>
      <h3>Fagbidrag som grunnlag for samtalen</h3>
      {Object.entries(e.evidence).map(([id, v]) => (
        <div className="cg-note" key={id}>
          <strong>{group.members[id]?.label}</strong>
          <p>{v.fact}</p>
          <p>{v.interpretation}</p>
          <p>{v.perspective}</p>
        </div>
      ))}
      {privateView.vote ? (
        <p className="cg-note">
          Stemmen din er forseglet. De andre kan ikke lese den før opptellingen.
        </p>
      ) : eligible.includes(uid) ? (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void send({ type: "vote", choiceId, note, suspicion });
          }}
        >
          <Choices
            group={group}
            pack={pack}
            selected={choiceId}
            onSelect={setChoiceId}
          />
          <Field
            label="Begrunn stemmen din (minst 10 tegn)"
            value={note}
            onChange={setNote}
            multiline
          />
          <label className="cg-field">
            <span>
              <input
                type="checkbox"
                checked={suspicion}
                onChange={(event) => setSuspicion(event.target.checked)}
              />{" "}
              Jeg mener et argument kan bygge på en skjult interesse. Forklar i
              begrunnelsen.
            </span>
          </label>
          <Button
            type="submit"
            disabled={busy || !choiceId || note.trim().length < 10}
          >
            Forsegl min stemme
          </Button>
        </form>
      ) : (
        <p>Du er fritatt fra denne avstemningen.</p>
      )}
      <p className="cg-small">
        Hvis noen har falt ut, kan læreren frita dem med begrunnelse. Rundens
        mannskapsliste endres ikke av en oppfriskning.
      </p>
    </>
  );
}
function Decision({
  group,
  uid,
  solo,
  busy,
  send,
  pack,
  settings,
}: Props & { pack: ContentPack }) {
  const e = group.encounter!;
  const [choiceId, setChoiceId] = useState(e.choiceId ?? "");
  const [reason, setReason] = useState(e.reason);
  const chief = group.chiefId === uid;
  const sealed =
    !!e.choiceId && (!settings.requireSaga || e.reason.length >= 20);
  return (
    <>
      {solo && (
        <details className="cg-help" open>
          <summary>Hør mannskapets ulike forslag</summary>
          {npcVotes(availableChoices(group, pack.port), [
            "språk",
            "sjømannskap",
            "krigskunst",
            "diplomati",
            "tro",
          ]).map((v) => (
            <p key={v.role}>
              <strong>{CREW_ROLES[v.role].title}</strong>:{" "}
              {CREW_ROLES[v.role].argues} Vi foreslår «
              {
                availableChoices(group, pack.port).find(
                  (c) => c.id === v.choiceId,
                )?.title
              }
              ».
            </p>
          ))}
        </details>
      )}
      {Object.keys(e.voteCounts).length > 0 && (
        <p>
          Opptelling:{" "}
          {Object.entries(e.voteCounts)
            .map(
              ([id, n]) =>
                `${availableChoices(group, pack.port).find((c) => c.id === id)?.title}: ${n}`,
            )
            .join(" · ")}
        </p>
      )}
      <Choices
        group={group}
        pack={pack}
        selected={choiceId || e.choiceId || ""}
        onSelect={setChoiceId}
        disabled={!chief || sealed}
        allowed={!solo && settings.requireCouncil ? e.topIds : undefined}
      />
      {chief && !sealed ? (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void send({ type: "decide", choiceId, reason });
          }}
        >
          <Field
            label="Gruppens begrunnelse før utfallet"
            value={reason}
            onChange={setReason}
            multiline
            required={settings.requireSaga}
          />
          <Button
            type="submit"
            disabled={
              busy ||
              !choiceId ||
              (settings.requireSaga && reason.trim().length < 20)
            }
          >
            Bekreft avgjørelsen
          </Button>
        </form>
      ) : (
        <p>{e.reason || "Høvdingen begrunner gruppens avgjørelse."}</p>
      )}
      {e.approval === "pending" && (
        <p className="cg-note">
          Oppgaven venter på lærergodkjenning. Dere kan velge å vente på
          tilbakemeldingen før dere kaster.
        </p>
      )}
      {e.approvalFeedback && (
        <p className="cg-note">Læreren: {e.approvalFeedback}</p>
      )}
      {chief && sealed && (
        <Button
          disabled={busy}
          onClick={() => {
            void send({ type: "roll" });
          }}
        >
          Kast terningen
        </Button>
      )}
    </>
  );
}
function Result({
  group,
  uid,
  busy,
  send,
  pack,
}: Props & { pack: ContentPack }) {
  const e = group.encounter!,
    roll = e.roll!;
  const choice = availableChoices(group, pack.port).find(
    (c) => c.id === e.choiceId,
  )!;
  const outcome = choice.outcomes[roll.tier]!;
  const saga = group.saga.find((s) => s.id === e.id)!;
  return (
    <>
      <p className="cg-countdown">
        {roll.dice.join(" / ")} → {roll.effective}
      </p>
      <h3>{TIER_LABEL[roll.tier]}</h3>
      <p>{outcome.text}</p>
      <p>
        Handel {outcome.trade >= 0 ? "+" : ""}
        {outcome.trade} · Rykte {outcome.rep >= 0 ? "+" : ""}
        {outcome.rep}
      </p>
      <p>{choice.lesson}</p>
      <p className="cg-note">
        Belønningen er allerede lagret én gang. Terningen vurderer ikke den
        faglige kvaliteten i valget deres.
      </p>
      {saga.cardReveal && <p className="cg-note">{saga.cardReveal}</p>}
      {group.chiefId === uid && (
        <Button
          disabled={busy}
          onClick={() => {
            void send({ type: "advance" });
          }}
        >
          Sammenlign og reflekter
        </Button>
      )}
    </>
  );
}
function Reflection({
  group,
  uid,
  busy,
  send,
  pack,
  settings,
}: Props & { pack: ContentPack }) {
  const [comparison, setComparison] = useState("");
  const [reflection, setReflection] = useState("");
  const saved = !!group.encounter!.reflection;
  return (
    <>
      <p>{pack.editorial.historicalComparison}</p>
      <p className="cg-note">{pack.editorial.caution}</p>
      <Sources pack={pack} />
      {pack.port.modernBridge && (
        <>
          <h3>{pack.port.modernBridge.topic}</h3>
          <p>{pack.port.modernBridge.context}</p>
          <p>{pack.port.modernBridge.prompt}</p>
        </>
      )}
      {group.chiefId === uid ? (
        saved ? (
          <Button
            disabled={busy}
            onClick={() => {
              void send({ type: "finish" });
            }}
          >
            Tilbake til sjøkartet
          </Button>
        ) : (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void send({
                type: "reflect",
                historicalComparison: comparison,
                reflection,
              });
            }}
          >
            <Field
              label="Hva støtter kilden, og hva er dramatisert eller usikkert? Sammenlign med valget vårt."
              value={comparison}
              onChange={setComparison}
              multiline
            />
            <Field
              label="Bro til i dag: hva vil vi ta med oss?"
              value={reflection}
              onChange={setReflection}
              multiline
              required={settings.requireBridge && !!pack.port.modernBridge}
            />
            <Button
              type="submit"
              disabled={busy || comparison.trim().length < 20}
            >
              Lagre etterarbeidet
            </Button>
          </form>
        )
      ) : (
        <p>Samtal om kildene sammen. Høvdingen skriver konklusjonen.</p>
      )}
    </>
  );
}
