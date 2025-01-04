import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app.tsx";

import "./index.css";

const rootElement = document.getElementById("root");

fetch("/api/hello")
  .then((resp) => resp.text())
  .then((text) => {
    if (rootElement) {
      createRoot(rootElement).render(
        <StrictMode>
          <App message={text} />
        </StrictMode>
      );
    }
  });
