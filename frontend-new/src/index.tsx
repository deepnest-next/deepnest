/* @refresh reload */
import { render, Show } from "solid-js/web";
import "./styles/globals.css";
import App from "./App";

import { I18nProvider, useTranslation } from "./utils/i18n";

const root = document.getElementById("root");

if (import.meta.env.DEV && !(root instanceof HTMLElement)) {
  throw new Error(
    "Root element not found. Did you forget to add it to your index.html? Or maybe the id attribute got misspelled?",
  );
}
const [, { isReady }] = useTranslation("common"); // Initialize translation for 'common' namespace
render(
  () => (
    <I18nProvider>
      <Show when={isReady()}>
        <App />
      </Show>
    </I18nProvider>
  ),
  root!,
);
