#!/usr/bin/env node
import { build } from "esbuild";
import { copyFileSync, existsSync, mkdirSync, readdirSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const desk = join(root, "apps/streamdesk-desk");
const outDir = join(desk, "electron-dist");
const releaseDir = join(desk, "release");
const downloads = join(root, "apps/web/public/downloads");
const zipOut = join(downloads, "StreamDesk-mac.zip");
const dmgOut = join(downloads, "StreamDesk.dmg");

rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });
mkdirSync(downloads, { recursive: true });

console.log("Bundling StreamDesk Electron main…");
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

function run(command, args, cwd) {
  const result = spawnSync(command, args, {
    cwd,
    stdio: "inherit",
    shell: false,
    env: { ...process.env },
  });
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(" ")} failed`);
  }
}

console.log("Packaging unsigned StreamDesk.app (dmg + zip)…");
rmSync(releaseDir, { recursive: true, force: true });
run(
  "npx",
  [
    "electron-builder",
    "--mac",
    "dmg",
    "zip",
    "--arm64",
    "--config",
    join(desk, "electron-builder.yml"),
  ],
  desk,
);

if (!existsSync(releaseDir)) {
  throw new Error(`electron-builder released nothing at ${releaseDir}`);
}

const artifacts = readdirSync(releaseDir);
const zipArtifact = artifacts.find((name) => name.endsWith(".zip"));
const dmgArtifact = artifacts.find((name) => name.endsWith(".dmg"));

if (!zipArtifact && !dmgArtifact) {
  throw new Error(`No mac artifacts in ${releaseDir}: ${artifacts.join(", ")}`);
}

if (zipArtifact) {
  copyFileSync(join(releaseDir, zipArtifact), zipOut);
  console.log(`Wrote ${zipOut}`);
}
if (dmgArtifact) {
  copyFileSync(join(releaseDir, dmgArtifact), dmgOut);
  console.log(`Wrote ${dmgOut}`);
}

console.log("StreamDesk Mac Electron package ready.");
