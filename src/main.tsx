import './styles/global.css';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import App from './App';
import { AuthProvider } from './contexts/AuthContext';
import { WeatherProvider } from './contexts/WeatherContext';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <WeatherProvider>
        <App />
      </WeatherProvider>
    </AuthProvider>
  </StrictMode>,
);
