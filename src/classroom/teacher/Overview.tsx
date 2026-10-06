import type { GroupView } from "../../domain/model";
import SeaMap from "../../components/teacher/SeaMap";
import VikingShip from "../../components/ship/VikingShip";
import { groupStatus } from "../../lib/groupStatus";
import { Button } from "../ui";
import { attention, onlineMembers, type Presence } from "./status";

export default function Overview({
  groups,
  presence,
  now,
  onReview,
}: {
  groups: Record<string, GroupView>;
  presence: Presence;
  now: number;
  onReview: (id: string) => void;
}) {
  const fleet = Object.values(groups);
  const waiting = fleet.flatMap((group) => {
    const reasons = attention(group, presence, now);
    return reasons.length ? [{ group, reasons }] : [];
  });
  return (
    <>
      <div className="td-overview-layout">
        <section className="td-card td-chart" aria-labelledby="fleet-map-title">
          <div className="td-section-heading">
            <div>
              <p className="td-kicker">Reisen akkurat nå</p>
              <h2 id="fleet-map-title">Flåten på sjøkartet</h2>
            </div>
            <span className="td-badge">{fleet.length} skip</span>
          </div>
          <SeaMap groups={groups} />
          <p className="td-caption">
            Stilisert sjøkart. Skipene viser hvor gruppene arbeider, med status
            i oversikten under.
          </p>
        </section>
        <section
          className="td-card td-attention"
          aria-labelledby="attention-title"
        >
          <div className="td-section-heading">
            <div>
              <p className="td-kicker">Din neste handling</p>
              <h2 id="attention-title">Trenger et blikk</h2>
            </div>
            <span
              className={`td-badge ${waiting.length ? "td-badge-wait" : "td-badge-good"}`}
            >
              {waiting.length}
            </span>
          </div>
          {waiting.length ? (
            <ul className="td-attention-list">
              {waiting.map(({ group, reasons }) => (
                <li key={group.id}>
                  <button
                    type="button"
                    className="td-attention-link"
                    aria-label={`Se ${group.shipName}`}
                    onClick={() => onReview(group.id)}
                  >
                    <span>
                      <strong>{group.shipName}</strong>
                      {reasons.map((reason) => (
                        <small key={reason}>{reason}</small>
                      ))}
                    </span>
                    <span aria-hidden="true">→</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="td-empty">
              <span className="td-empty-mark" aria-hidden="true">
                ✓
              </span>
              <h3>
                {fleet.length ? "Flåten er i gang" : "Mannskapet mønstrer på"}
              </h3>
              <p>
                {fleet.length
                  ? "Ingen oppgaver venter på deg akkurat nå. Følg reisen på kartet."
                  : "Vis spillkoden. Elevene velger flerspiller og oppretter sine skip."}
              </p>
            </div>
          )}
        </section>
      </div>
      <div className="td-section-heading td-fleet-heading">
        <div>
          <p className="td-kicker">Alle grupper</p>
          <h2>Mannskap og fremdrift</h2>
        </div>
        <p className="td-caption">Velg et skip for oppgaver og vurdering.</p>
      </div>
      <div className="td-fleet-grid">
        {fleet.map((group) => {
          const online = onlineMembers(group, presence, now).length;
          const count = Object.keys(group.members).length;
          const e = group.encounter;
          const required = e?.eligible.filter((id) => !e.excused[id]) ?? [];
          const submitted = required.filter((id) => e?.evidence[id]).length;
          const reviewed = group.saga.filter((s) => s.assessment).length;
          return (
            <article className="td-card td-ship-card" key={group.id}>
              <div className="td-ship-heading">
                <VikingShip
                  color={group.shipColor}
                  symbol={group.shipSymbol}
                  size={60}
                />
                <div>
                  <h3>{group.shipName}</h3>
                  <p>{groupStatus(group).text}</p>
                </div>
              </div>
              <p className="td-connection">
                <span
                  className={`td-dot ${count && online === count ? "td-dot-good" : "td-dot-wait"}`}
                />
                {online} av {count} i mannskapet tilkoblet
              </p>
              {e && (
                <div className="td-contributions">
                  <div>
                    <span>Fagbidrag i runden</span>
                    <strong>
                      {submitted} / {required.length}
                    </strong>
                  </div>
                  <progress
                    max={Math.max(1, required.length)}
                    value={submitted}
                    aria-label={`Fagbidrag fra ${group.shipName}`}
                  />
                  {e.phase === "council" && (
                    <p>
                      {e.votedCount} av {required.length} stemmer levert
                    </p>
                  )}
                </div>
              )}
              <dl className="td-ship-stats">
                <div>
                  <dt>Handel</dt>
                  <dd>{group.scores.tradeGain}</dd>
                </div>
                <div>
                  <dt>Rykte</dt>
                  <dd>{group.scores.reputation}</dd>
                </div>
                <div>
                  <dt>Møter vurdert</dt>
                  <dd>
                    {reviewed}
                    <small> / {group.saga.length}</small>
                  </dd>
                </div>
              </dl>
              <Button secondary onClick={() => onReview(group.id)}>
                Åpne {group.shipName}
              </Button>
            </article>
          );
        })}
      </div>
    </>
  );
}
