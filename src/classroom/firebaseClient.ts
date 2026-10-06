import { initializeApp } from "firebase/app";
import {
  browserLocalPersistence,
  connectAuthEmulator,
  getAuth,
  setPersistence,
  signInAnonymously,
} from "firebase/auth";
import {
  connectDatabaseEmulator,
  get,
  getDatabase,
  onDisconnect,
  onValue,
  ref,
  serverTimestamp,
  set,
} from "firebase/database";
import {
  connectFunctionsEmulator,
  getFunctions,
  httpsCallable,
} from "firebase/functions";
import type { Command } from "../domain/model";

let pending: Promise<Remote> | undefined;
export type Remote = Awaited<ReturnType<typeof connect>>;
async function connect() {
  const emulator = import.meta.env.VITE_FIREBASE_EMULATORS === "true";
  const host = import.meta.env.VITE_EMULATOR_HOST || "127.0.0.1";
  const projectId = emulator
    ? "demo-vikingspill"
    : import.meta.env.VITE_FIREBASE_PROJECT_ID;
  if (!emulator && (!projectId || !import.meta.env.VITE_FIREBASE_API_KEY))
    throw new Error(
      "Flerspiller er ikke konfigurert i denne utgaven. Du kan spille alene.",
    );
  const app = initializeApp(
    {
      projectId,
      apiKey: emulator ? "demo-key" : import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
      databaseURL: emulator
        ? `http://${host}:9000?ns=demo-vikingspill-default-rtdb`
        : import.meta.env.VITE_FIREBASE_DATABASE_URL,
      appId: import.meta.env.VITE_FIREBASE_APP_ID,
    },
    "classroom-v2",
  );
  const auth = getAuth(app);
  const db = getDatabase(app);
  const functions = getFunctions(app, "europe-west1");
  if (emulator) {
    connectAuthEmulator(auth, `http://${host}:9099`, { disableWarnings: true });
    connectDatabaseEmulator(db, host, 9000);
    connectFunctionsEmulator(functions, host, 5001);
  }
  await setPersistence(auth, browserLocalPersistence);
  await auth.authStateReady();
  if (!auth.currentUser) await signInAnonymously(auth);
  const uid = auth.currentUser!.uid;
  async function call<T>(name: string, data: unknown): Promise<T> {
    return (await httpsCallable<unknown, T>(functions, name)(data)).data;
  }
  function listen<T>(
    path: string,
    receive: (v: T | null) => void,
    fail: (error: Error) => void,
    json = true,
  ) {
    return onValue(
      ref(db, path),
      (snap) => {
        try {
          receive(
            snap.exists()
              ? json
                ? (JSON.parse(snap.val()) as T)
                : (snap.val() as T)
              : null,
          );
        } catch {
          fail(new Error("Konvertering av spilldata feilet."));
        }
      },
      fail,
    );
  }
  async function read<T>(path: string): Promise<T | null> {
    const snap = await get(ref(db, path));
    return snap.exists() ? (JSON.parse(snap.val()) as T) : null;
  }
  async function presence(code: string, failed: (error: Error) => void) {
    const connection = ref(
      db,
      `v2/presence/${code}/${uid}/${crypto.randomUUID()}`,
    );
    let timer: ReturnType<typeof setInterval> | undefined;
    let active = true;
    let generation = 0;
    const stop = onValue(ref(db, ".info/connected"), async (snap) => {
      const current = ++generation;
      if (timer) clearInterval(timer);
      if (!active || !snap.val()) return;
      try {
        await onDisconnect(connection).set({
          online: false,
          at: serverTimestamp(),
        });
        if (!active || current !== generation) return;
        await set(connection, { online: true, at: serverTimestamp() });
        if (!active || current !== generation) {
          await set(connection, { online: false, at: serverTimestamp() });
          return;
        }
        timer = setInterval(() => {
          void set(connection, { online: true, at: serverTimestamp() }).catch(
            failed,
          );
        }, 20000);
      } catch (e) {
        failed(
          e instanceof Error
            ? e
            : new Error("Tilstedeværelse kunne ikke registreres."),
        );
      }
    });
    return () => {
      active = false;
      generation++;
      stop();
      if (timer) clearInterval(timer);
      void set(connection, { online: false, at: serverTimestamp() }).catch(
        failed,
      );
    };
  }
  return {
    uid,
    call,
    listen,
    read,
    presence,
    command: (code: string, command: Command) =>
      call<{ version: number }>("gameCommand", { code, command }),
    connected: (
      receive: (connected: boolean) => void,
      fail: (e: Error) => void,
    ) =>
      onValue(
        ref(db, ".info/connected"),
        (snap) => receive(!!snap.val()),
        fail,
      ),
  };
}
export async function getRemote(): Promise<Remote> {
  pending ??= connect().catch((error) => {
    pending = undefined;
    throw error;
  });
  return pending;
}
