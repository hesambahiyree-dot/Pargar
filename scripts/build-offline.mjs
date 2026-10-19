#!/usr/bin/env node
import { spawn } from "node:child_process";

const command = process.platform === "win32" ? "node.exe" : "node";
const child = spawn(
  command,
  ["scripts/with-app-env.mjs", "vite", "build"],
  {
    stdio: "inherit",
    env: {
      ...process.env,
      VITE_AUTH_ENABLED: "false",
      VITE_GROK_EXTENSIONS: "0",
      VITE_OFFLINE_BUILD: "1",
      DATABASE_URL: "",
    },
  },
);
child.on("error", (error) => {
  console.error("[offline-build] Could not start Vite:", error.message);
  process.exit(1);
});
child.on("exit", (code, signal) => {
  if (signal) process.exit(1);
  process.exit(code ?? 1);
});
