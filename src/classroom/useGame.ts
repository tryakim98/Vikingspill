import { useEffect, useMemo, useSyncExternalStore } from "react";
import { GameStore } from "./store";
import type { Session } from "./store";
export function useGame(session: Session) {
  const { mode, uid, code, groupId, teacher } = session;
  const store = useMemo(
    () => new GameStore({ mode, uid, code, groupId, teacher } as Session),
    [mode, uid, code, groupId, teacher],
  );
  useEffect(() => store.start(), [store]);
  return {
    store,
    state: useSyncExternalStore(store.subscribe, store.getSnapshot),
  };
}
