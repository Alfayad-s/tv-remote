import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { copyFileSync, createReadStream, existsSync, mkdirSync, statSync } from "node:fs";
import type { IncomingMessage, ServerResponse } from "node:http";
import { join } from "node:path";
import { fileURLToPath, URL } from "node:url";
import { defineConfig, type Plugin, type ViteDevServer } from "vite";
import { VitePWA } from "vite-plugin-pwa";

const APK_ROUTE = "/downloads/iffalcon-remote.apk";
const APK_FILENAME = "iffalcon-remote.apk";

function gradleApk(root: string): string {
  return join(root, "android/app/build/outputs/apk/debug/app-debug.apk");
}

function publicApk(root: string): string {
  return join(root, "public/downloads", APK_FILENAME);
}

function resolveApk(root: string): string | null {
  const staged = publicApk(root);
  const built = gradleApk(root);
  if (existsSync(staged)) {
    return staged;
  }
  if (existsSync(built)) {
    return built;
  }
  return null;
}

function stageApkForWeb(root: string): string | null {
  const built = gradleApk(root);
  const staged = publicApk(root);
  if (existsSync(built)) {
    mkdirSync(join(root, "public/downloads"), { recursive: true });
    copyFileSync(built, staged);
    return staged;
  }
  return resolveApk(root);
}

function serveApk(root: string, req: IncomingMessage, res: ServerResponse, next: () => void): void {
  const url = req.url?.split("?")[0] ?? "";
  if (url !== APK_ROUTE) {
    next();
    return;
  }
  const file = resolveApk(root) ?? stageApkForWeb(root);
  if (!file) {
    res.statusCode = 404;
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.end("Android app is not available.");
    return;
  }
  const { size } = statSync(file);
  res.setHeader("Content-Type", "application/vnd.android.package-archive");
  res.setHeader("Content-Disposition", `attachment; filename="${APK_FILENAME}"`);
  res.setHeader("Content-Length", String(size));
  res.setHeader("Cache-Control", "no-store");
  createReadStream(file).pipe(res);
}

function apkDownloadPlugin(): Plugin {
  let root = process.cwd();
  return {
    name: "apk-download",
    configResolved(config) {
      root = config.root;
      stageApkForWeb(root);
    },
    configureServer(server: ViteDevServer) {
      server.middlewares.use((req, res, next) => {
        serveApk(root, req, res, next);
      });
    },
    configurePreviewServer(server) {
      server.middlewares.use((req, res, next) => {
        serveApk(root, req, res, next);
      });
    },
  };
}

export default defineConfig({
  plugins: [
    apkDownloadPlugin(),
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg", "apple-touch-icon.png"],
      manifest: {
        name: "TV Remote",
        short_name: "TV Remote",
        description: "Phone remote for Android TV",
        theme_color: "#111111",
        background_color: "#111111",
        display: "standalone",
        orientation: "portrait",
        start_url: "/",
        scope: "/",
        icons: [
          {
            src: "icons/icon-192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "icons/icon-512.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "icons/icon-512-maskable.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,webmanifest}"],
        globIgnores: ["**/downloads/**"],
        navigateFallback: "/index.html",
        navigateFallbackDenylist: [/^\/downloads\//, /\.apk$/i],
        runtimeCaching: [
          {
            urlPattern: ({ request, url }) =>
              request.mode === "navigate" && !url.pathname.startsWith("/downloads/"),
            handler: "NetworkFirst",
            options: {
              cacheName: "app-shell",
            },
          },
        ],
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  envDir: fileURLToPath(new URL("../..", import.meta.url)),
  server: {
    host: true,
    port: 5173,
    proxy: {
      "/ws": {
        target: "ws://127.0.0.1:8787",
        ws: true,
      },
    },
  },
  preview: {
    host: true,
    port: 4173,
    proxy: {
      "/ws": {
        target: "ws://127.0.0.1:8787",
        ws: true,
      },
    },
  },
});
