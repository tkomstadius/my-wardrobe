import "./styles/global.css";

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import App from "./App";
import { WeatherProvider } from "./contexts/WeatherContext";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <WeatherProvider>
      <App />
    </WeatherProvider>
  </StrictMode>
);
