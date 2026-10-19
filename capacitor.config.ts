import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "ai.pargar.app",
  appName: "پرگار",
  webDir: ".output/public",
  bundledWebRuntime: false,
  android: { allowMixedContent: false },
};

export default config;
