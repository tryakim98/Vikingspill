import { build } from "esbuild";
await build({
  entryPoints: ["functions/src/index.ts"],
  bundle: true,
  platform: "node",
  target: "node22",
  format: "esm",
  outfile: "functions/lib/index.js",
  external: ["firebase-admin/*", "firebase-functions/*"],
});
