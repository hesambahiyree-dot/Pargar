import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "ai.pargar.app",
  appName: "پرگار",
  webDir: ".vercel/output/static",
  bundledWebRuntime: false,
  android: { allowMixedContent: false },
};

export default config;
