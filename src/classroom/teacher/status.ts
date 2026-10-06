import type { GroupView } from "../../domain/model";
import type { Snapshot } from "../store";

export type Presence = Snapshot["presence"];
export const ROLE_LABEL = {
  språk: "Skald / tolk",
  sjømannskap: "Navigatør",
  krigskunst: "Kriger",
  diplomati: "Handelsmann",
  tro: "Seer",
} as const;

export function onlineMembers(
  group: GroupView,
  presence: Presence,
  now: number,
) {
  return Object.keys(group.members).filter(
    (id) => presence[id]?.online && now - presence[id].at < 60000,
  );
}

export function reviewCount(group: GroupView) {
  return (
    Number(
      group.encounter?.approval === "pending" && !group.encounter.settled,
    ) +
    Number(group.trial?.phase === "pending") +
    group.saga.filter((s) => !s.assessment).length
  );
}

export function attention(group: GroupView, presence: Presence, now: number) {
  const items: string[] = [];
  if (group.encounter?.approval === "pending" && !group.encounter.settled)
    items.push("Oppgave venter på godkjenning");
  if (group.trial?.phase === "pending") items.push("Praksisprøve venter");
  const members = Object.keys(group.members);
  const online = onlineMembers(group, presence, now);
  if (members.length && !online.includes(group.chiefId))
    items.push("Høvdingen er frakoblet");
  else if (online.length < members.length)
    items.push(`${members.length - online.length} i mannskapet er frakoblet`);
  const ungraded = group.saga.filter((s) => !s.assessment).length;
  if (ungraded)
    items.push(
      `${ungraded} kulturmøte${ungraded > 1 ? "r" : ""} til vurdering`,
    );
  return items;
}
