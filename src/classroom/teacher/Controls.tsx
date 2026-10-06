import type { GroupView, PublicView, Settings } from "../../domain/model";
import type { Intent } from "../store";
import { Button, Download } from "../ui";
import { learningCsv } from "../files";
import FeedbackInbox from "./FeedbackInbox";
import type { FeedbackInboxState } from "./useFeedbackInbox";

type Send = (intent: Intent) => Promise<void>;
const REQUIREMENTS = [
  [
    "requireQuiz",
    "Individuell stedsquiz",
    "Hver elev viser hva de har forstått om stedet.",
  ],
  [
    "requireCouncil",
    "Bindende flertallsavstemning",
    "Alle i mannskapet deltar i avgjørelsen.",
  ],
  [
    "requireSaga",
    "Begrunnelse før terningen",
    "Gruppen forklarer valget før de kjenner utfallet.",
  ],
  [
    "requirePerspective",
    "Den andre partens perspektiv",
    "Elevene undersøker hvordan møtet kan oppleves av andre.",
  ],
  [
    "requireBridge",
    "Bro til i dag",
    "Gruppen tar med en innsikt til vår egen tid.",
  ],
  [
    "keyCards",
    "Private rollekort",
    "En rolle får informasjon som kan bringes inn i samtalen.",
  ],
  [
    "saboteur",
    "Skjult interesse",
    "En rolleøvelse med en egen interesse i rådslagningen.",
  ],
] as const;

export function SettingsPanel({
  view,
  groups,
  busy,
  send,
  onBackup,
  feedback,
}: {
  view: PublicView;
  groups: Record<string, GroupView>;
  busy: boolean;
  send: Send;
  onBackup: () => void;
  feedback: FeedbackInboxState;
}) {
  const settings = view.settings;
  const disabled = busy || view.closed;
  return (
    <div className="td-settings-layout">
      <section className="td-card">
        <p className="td-kicker">Tilpass undervisningen</p>
        <h2>Økt og leselengde</h2>
        <p className="td-caption">
          Endrede krav gjelder fra neste kulturmøte. Pågående runder beholder
          sitt oppsett.
        </p>
        <div className="td-rubric-grid">
          <label className="cg-field">
            Øktlengde
            <select
              aria-label="Øktlengde"
              value={settings.minutes}
              disabled={disabled}
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
              <option value={45}>45 minutter</option>
              <option value={90}>90 minutter</option>
            </select>
          </label>
          <label className="cg-field">
            Leselengde
            <select
              aria-label="Leselengde"
              value={settings.textLength}
              disabled={disabled}
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
              <option value="group">
                Elevene velger kort eller full tekst
              </option>
              <option value="short">Kort tekst som utgangspunkt</option>
              <option value="full">Full tekst som utgangspunkt</option>
            </select>
          </label>
        </div>
        <p className="td-caption">
          Sett av de siste {settings.minutes === 45 ? "10" : "20"} minuttene til
          sammenligning og etterarbeid.
        </p>
        <fieldset className="td-requirements">
          <legend>Oppgaver og roller</legend>
          {REQUIREMENTS.map(([key, label, description]) => (
            <label className="td-checkbox td-requirement" key={key}>
              <input
                type="checkbox"
                checked={settings[key]}
                disabled={disabled}
                onChange={(event) => {
                  void send({
                    type: "settings",
                    settings: { ...settings, [key]: event.target.checked },
                  });
                }}
              />
              <span>
                <strong>{label}</strong>
                <small>{description}</small>
              </span>
            </label>
          ))}
        </fieldset>
      </section>
      <div className="td-settings-aside">
        <FeedbackInbox code={view.code} inbox={feedback} />
        <section className="td-card">
          <p className="td-kicker">Ta vare på arbeidet</p>
          <h2>Saga og sikkerhetskopi</h2>
          <p>
            Last ned fagbidrag og vurderinger til etterarbeidet. En
            sikkerhetskopi lar deg gjenopprette hele spillet.
          </p>
          <div className="td-stacked-actions">
            <Button secondary onClick={onBackup}>
              Sikkerhetskopier hele spillet
            </Button>
            <Download
              filename={`vikingspill-${view.code}-etterarbeid.csv`}
              value={learningCsv(groups)}
            >
              Eksporter etterarbeid
            </Download>
          </div>
          <p className="td-caption">
            Lærertilgangen følger denne nettleseren. Ta en sikkerhetskopi før du
            nullstiller enheten eller flytter til en annen.
          </p>
        </section>
        <Afterwork closed={view.closed} busy={busy} send={send} />
      </div>
    </div>
  );
}

