export class RuleError extends Error {
  code: "permission" | "conflict" | "invalid";
  constructor(message: string, code: RuleError["code"] = "invalid") {
    super(message);
    this.code = code;
  }
}
export function requireRule(
  ok: unknown,
  message: string,
  code: RuleError["code"] = "invalid",
): asserts ok {
  if (!ok) throw new RuleError(message, code);
}
