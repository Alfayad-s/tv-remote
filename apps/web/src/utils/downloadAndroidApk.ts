import { ANDROID_APK_FILENAME, ANDROID_APK_HREF } from "./androidApk.js";

export const APK_MISSING_MESSAGE =
  "The Android app file was not found. On the computer run npm run apk:web, then try again.";

async function readPrefix(blob: Blob, bytes: number): Promise<Uint8Array> {
  const slice = blob.slice(0, bytes);
  if (typeof slice.arrayBuffer === "function") {
    return new Uint8Array(await slice.arrayBuffer());
  }
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve(new Uint8Array(reader.result as ArrayBuffer));
    };
    reader.onerror = () => {
      reject(reader.error ?? new Error("Could not read download."));
    };
    reader.readAsArrayBuffer(slice);
  });
}

export async function looksLikeApk(blob: Blob): Promise<boolean> {
  if (blob.size < 10_000) {
    return false;
  }
  const type = blob.type.toLowerCase();
  if (
    type.includes("text/html") ||
    type.includes("text/javascript") ||
    type.includes("application/json")
  ) {
    return false;
  }
  const header = await readPrefix(blob, 2);
  return header[0] === 0x50 && header[1] === 0x4b;
}

export async function downloadAndroidApk(): Promise<string | null> {
  const response = await fetch(`${ANDROID_APK_HREF}?t=${String(Date.now())}`, {
    cache: "no-store",
  });
  if (!response.ok) {
    return APK_MISSING_MESSAGE;
  }
  const blob = await response.blob();
  if (!(await looksLikeApk(blob))) {
    return APK_MISSING_MESSAGE;
  }
  const url = URL.createObjectURL(blob);
  try {
    const link = document.createElement("a");
    link.href = url;
    link.download = ANDROID_APK_FILENAME;
    link.rel = "noopener";
    document.body.append(link);
    link.click();
    link.remove();
  } finally {
    URL.revokeObjectURL(url);
  }
  return null;
}
