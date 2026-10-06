import Feedback from "./Feedback";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { GroupView, Rubric, Settings } from "../domain/model";
import { parseBackup } from "../domain/backup";
import { content } from "../content";
import { getRemote } from "./remote";
import type { Session, Intent } from "./store";
import { loadSession, saveSession } from "./store";
import { useGame } from "./useGame";
import { useNow } from "../hooks/useNow";
import { Button, Download, Field, Panel, Shell, SyncStatus } from "./ui";
import { learningCsv, download } from "./files";
import SeaMap from "../components/teacher/SeaMap";
import { PHASE_LABEL } from "../lib/groupStatus";

export default function TeacherPage() {
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(() => {
    const s = loadSession();
    return s?.teacher ? s : null;
  });
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const enter = async (code: string) => {
    const remote = await getRemote();
    const result = await remote.call<{ teacher: boolean }>("joinClassroom", {
      code,
      id: crypto.randomUUID(),
    });
    if (!result.teacher)
      throw new Error(
        "Dette spillet tilhører en annen lærer. Bruk nettleseren som opprettet økten, eller importer en sikkerhetskopi som nytt spill.",
      );
    const s: Session = {
      mode: "online",
      code,
      uid: remote.uid,
      groupId: null,
      teacher: true,
    };
    saveSession(s);
    setSession(s);
  };
  const action = async (work: () => Promise<void>) => {
    setBusy(true);
    setError("");
    try {
      await work();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Handlingen feilet.");
    } finally {
      setBusy(false);
    }
  };
  const home = () => {
    saveSession(null);
    setSession(null);
    navigate("/");
  };
  if (session) return <Console session={session} onHome={home} />;
  return (
    <Shell
      title="Odin · lærerens utsyn"
      subtitle="Opprett en økt, eller gjenoppta et spill du eier."
      action={
        <Button secondary onClick={home}>
          Til forsiden
        </Button>
      }
    >
      {error && (
        <p role="alert" className="cg-note cg-alert">
          {error}
        </p>
      )}
      <div className="cg-grid">
        <Panel title="Nytt klasserom">
          <p>
            Lærertilgangen bindes til innloggingen på denne enheten. Elevene
            trenger bare spillkoden.
          </p>
          <Button
            disabled={busy}
            onClick={() => {
              void action(async () => {
                const remote = await getRemote();
                const id =
                  localStorage.getItem("vikingspill:v2:create-id") ??
                  crypto.randomUUID();
                localStorage.setItem("vikingspill:v2:create-id", id);
                const result = await remote.call<{ code: string }>(
                  "createClassroom",
                  { id },
                );
                await enter(result.code);
                localStorage.removeItem("vikingspill:v2:create-id");
              });
            }}
          >
            Opprett nytt spill
          </Button>
        </Panel>
        <Panel title="Gjenoppta spillet">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void action(() => enter(code));
            }}
          >
            <Field
              label="Spillkode du opprettet"
              value={code}
              onChange={(v) => setCode(v.toUpperCase().replace(/[^A-Z]/g, ""))}
              maxLength={4}
            />
            <Button type="submit" disabled={busy || code.length !== 4}>
              Åpne regipulten
            </Button>
          </form>
        </Panel>
      </div>
      <Panel title="Gjenopprett sikkerhetskopi">
        <p>
          Hele spillet valideres først. Gjenoppretting lager et nytt klasserom
          med en ny kode og deg som eier.
        </p>
        <label className="cg-field">
          Velg sikkerhetskopi
          <input
            type="file"
            accept="application/json,.json"
            disabled={busy}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              void action(async () => {
                const text = await file.text();
                parseBackup(text, content);
                const remote = await getRemote();
                const result = await remote.call<{ code: string }>(
                  "importClassroom",
                  { backup: text, id: crypto.randomUUID() },
                );
                await enter(result.code);
              });
            }}
          />
        </label>
      </Panel>
    </Shell>
  );
}
function Console({
  session,
  onHome,
}: {
  session: Session;
  onHome: () => void;
}) {
  const { state, store } = useGame(session);
  const now = useNow(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<"map" | "review">("map");
  const publicView = state.public;
  const busy = state.pending > 0;
  const groups = state.groups;
  const exportBackup = async () => {
    try {
      const remote = await getRemote();
      const backup = await remote.call("exportClassroom", {
        code: session.code,
      });
      download(
        `vikingspill-${session.code}-backup.json`,
        JSON.stringify(backup, null, 2),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Eksport feilet.");
    }
  };
  return (
    <Shell
      title={`Klasserom ${session.code}`}
      subtitle="Vis koden på storskjermen. Elevene blir med fra flerspiller."
      action={
        <Button secondary onClick={onHome}>
          Til forsiden
        </Button>
      }
    >
      <Feedback code={session.code} screen="lærer" />
      <SyncStatus state={state} store={store} solo={false} />
      {error && (
        <p role="alert" className="cg-note cg-alert">
          {error}
        </p>
      )}
      {!publicView ? (
        <Panel>
          <p>Henter flåten …</p>
        </Panel>
      ) : (
        <>
          <div className="cg-actions">
            <Button secondary onClick={() => setTab("map")}>
              Storskjerm og flåte
            </Button>
            <Button secondary onClick={() => setTab("review")}>
              Oppgaver og vurdering
            </Button>
            <Button
              secondary
              onClick={() => {
                void exportBackup();
              }}
            >
              Sikkerhetskopier hele spillet
            </Button>
            <Download
              filename={`vikingspill-${session.code}-etterarbeid.csv`}
              value={learningCsv(groups)}
            >
              Eksporter etterarbeid
            </Download>
          </div>
          <p className="cg-note">
            {Object.keys(groups).length} skip ·{" "}
            {Object.values(state.presence).filter((p) => p.online).length}{" "}
            tilkoblede enheter ·{" "}
            {Math.max(0, Math.ceil((publicView.endsAt - now) / 60000))} minutter
            igjen av {publicView.settings.minutes}. Tidsplanen er veiledende:
            sett av de siste {publicView.settings.minutes === 45 ? 10 : 20}{" "}
            minuttene til sammenligning og etterarbeid.
          </p>
          {tab === "map" && (
            <>
              <Panel title="Flåten på sjøkartet">
                <SeaMap groups={groups} />
                <div className="cg-table-wrap">
                  <table className="cg-table">
                    <thead>
                      <tr>
                        <th>Skip</th>
                        <th>Medlemmer / tilkoblet</th>
                        <th>Arbeider med</th>
                        <th>Handel</th>
                        <th>Rykte</th>
                        <th>Fagarbeid vurdert</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.values(groups).map((g) => (
                        <tr key={g.id}>
                          <td>{g.shipName}</td>
                          <td>
                            {Object.keys(g.members).length} /{" "}
                            {
                              Object.keys(g.members).filter(
                                (id) => state.presence[id]?.online,
                              ).length
                            }
                          </td>
                          <td>
                            {g.encounter
                              ? `${content.ports.find((p) => p.port.id === g.encounter!.destId)?.port.name} · ${PHASE_LABEL[g.encounter.phase]}`
                              : g.trial
                                ? "Svenneprøve"
                                : "Sjøkart"}
                          </td>
                          <td>{g.scores.tradeGain}</td>
                          <td>{g.scores.reputation}</td>
                          <td>
                            {g.saga.filter((s) => s.assessment).length}/
                            {g.saga.length}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Panel>
              <SettingsPanel
                settings={publicView.settings}
                busy={busy}
                send={store.send}
              />
              <Panel title="Skjebne og felles utfordringer">
                <p>
                  Hendelser gjennomføres én gang per skip. En ny innlogging
                  eller fire elevmaskiner gir ingen ekstra belønning.
                </p>
                <div className="cg-actions">
                  <Button
                    disabled={busy}
                    onClick={() => {
                      void store.send({
                        type: "event",
                        kind: "fate",
                        title: "Skjebnehjulet",
                        message: "",
                      });
                    }}
                  >
                    Trekk skjebne
                  </Button>
                  <Button
                    secondary
                    disabled={busy}
                    onClick={() => {
                      void store.send({
                        type: "event",
                        kind: "trial",
                        title: "Gudenes prøve",
                        message: "",
                      });
                    }}
                  >
                    Åpne Gudenes prøve
                  </Button>
                  <Button
                    secondary
                    disabled={busy}
                    onClick={() => {
                      void store.send({
                        type: "event",
                        kind: "ragnarok",
                        title: "Ragnarok",
                        message:
                          "Halvparten av den positive handelsgevinsten går tapt. Kompetansebevisene beholdes.",
                      });
                    }}
                  >
                    Utløs Ragnarok
                  </Button>
                </div>
                {Object.values(publicView.challenges)
                  .filter((c) => c.status === "open")
                  .map((c) => (
                    <div className="cg-note" key={c.id}>
                      <h3>{c.title}</h3>
                      <p>Bekreft vinner etter den avtalte aktiviteten.</p>
                      <div className="cg-actions">
                        {c.groups.map((id) => (
                          <Button
                            key={id}
                            disabled={busy}
                            onClick={() => {
                              void store.send({
                                type: "resolve_challenge",
                                challengeId: c.id,
                                winnerId: id,
                              });
                            }}
                          >
                            {groups[id]?.shipName} vant
                          </Button>
                        ))}
                      </div>
                    </div>
                  ))}
              </Panel>
            </>
          )}
          {tab === "review" && (
            <>
              {Object.values(groups).map((g) => (
                <GroupReview
                  key={g.id}
                  group={g}
                  busy={busy}
                  send={store.send}
                  presence={state.presence}
                />
              ))}
              {Object.keys(groups).length === 0 && (
                <Panel>
                  <p>Ingen skip ennå. Elevene oppretter skip fra spillkoden.</p>
                </Panel>
              )}
            </>
          )}
          <Panel title="Etterarbeid i klassen">
            <p>
              La hvert skip velge ett møte og vise: avgjørelsen før utfallet, en
              konkret kilde, den andre partens perspektiv og hva spillet
              forenklet. Sammenlign to skip med samme valg og ulik terning.
              Vurder kvaliteten i begrunnelsen, ikke hvem som fikk mest sølv.
            </p>
            <Button
              secondary
              disabled={busy || publicView.closed}
              onClick={() => {
                void store.send({ type: "close_game" });
              }}
            >
              Avslutt økten og behold sagaene
            </Button>
          </Panel>
        </>
      )}
    </Shell>
  );
}
function SettingsPanel({
  settings,
  busy,
  send,
}: {
  settings: Settings;
  busy: boolean;
  send: (i: Intent) => Promise<void>;
}) {
  const labels = {
    requireQuiz: "Individuell stedsquiz",
    requireCouncil: "Bindende flertallsavstemning",
    requireSaga: "Begrunnelse før terningen",
    requirePerspective: "Undersøk den andre partens perspektiv",
    requireBridge: "Bro til i dag i etterarbeidet",
    keyCards: "Private rollekort",
    saboteur: "Skjult interesse (rolleøvelse)",
  } as const;
  return (
    <Panel title="Økt og leselengde">
      <p>
        Endrede krav gjelder fra neste kulturmøte. Pågående runder beholder
        oppsettet de startet med.
      </p>
      <label className="cg-field">
        Øktlengde
        <select
          value={settings.minutes}
          disabled={busy}
          onChange={(event) => {
            void send({
              type: "settings",
              settings: {
                ...settings,
                minutes: Number(event.target.value) as 45 | 90,
              },
            });
          }}
        >
          <option value={45}>
            45 minutter · 2–3 møter og 10 minutter etterarbeid
          </option>
          <option value={90}>
            90 minutter · flere møter og 20 minutter etterarbeid
          </option>
        </select>
      </label>
      <label className="cg-field">
        Leselengde
        <select
          value={settings.textLength}
          disabled={busy}
          onChange={(event) => {
            void send({
              type: "settings",
              settings: {
                ...settings,
                textLength: event.target.value as Settings["textLength"],
              },
            });
          }}
        >
          <option value="group">Elevene velger kort eller full tekst</option>
          <option value="short">Kort tekst som utgangspunkt</option>
          <option value="full">Full tekst som utgangspunkt</option>
        </select>
      </label>
      <div className="cg-grid">
        {Object.entries(labels).map(([key, label]) => (
          <label className="cg-field" key={key}>
            <span>
              <input
                type="checkbox"
                checked={settings[key as keyof typeof labels]}
                disabled={busy}
                onChange={(event) => {
                  void send({
                    type: "settings",
                    settings: { ...settings, [key]: event.target.checked },
                  });
                }}
              />{" "}
              {label}
            </span>
          </label>
        ))}
      </div>
    </Panel>
  );
}
function GroupReview({
  group,
  busy,
  send,
  presence,
}: {
  group: GroupView;
  busy: boolean;
  send: (i: Intent) => Promise<void>;
  presence: Record<string, { online: boolean; at: number }>;
}) {
  const [feedback, setFeedback] = useState("");
  const [excuse, setExcuse] = useState("");
  const [memberId, setMemberId] = useState("");
  const e = group.encounter;
  return (
    <Panel title={group.shipName}>
      <p>
        Høvding: {group.members[group.chiefId]?.label}.{" "}
        {e
          ? `Rundens mannskap: ${e.eligible.length}; steg: ${PHASE_LABEL[e.phase]}.`
          : "Gruppen er på kartet eller i en prøve."}
      </p>
      {e &&
        Object.entries(e.evidence).map(([id, v]) => (
          <div className="cg-note" key={id}>
            <strong>{group.members[id]?.label}</strong>
            <p>{v.fact}</p>
            <p>{v.interpretation}</p>
            <p>{v.perspective}</p>
            <p>
              Kilde: {v.sourceId}. Quiz: {e.quizResults[id]?.correct}/
              {e.quizResults[id]?.total}.
            </p>
          </div>
        ))}
      <Field
        label="Tilbakemelding til oppgaven eller praksisprøven"
        value={feedback}
        onChange={setFeedback}
        multiline
      />
      <div className="cg-actions">
        {e?.approval === "pending" && !e.settled && (
          <>
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
          </>
        )}
        {group.trial?.phase === "pending" && (
          <>
            <p>{group.trial.practice}</p>
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
          </>
        )}
        <Button
          secondary
          disabled={busy}
          onClick={() => {
            void send({
              type: "event",
              groupId: group.id,
              kind: "summon",
              title: "Kom til læreren",
              message: feedback || "Kom bort til læreren med gruppen.",
            });
          }}
        >
          Kall inn gruppen
        </Button>
      </div>
      <details className="cg-help">
        <summary>Hjelp når noen har falt ut</summary>
        <label className="cg-field">
          Medlem
          <select
            value={memberId}
            onChange={(event) => setMemberId(event.target.value)}
          >
            <option value="">Velg medlem</option>
            {Object.entries(group.members).map(([id, m]) => (
              <option key={id} value={id}>
                {m.label} · {presence[id]?.online ? "tilkoblet" : "frakoblet"}
              </option>
            ))}
          </select>
        </label>
        <Field
          label="Begrunn hvorfor medlemmet fritas i denne runden"
          value={excuse}
          onChange={setExcuse}
          multiline
        />
        <div className="cg-actions">
          <Button
            secondary
            disabled={busy || !memberId || excuse.trim().length < 10}
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
            disabled={busy || !memberId}
            onClick={() => {
              void send({ type: "transfer", groupId: group.id, memberId });
            }}
          >
            Gi medlemmet roret
          </Button>
        </div>
      </details>
      {group.saga.map((s) => (
        <Assessment
          key={s.id}
          groupId={group.id}
          saga={s}
          send={send}
          busy={busy}
        />
      ))}
    </Panel>
  );
}
function Assessment({
  groupId,
  saga,
  send,
  busy,
}: {
  groupId: string;
  saga: GroupView["saga"][number];
  send: (i: Intent) => Promise<void>;
  busy: boolean;
}) {
  const [rubric, setRubric] = useState<Rubric>(
    saga.assessment ?? {
      reasoning: 0,
      sourceUse: 0,
      perspective: 0,
      feedback: "",
    },
  );
  return (
    <details className="cg-help">
      <summary>
        {saga.destName} · faglig vurdering{" "}
        {saga.assessment ? "registrert" : "venter"}
      </summary>
      <p>
        <strong>Valg:</strong> {saga.choiceTitle}. {saga.reason}
      </p>
      <p>
        <strong>Kilder og sammenligning:</strong> {saga.historicalComparison}
      </p>
      <p>
        <strong>Bro:</strong> {saga.reflection}
      </p>
      {Object.values(saga.evidence).map((v, i) => (
        <p key={i}>
          {v.fact}
          <br />
          {v.interpretation}
          <br />
          {v.perspective}
        </p>
      ))}
      <p className="cg-note">
        0 = ikke vist · 1 = noe forklart · 2 = konkret, faglig begrunnet og
        nyansert. Resultatet på terningen gir ingen fagpoeng.
      </p>
      <div className="cg-grid">
        {(["reasoning", "sourceUse", "perspective"] as const).map((k) => (
          <label className="cg-field" key={k}>
            {
              {
                reasoning: "Begrunnelse",
                sourceUse: "Kildebruk",
                perspective: "Perspektiv",
              }[k]
            }
            <select
              aria-label={
                {
                  reasoning: "Begrunnelse",
                  sourceUse: "Kildebruk",
                  perspective: "Perspektiv",
                }[k]
              }
              value={rubric[k]}
              onChange={(event) =>
                setRubric((old) => ({
                  ...old,
                  [k]: Number(event.target.value),
                }))
              }
            >
              {[0, 1, 2].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
        ))}
      </div>
      <Field
        label="Faglig tilbakemelding"
        value={rubric.feedback}
        onChange={(feedback) => setRubric((old) => ({ ...old, feedback }))}
        multiline
      />
      <Button
        disabled={busy || rubric.feedback.trim().length < 5}
        onClick={() => {
          void send({ type: "assess", groupId, sagaId: saga.id, rubric });
        }}
      >
        Lagre faglig vurdering
      </Button>
    </details>
  );
}
