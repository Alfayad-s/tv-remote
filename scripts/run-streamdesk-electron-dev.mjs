#!/usr/bin/env node
import { build } from "esbuild";
import { copyFileSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const desk = join(root, "apps/streamdesk-desk");
const outDir = join(desk, "electron-dist");

rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });

await build({
  entryPoints: [join(desk, "electron/main.ts")],
  bundle: true,
  platform: "node",
  format: "cjs",
  target: "node22",
  outfile: join(outDir, "main.cjs"),
  external: ["electron"],
  packages: "bundle",
  banner: {
    js: "var __streamdeskImportMetaUrl=require('url').pathToFileURL(__filename).href;",
  },
  define: {
    "import.meta.url": "__streamdeskImportMetaUrl",
  },
});
copyFileSync(join(desk, "src/desk.html"), join(outDir, "desk.html"));

const electronBin = [
  join(desk, "node_modules/.bin/electron"),
  join(root, "node_modules/.bin/electron"),
].find((path) => existsSync(path));

if (!electronBin) {
  throw new Error("electron binary not found — run npm install");
}

const child = spawn(electronBin, [join(outDir, "main.cjs")], {
  cwd: desk,
  stdio: "inherit",
  env: { ...process.env },
});
child.on("exit", (code) => process.exit(code ?? 0));
