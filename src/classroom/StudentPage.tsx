import Feedback from "./Feedback";
import GameAudio from "./GameAudio";
import Holmgang from "./Holmgang";
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { content } from "../content";
import { SKILLS } from "../domain/model";
import { makeBackup } from "../domain/backup";
import { CREW_ROLES } from "../data/crewRoles";
import { getRemote } from "./remote";
import { loadSession, saveSession, soloSession } from "./store";
import type { Session, Snapshot, GameStore } from "./store";
import { useGame } from "./useGame";
import { Button, Download, Field, Panel, Shell, SyncStatus } from "./ui";
import ShipSetup from "./ShipSetup";
import Encounter from "./Encounter";
import Trial from "./Trial";
import Debrief from "./Debrief";
import TradePanel from "./TradePanel";
import SeaJourney from "../components/dashboard/SeaJourney";
import { useNow } from "../hooks/useNow";

export default function StudentPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(() => {
    if (params.get("mode") === "solo") {
      const s = soloSession();
      saveSession(s);
      return s;
    }
    const old = loadSession();
    return old && !old.teacher ? old : null;
  });
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const home = () => {
    saveSession(null);
    setSession(null);
    navigate("/");
  };
  if (session)
    return (
      <ActiveStudent
        key={`${session.code}:${session.uid}:${session.groupId ?? ""}`}
        session={session}
        onSession={(s) => {
          saveSession(s);
          setSession(s);
        }}
        onHome={home}
      />
    );
  return (
    <Shell
      title="Bli med i flåten"
      subtitle="Tast lærerens firebokstavskode."
      action={
        <Button secondary onClick={home}>
          Til forsiden
        </Button>
      }
    >
      <Panel title="Flerspiller">
        <form
          onSubmit={async (event) => {
            event.preventDefault();
            setBusy(true);
            setError("");
            try {
              const remote = await getRemote();
              const result = await remote.call<{ groupId: string | null }>(
                "joinClassroom",
                { code: code.trim().toUpperCase(), id: crypto.randomUUID() },
              );
              const s: Session = {
                mode: "online",
                code: code.trim().toUpperCase(),
                uid: remote.uid,
                groupId: result.groupId,
                teacher: false,
              };
              saveSession(s);
              setSession(s);
            } catch (e) {
              setError(e instanceof Error ? e.message : "Tilkoblingen feilet.");
            } finally {
              setBusy(false);
            }
          }}
        >
          <Field
            label="Spillkode"
            value={code}
            onChange={(v) => setCode(v.toUpperCase().replace(/[^A-Z]/g, ""))}
            maxLength={4}
          />
          <Button type="submit" disabled={busy || code.length !== 4}>
            Bli med i spillet
          </Button>
        </form>
        {error && (
          <p role="alert" className="cg-note cg-alert">
            {error}
          </p>
        )}
      </Panel>
      <Panel title="Øv alene">
        <p>
          Spill uten kode i ditt eget tempo. Hele økten, inkludert pågående
          kulturmøte, lagres på denne enheten.
        </p>
        <Button
          onClick={() => {
            const s = soloSession();
            saveSession(s);
            setSession(s);
          }}
        >
          Sett seil alene
        </Button>
      </Panel>
    </Shell>
  );
}
function ActiveStudent({
  session,
  onSession,
  onHome,
}: {
  session: Session;
  onSession: (s: Session) => void;
  onHome: () => void;
}) {
  const { state, store } = useGame(session);
  const now = useNow(true);
  const assigned = Object.values(state.public?.groups ?? {}).find(
    (g) => g.members[session.uid],
  );
  useEffect(() => {
    if (session.mode === "online" && !session.groupId && assigned)
      onSession({ ...session, groupId: assigned.id });
  }, [assigned, session, onSession]);
  const group = state.group;
  const busy = state.pending > 0;
  return (
    <Shell
      title={group?.shipName ?? "Velg mannskap"}
      subtitle={
        session.mode === "solo"
          ? "Øvingsmodus · én enhet"
          : `Klasserom ${session.code}`
      }
      action={
        <Button secondary onClick={onHome}>
          Til forsiden
        </Button>
      }
    >
      <GameAudio group={group} />
      <Feedback
        code={session.mode === "online" ? session.code : undefined}
        screen={group?.encounter?.phase ?? "sjøkart"}
      />
      <SyncStatus state={state} store={store} solo={session.mode === "solo"} />
      <details className="cg-help">
        <summary>Slik spiller dere</summary>
        <p>
          Høvdingen velger havn og åpner stegene. Hver elev leverer egne fakta,
          begrunnelse og perspektiv. Diskuter før hemmelig avstemning;
          flertallet bestemmer, og høvdingen bryter bare likhet. Deretter
          begrunner gruppen, kaster og sammenligner med historien. Læreren
          vurderer fagarbeidet separat.
        </p>
        <p>
          Ragnarok, skjebne og utfordringer avgjøres én gang på serveren. Ved
          frakobling viser lagringslinjen om handlingen venter. Gå tilbake til
          samme nettleser for å gjenoppta økten.
        </p>
      </details>
      {!state.ready ? (
        <Panel>
          <p>Henter skipets logg …</p>
        </Panel>
      ) : state.public?.closed ? (
        <Panel title="Økten er avsluttet">
          <p>Sagaen og etterarbeidet kan lastes ned.</p>
          {group && (
            <Debrief group={group} solo={false} send={store.send} busy={true} />
          )}
        </Panel>
      ) : !group ? (
        <ShipSetup
          groups={state.public?.groups ?? {}}
          busy={busy}
          send={store.send}
        />
      ) : (
        <>
          <Crew
            state={state}
            store={store}
            uid={session.uid}
            solo={session.mode === "solo"}
          />
          {group.notices
            .filter((n) => !n.ackedBy.includes(session.uid))
            .map((n) => (
              <Panel title={n.title} key={n.id}>
                <p>{n.text}</p>
                <Button
                  disabled={busy}
                  onClick={() => {
                    void store.send({ type: "ack", noticeId: n.id });
                  }}
                >
                  Lest / vi er på vei
                </Button>
              </Panel>
            ))}
          {group.encounter ? (
            <Encounter
              key={group.encounter.id}
              group={group}
              privateView={state.private}
              uid={session.uid}
              settings={group.encounter.settings}
              solo={session.mode === "solo"}
              busy={busy}
              send={store.send}
            />
          ) : group.trial ? (
            <Trial
              key={group.trial.id}
              group={group}
              uid={session.uid}
              solo={session.mode === "solo"}
              busy={busy}
              send={store.send}
            />
          ) : (
            <Journey
              state={state}
              store={store}
              uid={session.uid}
              solo={session.mode === "solo"}
            />
          )}
          {Object.values(state.public?.challenges ?? {})
            .filter((c) => c.groups.includes(group.id))
            .map((c) => (
              <p className="cg-note" key={c.id}>
                {c.title}:{" "}
                {c.status === "open"
                  ? "Åpen utfordring. Avtal gjennomføring med læreren."
                  : `${state.public?.groups[c.winnerId!]?.shipName} vant.`}
              </p>
            ))}
          <Holmgang />
          <TradePanel
            group={group}
            publicView={state.public!}
            chief={group.chiefId === session.uid}
            busy={busy}
            send={store.send}
          />
          <Debrief
            group={group}
            solo={session.mode === "solo"}
            busy={busy}
            send={store.send}
          />
          {session.mode === "solo" && (
            <Download
              filename="vikingspill-oving-backup.json"
              value={makeBackup(store.exportSolo(), now)}
            >
              Sikkerhetskopier øvingsøkten
            </Download>
          )}
        </>
      )}
    </Shell>
  );
}
function Crew({
  state,
  store,
  uid,
  solo,
}: {
  state: Snapshot;
  store: GameStore;
  uid: string;
  solo: boolean;
}) {
  const group = state.group!;
  const now = useNow(true);
  const chief = group.chiefId === uid;
  const [candidate, setCandidate] = useState("");
  const online = Object.keys(group.members).filter(
    (id) => solo || state.presence[id]?.online,
  ).length;
  const currentChief = state.presence[group.chiefId];
  return (
    <Panel title="Mannskapet">
      <div className="cg-score">
        <div>
          <b>{group.scores.tradeGain}</b>Handel · spillutfall
        </div>
        <div>
          <b>{group.scores.reputation}</b>Rykte · spillutfall
        </div>
        <div>
          <b>{group.scores.culturalUnderstanding}</b>Faglig vurdering ·{" "}
          {group.saga.filter((s) => s.assessment).length} vurderte bidrag
        </div>
      </div>
      <p>
        {Object.keys(group.members).length} medlemmer · {online} tilkoblet.
        Høvding: {group.members[group.chiefId]?.label}. Din rolle:{" "}
        {CREW_ROLES[group.members[uid].role].title}.
      </p>
      {Object.values(group.conditions).some((n) => n !== 0) && (
        <p className="cg-small">
          Midlertidig mannskapstilstand:{" "}
          {Object.entries(group.conditions)
            .map(
              ([k, n]) =>
                `${CREW_ROLES[k as keyof typeof CREW_ROLES].title} ${n}`,
            )
            .join(" · ")}
          . Beståtte kompetansebevis påvirkes ikke av skjebnen.
        </p>
      )}
      {!solo && (
        <details className="cg-help">
          <summary>Roret og tinget</summary>
          <label className="cg-field">
            Kandidat
            <select
              value={candidate}
              onChange={(e) => setCandidate(e.target.value)}
            >
              <option value="">Velg medlem</option>
              {Object.entries(group.members)
                .filter(([id]) => id !== group.chiefId)
                .map(([id, m]) => (
                  <option key={id} value={id}>
                    {m.label}
                  </option>
                ))}
            </select>
          </label>
          <div className="cg-actions">
            {chief && (
              <Button
                secondary
                disabled={!candidate || state.pending > 0}
                onClick={() => {
                  void store.send({ type: "transfer", memberId: candidate });
                }}
              >
                Gi roret videre
              </Button>
            )}
            <Button
              secondary
              disabled={
                !candidate ||
                state.pending > 0 ||
                !!group.ting ||
                now - group.lastTingAt < 180000
              }
              onClick={() => {
                void store.send({ type: "call_ting", candidateId: candidate });
              }}
            >
              Kall inn tinget
            </Button>
            {!chief &&
              !currentChief?.online &&
              now - (currentChief?.at ?? now) > 60000 && (
                <Button
                  disabled={state.pending > 0}
                  onClick={() => {
                    void store.send({ type: "take_helm" });
                  }}
                >
                  Ta roret etter frakobling
                </Button>
              )}
          </div>
        </details>
      )}
      {group.ting && (
        <div className="cg-note">
          <p>
            Tinget: behold {group.members[group.ting.incumbentId]?.label} eller
            velg {group.members[group.ting.candidateId]?.label}?{" "}
            {group.ting.votedCount}/{group.ting.eligible.length} har stemt.
          </p>
          {state.private.tingVote ? (
            <p>Din stemme er forseglet.</p>
          ) : (
            <div className="cg-actions">
              {[group.ting.incumbentId, group.ting.candidateId].map((id) => (
                <Button
                  key={id}
                  disabled={state.pending > 0}
                  onClick={() => {
                    void store.send({ type: "ting_vote", candidateId: id });
                  }}
                >
                  {group.members[id]?.label}
                </Button>
              ))}
            </div>
          )}
        </div>
      )}
    </Panel>
  );
}
function Journey({
  state,
  store,
  uid,
  solo,
}: {
  state: Snapshot;
  store: GameStore;
  uid: string;
  solo: boolean;
}) {
  const group = state.group!,
    chief = group.chiefId === uid;
  const [selected, setSelected] = useState<string | null>(null);
  const busy = state.pending > 0;
  return (
    <>
      <SeaJourney
        destinations={content.ports.map((p) => p.port)}
        visited={group.visited}
        locked={group.locked}
        goods={group.goods}
        svennebrev={group.svennebrev}
        scores={group.scores}
        unlockedSides={group.unlockedSides}
        performedActions={group.performedActions}
        ship={{
          name: group.shipName,
          symbol: group.shipSymbol,
          color: group.shipColor,
        }}
        isChief={chief && !busy}
        previewDestId={selected}
        sailingTo={null}
        onSelect={setSelected}
        onConfirm={(destId) => {
          void store.send({ type: "sail", destId });
        }}
        onStartSvenneprove={(_dest, skill) => {
          void store.send({ type: "start_trial", skill });
        }}
        onPerformAction={(action) => {
          void store.send({ type: "action", actionId: action.id });
        }}
      />
      <div className="cg-map-list" aria-label="Velg havn fra liste">
        {content.ports.map((p) => (
          <Button
            key={p.port.id}
            secondary
            disabled={!chief || busy}
            onClick={() => setSelected(p.port.id)}
          >
            {p.port.name}
            {group.visited.includes(p.port.id) ? " · besøkt" : ""}
          </Button>
        ))}
      </div>
      <Panel title="Svenneprøver">
        <p>
          Kompetansebevis åpner sidesteder og ekstra valg. Teori om besøkte
          havner og en faglig praksisoppgave må bestås.
        </p>
        <div className="cg-actions">
          {SKILLS.map((k) => (
            <Button
              key={k}
              secondary
              disabled={!chief || busy || group.svennebrev[k] === 2}
              onClick={() => {
                void store.send({ type: "start_trial", skill: k });
              }}
            >
              {CREW_ROLES[k].title} ·{" "}
              {group.svennebrev[k] === 0
                ? "ingen brev"
                : group.svennebrev[k] === 1
                  ? "Sveinn"
                  : "Mester"}
            </Button>
          ))}
        </div>
      </Panel>
      {solo && (
        <Panel title="Skjebnehjulet">
          <p>Prøv en tilfeldig sjøhendelse. Kompetansebevisene beholdes.</p>
          <Button
            secondary
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
        </Panel>
      )}
    </>
  );
}
