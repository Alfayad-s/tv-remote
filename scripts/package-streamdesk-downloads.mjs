import { copyFileSync, existsSync, mkdirSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { homedir } from "node:os";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const downloads = join(root, "apps/web/public/downloads");
mkdirSync(downloads, { recursive: true });

function run(command, args, cwd) {
  const result = spawnSync(command, args, { cwd, stdio: "inherit", shell: false });
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(" ")} failed`);
  }
}

function findCachedGradle(): string | null {
  const base = join(homedir(), ".gradle/wrapper/dists/gradle-8.11.1-bin");
  if (!existsSync(base)) {
    return null;
  }
  for (const hash of readdirSync(base)) {
    const candidate = join(base, hash, "gradle-8.11.1/bin/gradle");
    if (existsSync(candidate)) {
      return candidate;
    }
  }
  return null;
}

console.log("Packaging StreamDesk Mac zip…");
run("node", [join(root, "scripts/package-streamdesk-mac.mjs")], root);

console.log("Building StreamDesk web + syncing Android…");
run("npm", ["run", "build"], join(root, "apps/streamdesk"));
run("npx", ["cap", "sync", "android"], join(root, "apps/streamdesk"));

console.log("Assembling StreamDesk debug APK…");
const androidDir = join(root, "apps/streamdesk/android");
const cachedGradle = findCachedGradle();
if (cachedGradle) {
  run(cachedGradle, [":app:assembleDebug"], androidDir);
} else {
  run("./gradlew", [":app:assembleDebug"], androidDir);
}

const apkFrom = join(androidDir, "app/build/outputs/apk/debug/app-debug.apk");
const apkTo = join(downloads, "streamdesk.apk");
if (!existsSync(apkFrom)) {
  throw new Error(`APK missing at ${apkFrom}`);
}
copyFileSync(apkFrom, apkTo);
console.log(`Copied streamdesk.apk → ${apkTo}`);

const zip = join(downloads, "StreamDesk-mac.zip");
if (!existsSync(zip)) {
  throw new Error(`Mac zip missing at ${zip}`);
}
console.log("StreamDesk downloads ready.");
