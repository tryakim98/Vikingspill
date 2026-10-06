import { useEffect } from "react";
import MuteButton from "../components/common/MuteButton";
import { playMusic, playMusicForDestination, stopMusic } from "../lib/music";
import type { GroupView } from "../domain/model";
export default function GameAudio({ group }: { group: GroupView | null }) {
  const destination =
    group?.encounter?.phase === "sailing" ? null : group?.encounter?.destId;
  useEffect(() => {
    if (destination) playMusicForDestination(destination);
    else playMusic("sailing");
  }, [destination]);
  useEffect(() => () => stopMusic(), []);
  return <MuteButton />;
}