export function EventsPanel({
  view,
  groups,
  busy,
  send,
}: {
  view: PublicView;
  groups: Record<string, GroupView>;
  busy: boolean;
  send: Send;
}) {
  const disabled = busy || view.closed || !Object.keys(groups).length;
  const open = Object.values(view.challenges).filter(
    (c) => c.status === "open",
  );
  return (
    <>
      <div className="td-section-heading">
        <div>
          <p className="td-kicker">Samle klassen om reisen</p>
          <h2>Skjebne og felles utfordringer</h2>
        </div>
      </div>
      <div className="td-event-grid">
        <section className="td-card">
          <p className="td-event-number">I</p>
          <h3>Skjebnehjulet</h3>
          <p>
            La en hendelse sette nye vilkår for reisen, og gi mannskapene noe å
            snakke om.
          </p>
          <Button
            disabled={disabled}
            onClick={() => {
              void send({
                type: "event",
                kind: "fate",
                title: "Skjebnehjulet",
                message: "",
              });
            }}
          >
            Trekk skjebne
          </Button>
        </section>
        <section className="td-card">
          <p className="td-event-number">II</p>
          <h3>Gudenes prøve</h3>
          <p>
            Avtal en felles aktivitet i klassen. Du bekrefter hvilket skip som
            vant.
          </p>
          <Button
            secondary
            disabled={disabled}
            onClick={() => {
              void send({
                type: "event",
                kind: "trial",
                title: "Gudenes prøve",
                message: "",
              });
            }}
          >
            Åpne Gudenes prøve
          </Button>
        </section>
        <section className="td-card td-event-danger">
          <p className="td-event-number">III</p>
          <h3>Ragnarok</h3>
          <p>
            Halvparten av den positive handelsgevinsten går tapt.
            Kompetansebevisene beholdes.
          </p>
          <Button
            secondary
            disabled={disabled}
            onClick={() => {
              void send({
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
        </section>
      </div>
      <section className="td-card">
        <h2>Åpne utfordringer</h2>
        {open.length ? (
          open.map((c) => (
            <div className="td-review-section" key={c.id}>
              <h3>{c.title}</h3>
              <p className="td-caption">
                Bekreft vinner etter den avtalte aktiviteten.
              </p>
              <div className="cg-actions">
                {c.groups.map((id) => (
                  <Button
                    key={id}
                    disabled={busy || view.closed}
                    onClick={() => {
                      void send({
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
          ))
        ) : (
          <p className="td-caption">Ingen åpne utfordringer akkurat nå.</p>
        )}
      </section>
    </>
  );
}

function Afterwork({
  closed,
  busy,
  send,
}: {
  closed: boolean;
  busy: boolean;
  send: Send;
}) {
  return (
    <section className="td-card">
      <p className="td-kicker">Avrund undervisningen</p>
      <h2>Etterarbeid i klassen</h2>
      <ol className="td-afterwork">
        <li>
          La hvert skip vise et valg, en konkret kilde og den andre partens
          perspektiv.
        </li>
        <li>
          Sammenlign to skip med samme valg og ulik terning. Hva forklarer
          forskjellen?
        </li>
        <li>
          Snakk om hva spillet forenklet, og hvilken innsikt dere tar med
          videre.
        </li>
      </ol>
      <p className="td-caption">
        Vurder kvaliteten i begrunnelsen. Sagaer og fagarbeid kan vurderes også
        etter at økten er avsluttet.
      </p>
      <Button
        secondary
        disabled={busy || closed}
        onClick={() => {
          void send({ type: "close_game" });
        }}
      >
        {closed ? "Økten er avsluttet" : "Avslutt økten og behold sagaene"}
      </Button>
    </section>
  );
}
