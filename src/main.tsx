import '@radix-ui/themes/styles.css';
import './styles/global.css';

import { Theme } from '@radix-ui/themes';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';

import App from './App';
import { WardrobeProvider } from './contexts/WardrobeContext';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <WardrobeProvider>
      <Theme appearance="dark" accentColor="violet" radius="medium">
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </Theme>
    </WardrobeProvider>
  </StrictMode>,
);
