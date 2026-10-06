import type { Challenge, GroupView, PublicView } from "../domain/model";
import {
  PARTY_GAMES,
  clickSignal,
  partyMembers,
  partyScores,
} from "../domain/party";
import { useNow } from "../hooks/useNow";
import { useRef } from "react";
import Icon from "../components/decor/Icon";
import type { Intent } from "./store";
import { useTextDraft } from "./drafts";
import { Button, Panel } from "./ui";

export function PartyResults({
  challenge,
  view,
}: {
  challenge: Challenge;
  view: PublicView;
}) {
  const activity = PARTY_GAMES[challenge.activity];
  return (
    <div className="cg-party-results" aria-label="Laglekenes resultater">
      {partyScores(challenge).map((score) => (
        <div key={score.groupId} className="cg-party-score">
          <strong>{view.groups[score.groupId]?.shipName}</strong>
          <b>
            {activity.digital
              ? score.average.toLocaleString("nb-NO", {
                  maximumFractionDigits: 2,
                })
              : `${score.submitted}/${score.count}`}
          </b>
          <small>
            {activity.digital ? "poeng per medlem" : "bekreftet deltakelse"} ·{" "}
            {score.submitted}/{score.count} levert
          </small>
        </div>
      ))}
    </div>
  );
}
export default function Holmgang({
  group,
  view,
  uid,
  busy,
  send,
  clockOffset = 0,
  solo = false,
}: {
  group: GroupView;
  view: PublicView;
  uid: string;
  busy: boolean;
  clockOffset?: number;
  solo?: boolean;
  send: (intent: Intent) => Promise<void>;
}) {
  const challenges = Object.values(view.challenges)
    .filter(
      (c) => c.groups.includes(group.id) && Object.keys(c.roster).length > 0,
    )
    .slice(-3);
  if (!challenges.length) return null;
  return (
    <>
      {challenges.map((c) => (
        <PartyRound
          key={c.id}
          challenge={c}
          group={group}
          view={view}
          uid={uid}
          busy={busy}
          send={send}
          clockOffset={clockOffset}
          solo={solo}
        />
      ))}
    </>
  );
}
function PartyRound({
  challenge: c,
  group,
  view,
  uid,
  busy,
  send,
  clockOffset,
  solo,
}: {
  challenge: Challenge;
  group: GroupView;
  view: PublicView;
  uid: string;
  busy: boolean;
  clockOffset: number;
  solo: boolean;
  send: (intent: Intent) => Promise<void>;
}) {
  const now = useNow(c.status === "open", 100) + clockOffset;
  const activity = PARTY_GAMES[c.activity];
  const members = partyMembers(c, group.id);
  const participating = members.includes(uid);
  const delivered = Object.hasOwn(c.results, uid);
  const ended = c.endsAt !== null && now >= c.endsAt;
  return (
    <Panel
      title={`${c.kind === "trial" ? "Gudenes prøve" : "Holmgang"} · ${activity.title}`}
    >
      <p className="cg-small">
        En laglek · ingen faglig vurdering · {activity.duration} sekunder
      </p>
      <p>{activity.instructions}</p>
      {c.status === "resolved" ? (
        <p role="status" className="cg-note">
          {c.winnerIds.length
            ? `${c.winnerIds.map((id) => view.groups[id]?.shipName).join(" og ")} ${c.winnerIds.length > 1 ? "delte seieren" : "vant"}.`
            : "Lagleken er avsluttet uten vinner."}
        </p>
      ) : (
        <>
          {!participating && (
            <p>
              Du følger leken fra sidelinjen. Nye medlemmer deltar fra neste
              lek.
            </p>
          )}
          {c.phase === "waiting" && (
            <>
              <p>
                {members.filter((id) => c.ready.includes(id)).length}/
                {members.length} på skipet er klare.{" "}
                {solo
                  ? "Nedtellingen starter når du er klar."
                  : c.kind === "duel"
                    ? "En felles nedtelling starter når begge lag er klare."
                    : "Læreren starter når alle lag er klare."}
              </p>
              {participating &&
                (!c.ready.includes(uid) ? (
                  <Button
                    disabled={busy}
                    onClick={() => {
                      void send({ type: "ready_challenge", challengeId: c.id });
                    }}
                  >
                    Jeg er klar
                  </Button>
                ) : (
                  <p role="status">Du er klar. Vent på felles start.</p>
                ))}
            </>
          )}
          {c.startsAt !== null && now < c.startsAt && (
            <p className="cg-party-countdown" role="status">
              Start om {Math.ceil((c.startsAt - now) / 1000)}
            </p>
          )}
          {c.phase === "playing" && participating && c.startsAt !== null && (
            <>
              {activity.digital ? (
                <TapRound
                  key={`${c.id}:${uid}`}
                  challenge={c}
                  uid={uid}
                  now={now}
                  clockOffset={clockOffset}
                  busy={busy}
                  delivered={delivered}
                  send={send}
                />
              ) : (
                <>
                  <p className="cg-party-countdown" role="status">
                    {ended
                      ? "Tiden er ute"
                      : `${Math.ceil((c.endsAt! - Math.max(now, c.startsAt)) / 1000)} sekunder`}
                  </p>
                  {ended && !delivered && (
                    <Button
                      disabled={busy}
                      onClick={() => {
                        void send({
                          type: "submit_challenge",
                          challengeId: c.id,
                          score: 0,
                        });
                      }}
                    >
                      Jeg bidro i leken
                    </Button>
                  )}
                </>
              )}
              {delivered && (
                <p role="status">
                  {solo
                    ? "Ditt bidrag er levert. Du kan avslutte øvingsleken."
                    : "Ditt bidrag er levert. Læreren bekrefter resultatet når alle har levert."}
                </p>
              )}
            </>
          )}
        </>
      )}
      <PartyResults challenge={c} view={view} />
      {solo && c.status === "open" && (
        <div className="cg-actions">
          {delivered && partyScores(c).every((s) => s.complete) && (
            <Button
              disabled={busy}
              onClick={() => {
                void send({
                  type: "resolve_challenge",
                  challengeId: c.id,
                  winnerId: group.id,
                });
              }}
            >
              Avslutt øvingsleken
            </Button>
          )}
          <Button
            secondary
            disabled={busy}
            onClick={() => {
              void send({ type: "cancel_challenge", challengeId: c.id });
            }}
          >
            Avlys øvingsleken
          </Button>
        </div>
      )}
      <p className="cg-small">
        Reisen fortsetter der dere var. Havnebesøk, prøver og fagbidrag
        beholdes.
      </p>
    </Panel>
  );
}
function TapRound({
  challenge: c,
  uid,
  now,
  clockOffset,
  busy,
  delivered,
  send,
}: {
  challenge: Challenge;
  uid: string;
  now: number;
  clockOffset: number;
  busy: boolean;
  delivered: boolean;
  send: (intent: Intent) => Promise<void>;
}) {
  const [saved, save] = useTextDraft(`${c.id}:${uid}:party-score`, "0");
  const score = Math.max(0, Math.min(500, Number(saved) || 0));
  const lastClick = useRef(0);
  const scoreRef = useRef(score);
  const playing = now >= c.startsAt! && now < c.endsAt! && !delivered;
  const signal =
    c.activity === "tapping" || clickSignal(c.seed, now - c.startsAt!);
  const ended = now >= c.endsAt!;
  return (
    <div className="cg-tap-round">
      <div className="cg-tap-meta">
        <b>{score}</b>
        <span>
          {ended
            ? "Tiden er ute"
            : `${Math.ceil((c.endsAt! - Math.max(now, c.startsAt!)) / 1000)} sekunder`}
        </span>
      </div>
      <button
        type="button"
        className={`cg-tap-target ${signal ? "cg-tap-go" : "cg-tap-wait"}`}
        disabled={!playing}
        aria-label={
          c.activity === "tapping" ? "Trykk på Tors tromme" : "Trykk på ravnen"
        }
        onClick={() => {
          const at = Date.now() + clockOffset;
          if (
            at < c.startsAt! ||
            at >= c.endsAt! ||
            at - lastClick.current < 40
          )
            return;
          lastClick.current = at;
          const good =
            c.activity === "tapping" || clickSignal(c.seed, at - c.startsAt!);
          scoreRef.current = Math.max(
            0,
            Math.min(500, scoreRef.current + (good ? 1 : -2)),
          );
          save(String(scoreRef.current));
        }}
      >
        <Icon name={c.activity === "tapping" ? "bolt" : "raven"} size={70} />
        <span>
          {!playing
            ? ended
              ? "FERDIG"
              : "VENT PÅ START"
            : signal
              ? "KLIKK"
              : "VENT"}
        </span>
      </button>
      {ended && !delivered && (
        <Button
          disabled={busy}
          onClick={() => {
            void send({ type: "submit_challenge", challengeId: c.id, score });
          }}
        >
          Lever mine {score} poeng
        </Button>
      )}
    </div>
  );
}
