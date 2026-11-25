import type { FeedbackInboxState } from "./useFeedbackInbox";
import { useState } from "react";
import { content } from "../../content";
import {
  FEEDBACK_CATEGORIES,
  FEEDBACK_SCREENS,
  FEEDBACK_SIGNALS,
  feedbackLabel,
} from "../../domain/feedback";
import { Button, Download } from "../ui";
import { feedbackCsv } from "../files";

export default function FeedbackInbox({
  code,
  inbox,
}: {
  code: string;
  inbox: FeedbackInboxState;
}) {
  const [filter, setFilter] = useState("all");
  const posts = inbox.posts.filter(
    (p) => filter === "all" || p.category === filter,
  );
  return (
    <section
      className="td-card cg-feedback-inbox"
      id="feedback-inbox"
      tabIndex={-1}
      aria-labelledby="feedback-inbox-title"
    >
      <p className="td-kicker">Lær av spillerne</p>
      <h2 id="feedback-inbox-title">Tilbakemeldinger om spillet</h2>
      <p className="td-caption">
        Dette gjelder spillets brukervennlighet, og inngår ikke i faglig
        vurdering. Navn legges ikke til meldingene. Eksporter dem til den som
        utvikler spillet.
      </p>
      {!inbox.ready && !inbox.error && (
        <p role="status">Henter tilbakemeldinger …</p>
      )}
      {inbox.error && (
        <div role="alert">
          <p>{inbox.error}</p>
          <Button secondary onClick={inbox.retry}>
            Hent tilbakemeldinger igjen
          </Button>
        </div>
      )}
      {inbox.ready && (
        <>
          <dl className="cg-feedback-totals">
            {FEEDBACK_SIGNALS.map((s) => (
              <div key={s.id}>
                <dt>{s.label}</dt>
                <dd>{inbox.posts.filter((p) => p.signal === s.id).length}</dd>
              </div>
            ))}
          </dl>
          <p className="td-caption">
            {inbox.posts.length} meldinger totalt. Hurtigvalgene vises i
            opptellingen; skriftlige forslag finnes i listen.
          </p>
          {inbox.posts.length > 0 ? (
            <>
              <label className="cg-field">
                Vis tilbakemeldinger
                <select
                  aria-label="Vis tilbakemeldinger"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                >
                  <option value="all">Alle</option>
                  {Object.entries(FEEDBACK_CATEGORIES).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <div className="cg-actions">
                <Download
                  filename={`vikingspill-${code}-tilbakemeldinger.csv`}
                  value={feedbackCsv(inbox.posts)}
                >
                  Eksporter tilbakemeldinger
                </Download>
                <Download
                  filename={`vikingspill-${code}-tilbakemeldinger.json`}
                  value={{ version: 3, code, feedback: inbox.posts }}
                >
                  Last ned som JSON
                </Download>
              </div>
              <ul
                className="cg-feedback-list"
                aria-label="Tilbakemeldinger fra spillerne"
              >
                {posts.map((p) => (
                  <li key={p.id}>
                    <strong>{feedbackLabel(p)}</strong>
                    <p className="td-caption">
                      {[
                        content.ports.find((c) => c.port.id === p.destId)?.port
                          .name,
                        FEEDBACK_SCREENS[p.screen] ?? p.screen,
                        new Date(p.receivedAt).toLocaleString("nb-NO"),
                        p.okt && `Økt: ${p.okt}`,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                    {p.comment && (
                      <p className="cg-feedback-comment">{p.comment}</p>
                    )}
                  </li>
                ))}
              </ul>
              {posts.length === 0 && <p>Ingen meldinger i denne kategorien.</p>}
            </>
          ) : (
            <p>
              Ingen tilbakemeldinger ennå. Spillerne finner «Gi tilbakemelding
              om spillet» øverst på sin side, også etter økten.
            </p>
          )}
        </>
      )}
    </section>
  );
}
