import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getRemote } from "../remote";
import { saveSession } from "../store";
import { Button, Panel, Shell } from "../ui";
import ClassBoard from "./ClassBoard";
import "./balder.css";

const LAST = "vikingspill:balder:last";
export default function BalderLobby() {
  const nav = useNavigate();
  const [params] = useSearchParams();
  const [code, setCode] = useState(
    (params.get("kode") ?? "")
      .toUpperCase()
      .replace(/[^A-Z]/g, "")
      .slice(0, 4),
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
  if (board && /^[A-Z]{4}$/.test(board)) return <ClassBoard code={board} />;
  return (
    <Shell
      title="Balder"
      subtitle="Seil til tolv havner og utforsk vikingtidens kulturmøter med mannskapet ditt."
      className="bd bd-front"
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
        <Panel title="Jeg er elev">
          <form
            className="bd-join"
            onSubmit={(event) => {
              event.preventDefault();
              if (code.length === 4 && !busy) void enter(code);
            }}
          >
            <label className="cg-field">
              Spillkode fra læreren
              <input
                value={code}
                maxLength={4}
                pattern="[A-Z]{4}"
                autoCapitalize="characters"
                spellCheck={false}
                autoComplete="off"
                enterKeyHint="go"
                required
                placeholder="ABCD"
                onChange={(e) =>
                  setCode(e.target.value.toUpperCase().replace(/[^A-Z]/g, ""))
                }
              />
            </label>
            <Button type="submit" disabled={busy || code.length !== 4}>
              Bli med i Balder
            </Button>
          </form>
        </Panel>
        <Panel title="Jeg er lærer">
          <p>
            Del klassen i små mannskap og vis spillkoden på tavla. Elevene
            seiler selv. Du godkjenner svenneprøvene underveis.
          </p>
          <Button disabled={busy} onClick={() => void enter()}>
            Start Balder for klassen
          </Button>
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
