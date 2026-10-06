import { z } from "zod";
import { content } from "../content";
import {
  applyCommand,
  groupView,
  newGame,
  privateView,
  publicView,
} from "../domain/engine";
import { GameSchema, CommandSchema, Id, Code } from "../domain/model";
import type {
  Command,
  Game,
  GroupView,
  PrivateView,
  PublicView,
} from "../domain/model";
import { validateGame } from "../domain/backup";
import { getRemote } from "./remote";
import type { Remote } from "./remote";

type OmitEach<T, K extends PropertyKey> = T extends unknown
  ? Omit<T, K>
  : never;
export type Intent = OmitEach<Command, "id" | "expectedVersion">;
export const SessionSchema = z.discriminatedUnion("mode", [
  z.object({
    mode: z.literal("solo"),
    uid: Id,
    code: z.literal("SOLO"),
    groupId: Id.nullable(),
    teacher: z.literal(false),
  }),
  z.object({
    mode: z.literal("online"),
    uid: Id,
    code: Code,
    groupId: Id.nullable(),
    teacher: z.boolean(),
  }),
]);
export type Session = z.infer<typeof SessionSchema>;
export const SESSION_KEY = "vikingspill:v2:session";
export function loadSession(): Session | null {
  try {
    const parsed = SessionSchema.safeParse(
      JSON.parse(localStorage.getItem(SESSION_KEY) ?? "null"),
    );
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}
export function saveSession(session: Session | null) {
  if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  else localStorage.removeItem(SESSION_KEY);
}
export function soloSession(): Session {
  let old: Session | null = null;
  try {
    const parsed = SessionSchema.safeParse(
      JSON.parse(localStorage.getItem("vikingspill:v2:solo-session") ?? "null"),
    );
    if (parsed.success) old = parsed.data;
  } catch {
    /* A new explicit solo session can replace an invalid identity. */
  }
  return old?.mode === "solo"
    ? old
    : {
        mode: "solo",
        code: "SOLO",
        uid: `solo-${crypto.randomUUID()}`,
        groupId: null,
        teacher: false,
      };
}
const EMPTY_PRIVATE: PrivateView = {
  vote: null,
  card: null,
  tingVote: null,
  answers: [],
  trialAnswers: [],
};
export type Snapshot = {
  clockOffset: number;
  public: PublicView | null;
  group: GroupView | null;
  private: PrivateView;
  groups: Record<string, GroupView>;
  presence: Record<string, { online: boolean; at: number }>;
  connected: boolean;
  pending: number;
  error: string | null;
  ready: boolean;
};
const Queue = z.object({
  version: z.literal(1),
  commands: z.array(CommandSchema),
});
export class GameStore {
  private state: Snapshot = {
    clockOffset: 0,
    public: null,
    group: null,
    private: EMPTY_PRIVATE,
    groups: {},
    presence: {},
    connected: false,
    pending: 0,
    error: null,
    ready: false,
  };
  private listeners = new Set<() => void>();
  private game: Game | null = null;
  private queue: Command[] = [];
  private remote: Remote | null = null;
  private draining = false;
  private active = false;
  private stops: (() => void)[] = [];
  private generation = 0;
  private blocked = false;
  readonly storageKey: string;
  readonly queueKey: string;
  readonly session: Session;
  constructor(session: Session) {
    this.session = session;
    this.storageKey = `vikingspill:v2:${session.mode}:${session.uid}:${session.code}`;
    this.queueKey = `${this.storageKey}:queue`;
  }
  getSnapshot = () => this.state;
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };
  private emit(patch: Partial<Snapshot>) {
    this.state = { ...this.state, ...patch };
    for (const listener of this.listeners) listener();
  }
  private fail = (error: unknown) =>
    this.emit({
      error: error instanceof Error ? error.message : "Lagringen feilet.",
    });
  private persistQueue() {
    localStorage.setItem(
      this.queueKey,
      JSON.stringify({ version: 1, commands: this.queue }),
    );
    this.emit({ pending: this.queue.length });
  }
  private publishLocal() {
    const game = this.game!;
    const gid = game.members[this.session.uid]?.groupId;
    const group = gid ? game.groups[gid] : undefined;
    this.session.groupId = gid ?? null;
    saveSession(this.session);
    localStorage.setItem(
      "vikingspill:v2:solo-session",
      JSON.stringify(this.session),
    );
    localStorage.setItem(this.storageKey, JSON.stringify(game));
    this.emit({
      public: publicView(game),
      group: group ? groupView(group, content) : null,
      private: privateView(group, this.session.uid),
      connected: true,
      ready: true,
      error: null,
    });
  }
  start = () => {
    this.active = true;
    const generation = ++this.generation;
    try {
      const rawQueue = localStorage.getItem(this.queueKey);
      this.queue = rawQueue ? Queue.parse(JSON.parse(rawQueue)).commands : [];
      this.emit({ pending: this.queue.length });
      if (this.session.mode === "solo") {
        const raw = localStorage.getItem(this.storageKey);
        this.game = raw
          ? validateGame(JSON.parse(raw), content)
          : newGame("SOLO", this.session.uid, Date.now(), "solo");
        if (!this.game.members[this.session.uid])
          this.game = applyCommand(
            this.game,
            {
              type: "join",
              id: crypto.randomUUID(),
              expectedVersion: this.game.version,
            },
            { uid: this.session.uid, now: Date.now(), seed: 0, presence: {} },
            content,
          );
        this.publishLocal();
        void this.drain();
      } else {
        void getRemote()
          .then(async (remote) => {
            if (!this.active || generation !== this.generation) return;
            if (remote.uid !== this.session.uid)
              throw new Error(
                "Innloggingen er endret. Gå tilbake og bli med i spillet på nytt.",
              );
            this.remote = remote;
            const path = `v2/games/${this.session.code}`;
            const keep = <T>(
              key: "public" | "group" | "private",
              value: T | null,
            ) => {
              this.emit({
                [key]: value ?? (key === "private" ? EMPTY_PRIVATE : null),
                ready: true,
              });
            };
            this.stops.push(
              remote.listen<PublicView>(
                `${path}/publicJson`,
                (v) => keep("public", v),
                this.fail,
              ),
            );
            this.stops.push(
              remote.listen<PrivateView>(
                `${path}/private/${remote.uid}`,
                (v) => keep("private", v),
                this.fail,
              ),
            );
            if (this.session.groupId)
              this.stops.push(
                remote.listen<GroupView>(
                  `${path}/groups/${this.session.groupId}`,
                  (v) => keep("group", v),
                  this.fail,
                ),
              );
            if (this.session.teacher)
              this.stops.push(
                remote.listen<Record<string, string>>(
                  `${path}/groups`,
                  (values) => {
                    try {
                      this.emit({
                        groups: Object.fromEntries(
                          Object.entries(values ?? {}).map(([id, v]) => [
                            id,
                            JSON.parse(v),
                          ]),
                        ),
                      });
                    } catch (e) {
                      this.fail(e);
                    }
                  },
                  this.fail,
                  false,
                ),
              );
            this.stops.push(
              remote.listen<
                Record<string, Record<string, { online: boolean; at: number }>>
              >(
                `v2/presence/${this.session.code}`,
                (values) => {
                  this.emit({
                    presence: Object.fromEntries(
                      Object.entries(values ?? {}).map(([uid, connections]) => {
                        const all = Object.values(connections);
                        return [
                          uid,
                          {
                            online: all.some((p) => p.online),
                            at: Math.max(0, ...all.map((p) => p.at)),
                          },
                        ];
                      }),
                    ),
                  });
                },
                this.fail,
                false,
              ),
            );
            this.stops.push(
              remote.listen<number>(
                ".info/serverTimeOffset",
                (value) => this.emit({ clockOffset: value ?? 0 }),
                this.fail,
                false,
              ),
              remote.connected((connected) => {
                this.emit({
                  connected,
                  ...(!this.blocked && connected ? { error: null } : {}),
                });
                if (connected) void this.drain();
              }, this.fail),
            );
            const stopPresence = await remote.presence(
              this.session.code,
              this.fail,
            );
            if (this.active && generation === this.generation)
              this.stops.push(stopPresence);
            else stopPresence();
          })
          .catch(this.fail);
      }
    } catch (e) {
      this.fail(e);
    }
    return () => {
      this.active = false;
      this.generation++;
      for (const stop of this.stops.splice(0)) stop();
    };
  };
  send = async (intent: Intent) => {
    try {
      const groupId =
        intent.groupId ??
        (!this.session.teacher ? this.state.group?.id : undefined);
      const version = groupId
        ? this.state.group?.id === groupId
          ? this.state.group.version
          : this.state.public?.groups[groupId]?.version
        : this.state.public?.version;
      const aggregate =
        this.state.group?.id === groupId
          ? this.state.group
          : groupId
            ? this.state.groups[groupId]
            : undefined;
      const command = CommandSchema.parse({
        ...intent,
        ...(groupId ? { groupId } : {}),
        ...(aggregate?.encounter &&
        !["ready_challenge", "submit_challenge", "challenge"].includes(
          intent.type,
        )
          ? { encounterId: aggregate.encounter.id }
          : {}),
        ...(aggregate?.trial &&
        !["ready_challenge", "submit_challenge", "challenge"].includes(
          intent.type,
        )
          ? { trialId: aggregate.trial.id }
          : {}),
        id: crypto.randomUUID(),
        expectedVersion: version ?? 0,
      });
      if (
        this.queue.some(
          (c) =>
            JSON.stringify({ ...c, id: "", expectedVersion: 0 }) ===
            JSON.stringify({ ...command, id: "", expectedVersion: 0 }),
        )
      )
        return;
      this.queue.push(command);
      this.persistQueue();
      await this.drain();
    } catch (e) {
      this.fail(e);
    }
  };
  retry = () => {
    this.blocked = false;
    this.emit({ error: null });
    void this.drain();
  };
  discard = () => {
    this.blocked = false;
    this.queue.shift();
    this.persistQueue();
    this.emit({ error: null });
    void this.drain();
  };
  private async refreshVersion(command: Command) {
    if (this.game)
      return command.groupId && this.game.groups[command.groupId]
        ? this.game.groups[command.groupId].version
        : this.game.version;
    if (!this.remote) return command.expectedVersion;
    // Before joining a ship, its private group view is correctly unreadable.
    // Versions for joining/creation therefore come from the public summary.
    const value = await this.remote.read<PublicView>(
      `v2/games/${this.session.code}/publicJson`,
    );
    return (
      (command.groupId ? value?.groups[command.groupId]?.version : undefined) ??
      value?.version ??
      command.expectedVersion
    );
  }
  private async drain() {
    if (this.draining || this.state.error || !this.active) return;
    if (
      this.session.mode === "online" &&
      (!this.remote || !this.state.connected)
    )
      return;
    this.draining = true;
    try {
      while (this.queue.length && this.active) {
        const command = this.queue[0];
        let acknowledged = false;
        for (let attempts = 0; attempts < 4; attempts++) {
          try {
            command.expectedVersion = await this.refreshVersion(command);
            this.persistQueue();
            if (this.game) {
              this.game = applyCommand(
                this.game,
                command,
                {
                  uid: this.session.uid,
                  now: Date.now(),
                  seed: crypto.getRandomValues(new Uint32Array(1))[0],
                  presence: { [this.session.uid]: Date.now() },
                },
                content,
              );
              this.publishLocal();
            } else await this.remote!.command(this.session.code, command);
            acknowledged = true;
            break;
          } catch (e) {
            if (
              e &&
              typeof e === "object" &&
              "code" in e &&
              e.code === "functions/aborted" &&
              attempts < 3
            )
              continue;
            throw e;
          }
        }
        if (!acknowledged)
          throw new Error("Flere endringer samtidig. Prøv igjen.");
        this.queue.shift();
        this.persistQueue();
      }
    } catch (e) {
      this.blocked = !(
        e &&
        typeof e === "object" &&
        "code" in e &&
        ["functions/unavailable", "functions/deadline-exceeded"].includes(
          String(e.code),
        )
      );
      this.fail(e);
    } finally {
      this.draining = false;
    }
  }
  exportSolo(): Game {
    if (!this.game) throw new Error("Ingen øvingsøkt.");
    return GameSchema.parse(this.game);
  }
}
