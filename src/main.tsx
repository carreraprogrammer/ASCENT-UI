import React from 'react';
import ReactDOM from 'react-dom/client';
import { setupIonicReact } from '@ionic/react';
import App from './App';
import { api } from './services/api';

setupIonicReact();

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    void navigator.serviceWorker.register('/sw.js');
  });
}

const render = () => ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><App /></React.StrictMode>);

// TCW-5: API simulada en memoria, solo con VITE_LOCAL_FIXTURES=1 (scripts/serve-local.sh). Sin la variable Vite deja la
// condición en `false` y el bloque, el import y su chunk desaparecen del build (npm run check:bundle lo comprueba).
if (import.meta.env.VITE_LOCAL_FIXTURES === '1') {
  void import('./local-fixtures/install').then(({ installLocalFixtures }) => {
    installLocalFixtures(api);
    render();
  });
} else {
  render();
}
