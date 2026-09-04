import { build } from "esbuild";
import {
  chmodSync,
  copyFileSync,
  existsSync,
  mkdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "apps/web/public/downloads");
const stage = join(root, ".streamdesk-mac-stage");
const zipPath = join(outDir, "StreamDesk-mac.zip");

mkdirSync(outDir, { recursive: true });
rmSync(stage, { recursive: true, force: true });
mkdirSync(stage, { recursive: true });

await build({
  entryPoints: [join(root, "apps/streamdesk-desk/src/index.ts")],
  bundle: true,
  platform: "node",
  format: "esm",
  target: "node22",
  outfile: join(stage, "desk.mjs"),
  banner: {
    js: "import { createRequire as __streamdeskCreateRequire } from 'module'; const require = __streamdeskCreateRequire(import.meta.url);",
  },
  packages: "bundle",
});

copyFileSync(join(root, "apps/streamdesk-desk/src/desk.html"), join(stage, "desk.html"));
copyFileSync(join(root, "scripts/streamdesk-mac-launcher.command"), join(stage, "Start StreamDesk Desk.command"));
chmodSync(join(stage, "Start StreamDesk Desk.command"), 0o755);

writeFileSync(
  join(stage, "README.txt"),
  `StreamDesk Desk (macOS)
=======================

1. Install Node.js 22+ from https://nodejs.org if you do not have it.
2. Double-click "Start StreamDesk Desk.command".
3. Open http://localhost:8790/ in Safari/Chrome to arrange apps + icons.
4. On your phone, open the StreamDesk app (or website remote), enter this Mac's IP and the PIN.

The desk agent listens on port 8790 on your Wi-Fi.
`,
  "utf8",
);

if (existsSync(zipPath)) {
  rmSync(zipPath);
}
execFileSync("zip", ["-r", zipPath, "."], { cwd: stage });
rmSync(stage, { recursive: true, force: true });
console.log(`Wrote ${zipPath}`);
