import "@radix-ui/themes/styles.css";
import "./styles/global.css";

import { Theme } from "@radix-ui/themes";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import App from "./App";
import { WardrobeProvider } from "./contexts/WardrobeContext";
import { OutfitProvider } from "./contexts/OutfitContext";
import { WeatherProvider } from "./contexts/WeatherContext";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <WardrobeProvider>
      <OutfitProvider>
        <WeatherProvider>
          <Theme appearance="dark" accentColor="indigo" radius="medium">
            <App />
          </Theme>
        </WeatherProvider>
      </OutfitProvider>
    </WardrobeProvider>
  </StrictMode>
);
