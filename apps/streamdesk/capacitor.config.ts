import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.streamdesk.app",
  appName: "StreamDesk",
  webDir: "dist",
  server: {
    // LAN WebSocket to the Mac desk uses ws://, so cleartext must be allowed.
    androidScheme: "http",
    cleartext: true,
  },
  android: {
    allowMixedContent: true,
  },
};

export default config;
