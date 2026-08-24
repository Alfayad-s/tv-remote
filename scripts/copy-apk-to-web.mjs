import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));
const from = join(root, "../apps/web/android/app/build/outputs/apk/debug/app-debug.apk");
const publicDir = join(root, "../apps/web/public/downloads");
const distDir = join(root, "../apps/web/dist/downloads");
const name = "iffalcon-remote.apk";

if (!existsSync(from)) {
  console.warn("No debug APK found. Build one with: cd apps/web/android && ./gradlew assembleDebug");
  process.exit(0);
}

mkdirSync(publicDir, { recursive: true });
copyFileSync(from, join(publicDir, name));
if (existsSync(join(root, "../apps/web/dist"))) {
  mkdirSync(distDir, { recursive: true });
  copyFileSync(from, join(distDir, name));
}
console.log(`Copied ${name} for website download.`);
