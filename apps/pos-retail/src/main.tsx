import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { store } from "./store/store";
import "./index.css";
import App from "./App.tsx";
import { I18nextProvider } from "react-i18next";
import { i18n } from "@monorepo/shared-providers";
import { LocalizationProvider } from "@monorepo/shared-providers";
import { KeycloakAuthProvider } from "@monorepo/shared-auth";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Provider store={store}>
      <KeycloakAuthProvider>
        <I18nextProvider i18n={i18n}>
          <LocalizationProvider>
            <App />
          </LocalizationProvider>
        </I18nextProvider>
      </KeycloakAuthProvider>
    </Provider>
  </StrictMode>
);
