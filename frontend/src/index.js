import React from "react";
import ReactDOM from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import { setupIonicReact } from "@ionic/react";

/* Ionic core CSS — custom properties only (safe to import globally) */
import "@ionic/react/css/core.css";

/* Ionic utility classes used inside admin */
import "@ionic/react/css/padding.css";
import "@ionic/react/css/text-alignment.css";
import "@ionic/react/css/flex-utils.css";
import "@ionic/react/css/display.css";

import "@/index.css";
import App from "@/App";

/* Initialize Ionic — MD mode for consistent web/desktop styling */
setupIonicReact({ mode: "md" });

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <HelmetProvider>
      <App />
    </HelmetProvider>
  </React.StrictMode>,
);
