import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "@fontsource/public-sans";
import { CssVarsProvider } from "@mui/joy";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <CssVarsProvider>
      <App />
    </CssVarsProvider>
  </React.StrictMode>
);
