import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getRemote } from "../remote";
import { saveSession } from "../store";
import { Button, Field, Panel, Shell } from "../ui";
import "./balder.css";

const LAST = "vikingspill:balder:last";
export default function BalderLobby() {
  const nav = useNavigate();
  const [params] = useSearchParams();
  const [code, setCode] = useState(
    (params.get("kode") ?? "").toUpperCase().slice(0, 4),
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const last = localStorage.getItem(LAST);
  async function enter(target?: string) {
    setBusy(true);
    setError("");
    try {
      const remote = await getRemote();
      if (!target) {
        const key = "vikingspill:balder:create:" + remote.uid;
        const id = localStorage.getItem(key) ?? crypto.randomUUID();
        localStorage.setItem(key, id);
        const created = await remote.call<{ code: string }>("createClassroom", {
          id,
          settings: { variant: "balder" },
        });
        target = created.code;
        localStorage.setItem(LAST, target);
      }
      const res = await remote.call<{
        teacher: boolean;
        groupId: string | null;
      }>("joinClassroom", { code: target, id: crypto.randomUUID() });
      saveSession({
        mode: "online",
        code: target,
        uid: remote.uid,
        groupId: res.groupId,
        teacher: res.teacher,
      });
      localStorage.setItem(LAST, target);
      localStorage.removeItem("vikingspill:balder:create:" + remote.uid);
      nav(res.teacher ? "/teacher" : "/student");
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Kunne ikke åpne spillet. Prøv på nytt.",
      );
    } finally {
      setBusy(false);
    }
  }
  const board = params.get("tavle");
  if (board && /^[A-Z]{4}$/.test(board))
    return (
      <Shell className="bd" title="Bli med i Balder">
        <Panel title="Klassekoden">
          <strong className="bd-code">{board}</strong>
          <p>
            Åpne <b>{location.host}/balder</b> på mobil eller PC og tast koden.
          </p>
          <p>
            Én i gruppa oppretter et skip. Resten velger samme skipsnavn. Seil
            til Hedeby når mannskapet er samlet.
          </p>
        </Panel>
      </Shell>
    );
  return (
    <Shell
      title="Balder"
      subtitle="Utforsk vikingtidens kulturmøter sammen."
      className="bd"
      action={
        <Button secondary onClick={() => nav("/")}>
          Hovedmeny
        </Button>
      }
    >
      {error && (
        <p role="alert" className="cg-alert">
          {error}
        </p>
      )}
      <div className="bd-lobby">
        <Panel title="Jeg er lærer">
          <p>
            Del klassen i små mannskap. Vis spillkoden. Elevene velger havn,
            skriver sammen og får quizen rettet med én gang.
          </p>
          <p>
            Underveis leser du korte innleveringer fra praktiske svenneprøver.
            Ett trykk åpner flere havner for gruppa.
          </p>
          <Button disabled={busy} onClick={() => void enter()}>
            Start Balder for klassen
          </Button>
        </Panel>
        <Panel title="Jeg er elev">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void enter(code);
            }}
          >
            <Field
              label="Spillkode fra læreren"
              value={code}
              maxLength={4}
              onChange={(v) => setCode(v.toUpperCase().replace(/[^A-Z]/g, ""))}
            />
            <Button type="submit" disabled={busy || code.length !== 4}>
              Bli med i Balder
            </Button>
          </form>
        </Panel>
      </div>
      {last && (
        <Button secondary disabled={busy} onClick={() => void enter(last)}>
          Gjenoppta {last}
        </Button>
      )}
    </Shell>
  );
}
