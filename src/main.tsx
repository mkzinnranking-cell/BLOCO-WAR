import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";

// Em dispositivos Android compatíveis, tenta manter o jogo em paisagem.
// O bloqueio definitivo do APK também é aplicado no AndroidManifest pelo workflow.
if (typeof window !== "undefined") {
  const orientation = (screen.orientation as ScreenOrientation & { lock?: (orientation: string) => Promise<void> });
  orientation?.lock?.("landscape").catch(() => {});
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
