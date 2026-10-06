import type { RollOdds } from "../types";
import type { Roll } from "./model";
import { rollToTier, TIER_ORDER, type Tier } from "../lib/oddsEngine";

const effective = (raw: number, penalty: number) =>
  Math.max(1, Math.min(6, raw + penalty));
export function resolveRoll(
  odds: RollOdds,
  advantage: boolean,
  penalty: number,
  random: () => number,
): Roll {
  const dice = Array.from(
    { length: advantage ? 2 : 1 },
    () => 1 + Math.floor(random() * 6),
  );
  const raw = Math.max(...dice);
  return {
    dice,
    raw,
    effective: effective(raw, penalty),
    advantage,
    penalty,
    tier: rollToTier(odds, effective(raw, penalty)),
  } as Roll;
}
/** Enumerate the exact 6/36 possibilities; display and settlement use the same rule. */
export function effectiveOdds(
  odds: RollOdds,
  advantage: boolean,
  penalty = 0,
): Record<Tier, number> {
  const counts = Object.fromEntries(TIER_ORDER.map((t) => [t, 0])) as Record<
    Tier,
    number
  >;
  for (let a = 1; a <= 6; a++) {
    for (let b = 1; b <= (advantage ? 6 : 1); b++)
      counts[
        rollToTier(odds, effective(advantage ? Math.max(a, b) : a, penalty))
      ]++;
  }
  return Object.fromEntries(
    TIER_ORDER.map((t) => [t, (counts[t] * 100) / (advantage ? 36 : 6)]),
  ) as Record<Tier, number>;
}
