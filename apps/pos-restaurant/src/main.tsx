import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { SSOProvider } from "@monorepo/shared-auth";
import { Provider } from "react-redux";
import { store } from "./store/store";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Provider store={store}>
      <SSOProvider>
        <App />
      </SSOProvider>
    </Provider>
  </StrictMode>
);
