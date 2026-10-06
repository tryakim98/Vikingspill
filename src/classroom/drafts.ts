import { useState } from "react";
function useDraft<T>(
  key: string,
  initial: T,
  accept: (value: unknown) => value is T,
) {
  const storageKey = `vikingspill:draft:${key}`;
  const [value, setValue] = useState<T>(() => {
    try {
      const saved: unknown = JSON.parse(
        localStorage.getItem(storageKey) ?? "null",
      );
      return accept(saved) ? saved : initial;
    } catch {
      return initial;
    }
  });
  const update = (next: T) => {
    setValue(next);
    try {
      localStorage.setItem(storageKey, JSON.stringify(next));
    } catch {
      /* Keep the draft in memory if storage is unavailable. */
    }
  };
  return [value, update] as const;
}
export function useTextDraft(key: string, initial = "") {
  return useDraft(
    key,
    initial,
    (value): value is string =>
      typeof value === "string" && value.length <= 2000,
  );
}
export function useAnswerDraft(key: string) {
  return useDraft<number[]>(
    key,
    [],
    (value): value is number[] =>
      Array.isArray(value) &&
      value.length <= 4 &&
      value.every((n) => Number.isInteger(n) && n >= -1 && n <= 5),
  );
}
