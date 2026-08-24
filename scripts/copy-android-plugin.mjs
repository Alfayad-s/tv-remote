import { copyFileSync, mkdirSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));
const from = join(root, "../apps/web/android-src/com/iffalcon/remote");
const to = join(root, "../apps/web/android/app/src/main/java/com/iffalcon/remote");

mkdirSync(to, { recursive: true });
for (const name of readdirSync(from)) {
  if (name.endsWith(".kt")) {
    copyFileSync(join(from, name), join(to, name));
  }
}
