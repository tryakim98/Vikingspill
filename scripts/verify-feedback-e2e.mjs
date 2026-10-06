/**
 * Feedback verification uses the same isolated demo emulators and real UI flow as
 * classroom CI. Never probe or write the production database from this script.
 * Includes quick signals, optional writing, context, durable offline retry,
 * teacher-only reads, deduplication, exports, solo and closed-session feedback.
 */
import { spawnSync } from "node:child_process";
for (const script of ["build:functions", "test:integration"]) {
  const result = spawnSync("npm", ["run", script], { stdio: "inherit" });
  if (result.status !== 0) process.exit(result.status ?? 1);
}
