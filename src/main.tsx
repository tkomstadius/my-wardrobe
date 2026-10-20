import './styles/global.css';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import App from './App';
import { ToastProvider } from './components/common/ui/Toast';
import { AuthProvider } from './contexts/AuthContext';
import { WeatherProvider } from './contexts/WeatherContext';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ToastProvider>
      <AuthProvider>
        <WeatherProvider>
          <App />
        </WeatherProvider>
      </AuthProvider>
    </ToastProvider>
  </StrictMode>,
);
