import { createReadStream, existsSync, statSync } from "node:fs";
import type { IncomingMessage, ServerResponse } from "node:http";
import { extname, join, relative, resolve, sep } from "node:path";

const MIME_TYPES: Record<string, string> = {
  ".apk": "application/vnd.android.package-archive",
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".map": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
  ".webmanifest": "application/manifest+json",
  ".woff2": "font/woff2",
};

function contentType(filePath: string): string {
  return MIME_TYPES[extname(filePath).toLowerCase()] ?? "application/octet-stream";
}

function isInsideDir(dir: string, filePath: string): boolean {
  const relativePath = relative(dir, filePath);
  return (
    relativePath.length > 0 &&
    !relativePath.startsWith(`..${sep}`) &&
    !relativePath.startsWith("..")
  );
}

function sendFile(res: ServerResponse, filePath: string, status = 200): void {
  const apk = filePath.toLowerCase().endsWith(".apk");
  res.writeHead(status, {
    "Content-Type": contentType(filePath),
    "Cache-Control": filePath.endsWith("index.html") || apk ? "no-cache" : "public, max-age=86400",
    ...(apk ? { "Content-Disposition": 'attachment; filename="iffalcon-remote.apk"' } : {}),
  });
  createReadStream(filePath).pipe(res);
}

export function tryServeWebAsset(
  request: IncomingMessage,
  response: ServerResponse,
  webDist: string,
): boolean {
  if (request.method !== "GET" && request.method !== "HEAD") {
    return false;
  }

  let pathname = "/";
  try {
    pathname = new URL(request.url ?? "/", "http://127.0.0.1").pathname;
  } catch {
    response.writeHead(400, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Bad request");
    return true;
  }

  const decoded = decodeURIComponent(pathname);
  const requested = decoded === "/" ? "/index.html" : decoded;
  const filePath = resolve(webDist, requested.slice(1));
  if (!isInsideDir(webDist, filePath)) {
    response.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Forbidden");
    return true;
  }

  if (existsSync(filePath) && statSync(filePath).isFile()) {
    sendFile(response, filePath);
    return true;
  }

  const indexPath = join(webDist, "index.html");
  const looksLikeAsset = extname(requested).length > 0;
  if (!looksLikeAsset && existsSync(indexPath)) {
    sendFile(response, indexPath);
    return true;
  }

  return false;
}
