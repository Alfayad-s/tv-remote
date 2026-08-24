import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { createReadStream, existsSync } from "node:fs";
import type { IncomingMessage, ServerResponse } from "node:http";
import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

const apkPublic = fileURLToPath(new URL("./public/downloads/iffalcon-remote.apk", import.meta.url));
const apkBuild = fileURLToPath(
  new URL("./android/app/build/outputs/apk/debug/app-debug.apk", import.meta.url),
);

function apkFile(): string | null {
  if (existsSync(apkPublic)) {
    return apkPublic;
  }
  if (existsSync(apkBuild)) {
    return apkBuild;
  }
  return null;
}

function serveApk(req: IncomingMessage, res: ServerResponse, next: () => void): void {
  const url = req.url?.split("?")[0] ?? "";
  if (url !== "/downloads/iffalcon-remote.apk") {
    next();
    return;
  }
  const file = apkFile();
  if (!file) {
    res.statusCode = 404;
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.end("Android APK is not available. Run npm run apk:web after building the APK.");
    return;
  }
  res.setHeader("Content-Type", "application/vnd.android.package-archive");
  res.setHeader("Content-Disposition", 'attachment; filename="iffalcon-remote.apk"');
  createReadStream(file).pipe(res);
}

export default defineConfig({
  plugins: [
    {
      name: "apk-download",
      configureServer(server) {
        server.middlewares.use(serveApk);
      },
      configurePreviewServer(server) {
        server.middlewares.use(serveApk);
      },
    },
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg", "apple-touch-icon.png"],
      manifest: {
        name: "iFFALCON Remote",
        short_name: "TV Remote",
        description: "Personal remote control for iFFALCON Android TV",
        theme_color: "#071018",
        background_color: "#071018",
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
