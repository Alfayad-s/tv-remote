import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.iffalcon.remote",
  appName: "iFFALCON Remote",
  webDir: "dist",
  server: {
    androidScheme: "https",
  },
  android: {
    allowMixedContent: false,
  },
};

export default config;
