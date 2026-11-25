import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "@tanstack/react-router";
import { router } from "./router";
import { LanguageProvider } from "./lib/i18n";
import "./styles.css";

const rootElement = document.getElementById("root");
if (rootElement && !rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <LanguageProvider>
        <RouterProvider router={router} />
      </LanguageProvider>
    </React.StrictMode>
  );
}
