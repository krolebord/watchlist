import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app.tsx";

import "./index.css";

const rootElement = document.getElementById("root");

const resp = await fetch("/api/hello");

if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      <App message={await resp.text()} />
    </StrictMode>
  );
}
