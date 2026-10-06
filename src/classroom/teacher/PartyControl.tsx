import { useState } from "react";
import type { Challenge, PublicView } from "../../domain/model";
import {
  PARTY_GAMES,
  partyMembers,
  partyScores,
  partyWinners,
} from "../../domain/party";
import { useNow } from "../../hooks/useNow";
import { PartyResults } from "../Holmgang";
import type { Intent } from "../store";
import { Button, Field } from "../ui";
export default function PartyControl({
  challenge: c,
  view,
  busy,
  send,
}: {
  challenge: Challenge;
  view: PublicView;
  busy: boolean;
  send: (intent: Intent) => Promise<void>;
}) {
  const [memberId, setMemberId] = useState("");
  const [reason, setReason] = useState("");
  const now = useNow(true, 250);
  const activity = PARTY_GAMES[c.activity];
  const members = c.groups.flatMap((g) => partyMembers(c, g));
  const legacy = !Object.keys(c.roster).length;
  const ready =
    members.length > 0 && members.every((uid) => c.ready.includes(uid));
  const complete =
    legacy ||
    (c.endsAt !== null &&
      now >= c.endsAt &&
      partyScores(c).every((s) => s.complete));
  const winners = activity.digital && !legacy ? partyWinners(c) : c.groups;
  return (
    <div className="td-review-section">
      <h3>
        {c.title} · {activity.title}
      </h3>
      <p>{activity.instructions}</p>
      {!legacy && (
        <>
          <p className="td-caption">
            {members.filter((uid) => c.ready.includes(uid)).length}/
            {members.length} klare.{" "}
            {c.startsAt === null
              ? "Fem sekunder felles nedtelling før start."
              : now < c.startsAt
                ? "Nedtellingen pågår."
                : now < c.endsAt!
                  ? `${Math.ceil((c.endsAt! - now) / 1000)} sekunder igjen.`
                  : "Leken er ferdig; vent på resultater fra alle."}
          </p>
          <PartyResults challenge={c} view={view} />
          {c.phase === "waiting" && (
            <>
              {c.kind === "trial" && (
                <Button
                  disabled={busy || !ready}
                  onClick={() => {
                    void send({ type: "start_challenge", challengeId: c.id });
                  }}
                >
                  Start felles nedtelling
                </Button>
              )}
              <details className="cg-help">
                <summary>Et medlem er fraværende</summary>
                <p>
                  Avklar dette før start. Alle som deltar, teller med i lagets
                  snitt.
                </p>
                <label className="cg-field">
                  Medlem
                  <select
                    aria-label="Fraværende i lagleken"
                    value={memberId}
                    onChange={(e) => setMemberId(e.target.value)}
                  >
                    <option value="">Velg medlem</option>
                    {c.groups.flatMap((g) =>
                      partyMembers(c, g).map((uid) => (
                        <option key={uid} value={uid}>
                          {view.groups[g]?.shipName} ·{" "}
                          {view.groups[g]?.members[uid]?.label}
                        </option>
                      )),
                    )}
                  </select>
                </label>
                <Field
                  label="Begrunnelse for fritak fra lagleken"
                  value={reason}
                  onChange={setReason}
                />
                <Button
                  secondary
                  disabled={busy || !memberId || reason.trim().length < 10}
                  onClick={() => {
                    void send({
                      type: "excuse_challenge",
                      challengeId: c.id,
                      memberId,
                      reason,
                    });
                  }}
                >
                  Frita før start
                </Button>
              </details>
            </>
          )}
        </>
      )}
      <div className="cg-actions">
        {complete &&
          winners
            .map((id) => (
              <Button
                key={id}
                disabled={busy}
                onClick={() => {
                  void send({
                    type: "resolve_challenge",
                    challengeId: c.id,
                    winnerId: id,
                  });
                }}
              >
                {activity.digital && !legacy
                  ? `Bekreft resultat · ${winners.map((g) => view.groups[g]?.shipName).join(" og ")}`
                  : `${view.groups[id]?.shipName} vant`}
              </Button>
            ))
            .slice(0, activity.digital && !legacy ? 1 : winners.length)}
        <Button
          secondary
          disabled={busy}
          onClick={() => {
            void send({ type: "cancel_challenge", challengeId: c.id });
          }}
        >
          Avlys lagleken
        </Button>
      </div>
    </div>
  );
}
