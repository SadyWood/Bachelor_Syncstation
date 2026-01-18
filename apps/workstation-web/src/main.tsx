import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { SWRConfig } from 'swr';
import './styles/ui.css';
import App from './App';
import { AuthProvider } from './state/AuthContext';

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Root element not found');

createRoot(rootElement).render(
  <React.StrictMode>
    <BrowserRouter>
      <SWRConfig
        value={{
          revalidateOnFocus: false,
          revalidateOnReconnect: true,
          shouldRetryOnError: true,
          errorRetryCount: 3,
          dedupingInterval: 2000,
        }}
      >
        <AuthProvider>
          <App />
        </AuthProvider>
      </SWRConfig>
    </BrowserRouter>
  </React.StrictMode>,
);
