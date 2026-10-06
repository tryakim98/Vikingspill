import { useEffect, useRef, useState } from "react";
import SeaMap from "../../components/teacher/SeaMap";
import Icon from "../../components/decor/Icon";
import { groupStatus } from "../../lib/groupStatus";
import { useNow } from "../../hooks/useNow";
import type { Session } from "../store";
import { useGame } from "../useGame";
import { getRemote } from "../remote";
import { download } from "../files";
import { Button, Shell, SyncStatus } from "../ui";
import Feedback from "../Feedback";
import Overview from "./Overview";
import Review, { type ReviewDrafts } from "./Review";
import { EventsPanel, SettingsPanel } from "./Controls";
import { attention, onlineMembers, reviewCount } from "./status";
import "./teacher.css";

const TABS = [
  ["overview", "Oversikt", "compass"],
  ["review", "Oppgaver og vurdering", "scroll"],
  ["events", "Hendelser", "horn"],
  ["settings", "Økt og innstillinger", "gear"],
] as const;
type Tab = (typeof TABS)[number][0];

export default function TeacherConsole({
  session,
  onHome,
}: {
  session: Session;
  onHome: () => void;
}) {
  const { state, store } = useGame(session);
  const now = useNow(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<Tab>("overview");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [drafts, updateDrafts] = useState<ReviewDrafts>({
    assessments: {},
    notes: {},
  });
  const [presenting, setPresenting] = useState(false);
  const [copied, setCopied] = useState(false);
  const presentButton = useRef<HTMLButtonElement>(null);
  const exitButton = useRef<HTMLButtonElement>(null);
  const view = state.public;
  const groups = state.groups;
  const fleet = Object.values(groups);
  const busy = state.pending > 0;
  const pending = fleet.reduce((sum, g) => sum + reviewCount(g), 0);
  const waiting = fleet.filter(
    (g) => attention(g, state.presence, now).length,
  ).length;
  const members = fleet.reduce(
    (sum, g) => sum + Object.keys(g.members).length,
    0,
  );
  const online = fleet.reduce(
    (sum, g) => sum + onlineMembers(g, state.presence, now).length,
    0,
  );
  const minutesLeft = view
    ? Math.max(0, Math.ceil((view.endsAt - now) / 60000))
    : 0;
  const afterwork = view
    ? minutesLeft <= (view.settings.minutes === 45 ? 10 : 20)
    : false;
  const exit = () => {
    setPresenting(false);
    requestAnimationFrame(() => presentButton.current?.focus());
  };
  useEffect(() => {
    if (!presenting) return;
    exitButton.current?.focus();
    const handle = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setPresenting(false);
        requestAnimationFrame(() => presentButton.current?.focus());
      }
    };
    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  }, [presenting]);
  const onReview = (id: string) => {
    setSelectedId(id);
    setTab("review");
  };
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
  if (presenting && view)
    return (
      <main className="viking-screen cg-screen cg-teacher td-presentation">
        <div className="td-presentation-wrap">
          <header className="td-presentation-header">
            <div>
              <p className="td-kicker">Vikingenes kulturmøter</p>
              <h1>Flåten på sjøkartet</h1>
            </div>
            <div className="td-presentation-code">
              <span>Spillkode</span>
              <strong>{session.code}</strong>
            </div>
            <div className="td-presentation-time">
              <strong>
                {view.closed ? "Avsluttet" : `${minutesLeft} min`}
              </strong>
              <span>
                {view.closed
                  ? "Tid for å sammenligne reisene"
                  : afterwork
                    ? "Tid for etterarbeid"
                    : "igjen av økten"}
              </span>
            </div>
            <button
              className="cg-button cg-secondary"
              ref={exitButton}
              onClick={exit}
              type="button"
            >
              Tilbake til regipulten
            </button>
          </header>
          {!state.connected && (
            <p className="td-stage-notice" role="status">
              Forbindelsen er brutt. Kartet viser sist mottatte status.
            </p>
          )}
          <SeaMap groups={groups} />
          <ul className="td-stage-fleet">
            {fleet.map((g) => (
              <li key={g.id}>
                <span
                  className="td-ship-color"
                  style={{ backgroundColor: g.shipColor }}
                />
                <strong>{g.shipName}</strong>
                <span>{groupStatus(g).text}</span>
              </li>
            ))}
          </ul>
          <p className="td-caption">
            Stilisert sjøkart · Velg flerspiller og skriv inn koden for å bli
            med · Esc går tilbake til regipulten
          </p>
        </div>
      </main>
    );
  return (
    <Shell
      className="cg-teacher"
      title="Odin · lærerens utsyn"
      subtitle="Følg reisen. Se hvem som trenger deg. Gi fagarbeidet plass."
      action={
        <div className="cg-actions">
          <button
            ref={presentButton}
            className="cg-button td-present-button"
            type="button"
            disabled={!view}
            onClick={() => setPresenting(true)}
          >
            <Icon name="monitor" size={20} />
            Vis på storskjerm
          </button>
          <Button secondary onClick={onHome}>
            Til forsiden
          </Button>
        </div>
      }
    >
      {!view ? (
        <section className="td-card td-empty" role="status">
          <h2>Henter flåten …</h2>
          <SyncStatus state={state} store={store} solo={false} />
        </section>
      ) : (
        <>
          <section
            className="td-command-bar"
            aria-label="Status i klasserommet"
          >
            <div className="td-code-card">
              <span className="td-kicker">Spillkode</span>
              <strong className="td-code-value">{session.code}</strong>
              <button
                type="button"
                onClick={() => {
                  void navigator.clipboard
                    .writeText(session.code)
                    .then(() => setCopied(true))
                    .catch(() =>
                      setError(
                        "Koden kunne ikke kopieres. Marker den og kopier manuelt.",
                      ),
                    );
                }}
              >
                {copied ? "Koden er kopiert" : "Kopier kode"}
              </button>
            </div>
            <div className="td-timer">
              <span className="td-kicker">
                {view.closed
                  ? "Økten er avsluttet"
                  : afterwork
                    ? "Tid for etterarbeid"
                    : "Veiledende tid igjen"}
              </span>
              <strong>
                {view.closed ? "Ferdig" : minutesLeft}
                <small>{!view.closed && " min"}</small>
              </strong>
              <progress
                max={view.settings.minutes}
                value={Math.min(minutesLeft, view.settings.minutes)}
                aria-label="Tid igjen av økten"
              />
              <span className="td-caption">
                {view.closed
                  ? "Sagaer og vurderinger er bevart"
                  : `Av ${view.settings.minutes} minutter · ${view.settings.minutes === 45 ? 10 : 20} min til etterarbeid`}
              </span>
            </div>
            <dl className="td-session-stats">
              <div>
                <dt>Skip på reisen</dt>
                <dd>{fleet.length}</dd>
              </div>
              <div>
                <dt>Mannskap tilkoblet</dt>
                <dd>
                  {online}
                  <small> / {members}</small>
                </dd>
              </div>
              <div className={waiting ? "td-stat-wait" : ""}>
                <dt>Trenger et blikk</dt>
                <dd>
                  {waiting}
                  <small> skip</small>
                </dd>
              </div>
            </dl>
          </section>
          <SyncStatus state={state} store={store} solo={false} />
          <nav className="td-navigation" aria-label="Lærerverktøy">
            {TABS.map(([id, label, icon]) => (
              <button
                type="button"
                key={id}
                aria-label={label}
                aria-pressed={tab === id}
                aria-controls="teacher-workspace"
                onClick={() => {
                  if (id === "review" && !selectedId)
                    setSelectedId(fleet[0]?.id ?? null);
                  setTab(id);
                }}
              >
                <Icon name={icon} size={20} />
                <span>{label}</span>
                {id === "review" && pending > 0 && (
                  <span className="td-nav-count">{pending}</span>
                )}
              </button>
            ))}
          </nav>
          {error && (
            <p className="cg-note cg-alert" role="alert">
              {error}
            </p>
          )}
          <div id="teacher-workspace" className="td-workspace">
            {tab === "overview" && (
              <Overview
                groups={groups}
                presence={state.presence}
                now={now}
                onReview={onReview}
              />
            )}
            {tab === "review" && (
              <Review
                groups={groups}
                presence={state.presence}
                now={now}
                selectedId={selectedId}
                onSelect={setSelectedId}
                busy={busy}
                closed={view.closed}
                send={store.send}
                drafts={drafts}
                updateDrafts={updateDrafts}
              />
            )}
            {tab === "events" && (
              <EventsPanel
                view={view}
                groups={groups}
                busy={busy}
                send={store.send}
              />
            )}
            {tab === "settings" && (
              <SettingsPanel
                view={view}
                groups={groups}
                busy={busy}
                send={store.send}
                onBackup={() => {
                  void exportBackup();
                }}
              />
            )}
          </div>
        </>
      )}
      <footer className="td-footer">
        <Feedback code={session.code} screen="lærer" />
        <p>
          Odin følger flåten · Terningen avgjør spillets utfall. Du vurderer
          fagarbeidet.
        </p>
      </footer>
    </Shell>
  );
}
