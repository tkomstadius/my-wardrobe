import "@radix-ui/themes/styles.css";
import "./styles/global.css";

import { Theme } from "@radix-ui/themes";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import App from "./App";
import { WardrobeProvider } from "./contexts/WardrobeContext";
import { OutfitProvider } from "./contexts/OutfitContext";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <WardrobeProvider>
      <OutfitProvider>
        <Theme appearance="dark" accentColor="violet" radius="medium">
          <App />
        </Theme>
      </OutfitProvider>
    </WardrobeProvider>
  </StrictMode>
);
