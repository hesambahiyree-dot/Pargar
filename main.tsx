import React from "react";
import { createRoot } from "react-dom/client";
import { AppShell } from "@/components/board/AppShell";
import "./styles.css";

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AppShell />
  </React.StrictMode>,
);
