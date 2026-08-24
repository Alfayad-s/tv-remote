import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import App from "./App.js";
import { isNativeAndroid } from "./native/platform.js";
import "./index.css";

const root = document.getElementById("root");
if (!root) {
  throw new Error("Root element not found");
}

if (!isNativeAndroid()) {
  registerSW({ immediate: true });
}

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
