import Feedback from "./Feedback";
import GameAudio from "./GameAudio";
import Holmgang from "./Holmgang";
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { content } from "../content";
import { HELM_FAILOVER_MS, SKILLS } from "../domain/model";
import { makeBackup } from "../domain/backup";
import { TOPIC_LABEL, trialAvailability } from "../domain/trials";
import FateWheel from "./FateWheel";
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
        uid={session.mode === "online" ? session.uid : undefined}
        screen={
          state.public?.closed
            ? "avsluttet"
            : (group?.encounter?.phase ??
              (group?.trial ? "prøve" : group ? "sjøkart" : "mannskap"))
        }
        destId={group?.encounter?.destId}
        encounterId={group?.encounter?.id}
        endOfSession={!!state.public?.closed}
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
          <Holmgang
            group={group}
            view={state.public!}
            uid={session.uid}
            busy={busy}
            send={store.send}
            clockOffset={state.clockOffset}
            solo={session.mode === "solo"}
          />
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
          {state.public?.wheel && (
            <details className="cg-help">
              <summary>Skjebnehjulets siste resultat</summary>
              <FateWheel compact spin={state.public.wheel} />
            </details>
          )}
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
        {Object.keys(group.members).length} medlemmer · {online} tilkoblet. Ved
        roret: {group.members[group.chiefId]?.label}. Alle bidrar uten faste
        roller.
      </p>
      {Object.values(group.conditions).some((n) => n !== 0) && (
        <p className="cg-small">
          Midlertidig mannskapstilstand:{" "}
          {Object.entries(group.conditions)
            .map(
              ([k, n]) => `${TOPIC_LABEL[k as keyof typeof TOPIC_LABEL]} ${n}`,
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
              now - (currentChief?.at ?? now) > HELM_FAILOVER_MS && (
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
        trialUnlocks={
          Object.fromEntries(
            SKILLS.map((skill) => {
              const a = trialAvailability(group, skill);
              return [
                skill,
                {
                  available: a.available,
                  missing: a.missing.map(
                    (id) =>
                      content.ports.find((p) => p.port.id === id)!.port.name,
                  ),
                },
              ];
            }),
          ) as Record<
            (typeof SKILLS)[number],
            { available: boolean; missing: string[] }
          >
        }
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
        <div className="cg-trial-grid">
          {SKILLS.map((k) => {
            const a = trialAvailability(group, k);
            return (
              <div className="cg-trial-card" key={k}>
                <h3>{TOPIC_LABEL[k]}</h3>
                <p className="cg-small">
                  {group.svennebrev[k] === 2
                    ? "Begge prøver bestått"
                    : `${a.level === 1 ? "Svenneprøve" : "Mesterprøve"} · ${a.route.title}`}
                </p>
                <p>
                  {a.route.ports
                    .map(
                      (id) =>
                        `${group.visited.includes(id) ? "Besøkt" : "Gjenstår"}: ${content.ports.find((p) => p.port.id === id)!.port.name}`,
                    )
                    .join(" · ")}
                </p>
                <Button
                  secondary
                  disabled={!chief || busy || !a.available}
                  onClick={() => {
                    void store.send({ type: "start_trial", skill: k });
                  }}
                >
                  {group.svennebrev[k] === 2
                    ? "Bestått"
                    : a.available
                      ? `Start ${a.level === 1 ? "svenneprøven" : "mesterprøven"}`
                      : "Låst · fullfør besøkene"}
                </Button>
              </div>
            );
          })}
        </div>
      </Panel>
      {group.visited.length > 0 && (
        <details className="cg-help">
          <summary>
            Reiseboken · {group.visited.length} fullførte havnebesøk
          </summary>
          {group.visited.map((id) => (
            <div key={id}>
              <h3>{content.ports.find((p) => p.port.id === id)?.port.name}</h3>
              <ul>
                {content.journey[id].notes.map((note) => (
                  <li key={note}>{note}</li>
                ))}
              </ul>
            </div>
          ))}
        </details>
      )}
      {solo && (
        <Panel title="Skjebnehjulet">
          <p>
            Spinn en sjøhendelse eller en laglek. Reisen og kompetansebevisene
            beholdes.
          </p>
          <FateWheel
            spin={state.public?.wheel ?? null}
            busy={busy}
            onSpin={() => {
              void store.send({ type: "spin_wheel" });
            }}
          />
        </Panel>
      )}
    </>
  );
}
