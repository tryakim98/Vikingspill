import { useState } from "react";
import { GOODS } from "../domain/model";
import type { GroupView, PublicView } from "../domain/model";
import type { TradeGoodId } from "../types";
import { TRADE_GOODS } from "../data/tradeGoods";
import type { Intent } from "./store";
import { Button, Panel } from "./ui";
export default function TradePanel({
  group,
  publicView,
  chief,
  busy,
  send,
}: {
  group: GroupView;
  publicView: PublicView;
  chief: boolean;
  busy: boolean;
  send: (intent: Intent) => Promise<void>;
}) {
  const [to, setTo] = useState("");
  const [offer, setOffer] = useState<TradeGoodId>("solv");
  const [request, setRequest] = useState<TradeGoodId>("pelsverk");
  const [amount, setAmount] = useState(1);
  const [requestedAmount, setRequestedAmount] = useState(1);
  const others = Object.values(publicView.groups).filter(
    (g) => g.id !== group.id,
  );
  return (
    <Panel title="Last og byttehandel">
      <p>
        {Object.entries(group.goods)
          .filter(([, n]) => n! > 0)
          .map(([id, n]) => `${TRADE_GOODS[id as TradeGoodId].name}: ${n}`)
          .join(" · ") || "Skipet har ingen handelsvarer ennå."}
      </p>
      {chief && others.length > 0 && (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void send({
              type: "offer_trade",
              to,
              offer: { [offer]: amount },
              request: { [request]: requestedAmount },
            });
          }}
        >
          <div className="cg-grid">
            <label className="cg-field">
              Til skip
              <select
                value={to}
                onChange={(event) => setTo(event.target.value)}
                required
              >
                <option value="">Velg skip</option>
                {others.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.shipName}
                  </option>
                ))}
              </select>
            </label>
            <label className="cg-field">
              Vi gir
              <select
                value={offer}
                onChange={(event) =>
                  setOffer(event.target.value as TradeGoodId)
                }
              >
                {GOODS.map((k) => (
                  <option key={k} value={k}>
                    {TRADE_GOODS[k].name} ({group.goods[k] ?? 0})
                  </option>
                ))}
              </select>
            </label>
            <label className="cg-field">
              Antall vi gir
              <input
                type="number"
                min={1}
                max={100}
                value={amount}
                onChange={(event) => setAmount(Number(event.target.value))}
              />
            </label>
            <label className="cg-field">
              Vi ønsker
              <select
                value={request}
                onChange={(event) =>
                  setRequest(event.target.value as TradeGoodId)
                }
              >
                {GOODS.map((k) => (
                  <option key={k} value={k}>
                    {TRADE_GOODS[k].name}
                  </option>
                ))}
              </select>
            </label>
            <label className="cg-field">
              Antall vi ønsker
              <input
                type="number"
                min={1}
                max={100}
                value={requestedAmount}
                onChange={(event) =>
                  setRequestedAmount(Number(event.target.value))
                }
              />
            </label>
          </div>
          <Button
            type="submit"
            disabled={busy || !to || (group.goods[offer] ?? 0) < amount}
          >
            Foreslå byttehandel
          </Button>
        </form>
      )}
      {Object.values(publicView.trades)
        .filter((t) => t.from === group.id || t.to === group.id)
        .map((t) => (
          <div className="cg-note" key={t.id}>
            <p>
              {publicView.groups[t.from]?.shipName} →{" "}
              {publicView.groups[t.to]?.shipName}:{" "}
              {Object.entries(t.offer)
                .map(([id, n]) => `${n} ${TRADE_GOODS[id as TradeGoodId].name}`)
                .join(", ")}{" "}
              mot{" "}
              {Object.entries(t.request)
                .map(([id, n]) => `${n} ${TRADE_GOODS[id as TradeGoodId].name}`)
                .join(", ")}{" "}
              ·{" "}
              {t.status === "pending"
                ? "venter"
                : t.status === "accepted"
                  ? "gjennomført"
                  : "avslått"}
            </p>
            {chief && t.status === "pending" && (
              <div className="cg-actions">
                {t.to === group.id && (
                  <Button
                    disabled={busy}
                    onClick={() => {
                      void send({ type: "accept_trade", tradeId: t.id });
                    }}
                  >
                    Godta avtalen
                  </Button>
                )}
                <Button
                  secondary
                  disabled={busy}
                  onClick={() => {
                    void send({ type: "reject_trade", tradeId: t.id });
                  }}
                >
                  Avslå / trekk tilbake
                </Button>
              </div>
            )}
          </div>
        ))}
      {chief && others.length > 0 && (
        <div className="cg-actions">
          <Button
            secondary
            disabled={busy || !to}
            onClick={() => {
              void send({
                type: "challenge",
                to,
                title: "Holmgang på bølgene",
              });
            }}
          >
            Utfordre valgt skip til holmgang
          </Button>
          <p className="cg-small">
            Avtal en aktivitet med læreren, som bekrefter vinneren.
          </p>
        </div>
      )}
    </Panel>
  );
}
