import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { parseBackup } from "../domain/backup";
import { content } from "../content";
import { getRemote } from "./remote";
import type { Session } from "./store";
import { loadSession, saveSession } from "./store";
import { Button, Field, Panel, Shell } from "./ui";
import Console from "./teacher/TeacherConsole";

export default function TeacherPage() {
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(() => {
    const s = loadSession();
    return s?.teacher ? s : null;
  });
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const enter = async (code: string) => {
    const remote = await getRemote();
    const result = await remote.call<{ teacher: boolean }>("joinClassroom", {
      code,
      id: crypto.randomUUID(),
    });
    if (!result.teacher)
      throw new Error(
        "Dette spillet tilhører en annen lærer. Bruk nettleseren som opprettet økten, eller importer en sikkerhetskopi som nytt spill.",
      );
    const s: Session = {
      mode: "online",
      code,
      uid: remote.uid,
      groupId: null,
      teacher: true,
    };
    saveSession(s);
    setSession(s);
  };
  const action = async (work: () => Promise<void>) => {
    setBusy(true);
    setError("");
    try {
      await work();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Handlingen feilet.");
    } finally {
      setBusy(false);
    }
  };
  const home = () => {
    saveSession(null);
    setSession(null);
    navigate("/");
  };
  if (session) return <Console session={session} onHome={home} />;
  return (
    <Shell
      className="cg-teacher td-welcome"
      title="Odin · lærerens utsyn"
      subtitle="Opprett en økt, eller gjenoppta et spill du eier."
      action={
        <Button secondary onClick={home}>
          Til forsiden
        </Button>
      }
    >
      {error && (
        <p role="alert" className="cg-note cg-alert">
          {error}
        </p>
      )}
      <div className="td-welcome-art" aria-hidden="true">
        <img src="/ornamenter/odin.png" alt="" />
      </div>
      <div className="cg-grid">
        <Panel title="Nytt klasserom">
          <p>
            Lærertilgangen bindes til innloggingen på denne enheten. Elevene
            trenger bare spillkoden.
          </p>
          <Button
            disabled={busy}
            onClick={() => {
              void action(async () => {
                const remote = await getRemote();
                const id =
                  localStorage.getItem("vikingspill:v2:create-id") ??
                  crypto.randomUUID();
                localStorage.setItem("vikingspill:v2:create-id", id);
                const result = await remote.call<{ code: string }>(
                  "createClassroom",
                  { id },
                );
                await enter(result.code);
                localStorage.removeItem("vikingspill:v2:create-id");
              });
            }}
          >
            Opprett nytt spill
          </Button>
        </Panel>
        <Panel title="Gjenoppta spillet">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void action(() => enter(code));
            }}
          >
            <Field
              label="Spillkode du opprettet"
              value={code}
              onChange={(v) => setCode(v.toUpperCase().replace(/[^A-Z]/g, ""))}
              maxLength={4}
            />
            <Button type="submit" disabled={busy || code.length !== 4}>
              Åpne regipulten
            </Button>
          </form>
        </Panel>
      </div>
      <Panel title="Gjenopprett sikkerhetskopi">
        <p>
          Hele spillet valideres først. Gjenoppretting lager et nytt klasserom
          med en ny kode og deg som eier.
        </p>
        <label className="cg-field">
          Velg sikkerhetskopi
          <input
            type="file"
            accept="application/json,.json"
            disabled={busy}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              void action(async () => {
                const text = await file.text();
                parseBackup(text, content);
                const remote = await getRemote();
                const result = await remote.call<{ code: string }>(
                  "importClassroom",
                  { backup: text, id: crypto.randomUUID() },
                );
                await enter(result.code);
              });
            }}
          />
        </label>
      </Panel>
    </Shell>
  );
}
