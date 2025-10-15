import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { SSOProvider } from "@monorepo/shared-auth";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <SSOProvider>
      <App />
    </SSOProvider>
  </StrictMode>
);
