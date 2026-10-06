import { applyCommand } from "./engine";
import type { Content, Game } from "./model";

/** Replays captured actor/time/random/presence context against a known starting state. */
export function replayCommands(
  initial: Game,
  log: Game["log"],
  content: Content,
): Game {
  return log.reduce(
    (game, entry) =>
      applyCommand(
        game,
        entry.command,
        {
          uid: entry.actorId,
          now: entry.at,
          seed: entry.seed,
          presence: entry.presence,
        },
        content,
      ),
    structuredClone(initial),
  );
}
