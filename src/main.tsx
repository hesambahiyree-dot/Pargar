import React from "react";
import { createRoot } from "react-dom/client";
import { AppShell } from "./components/board/AppShell";

const root = document.getElementById("root");

if (!root) {
  throw new Error("Pargar root element was not found");
}

createRoot(root).render(
  <React.StrictMode>
    <AppShell />
  </React.StrictMode>,
);
