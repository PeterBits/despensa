import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import './estilos/tokens.css';
import './estilos/base.css';

declare global {
  interface Window {
    // Solo en desarrollo: carga las recetas de ejemplo en la copia local.
    despensa?: { semilla: () => Promise<number> };
  }
}

// Para capturas y revisiones: ?tema=claro|oscuro fuerza el tema.
const tema = new URLSearchParams(location.search).get('tema');
if (tema === 'claro' || tema === 'oscuro') {
  document.documentElement.dataset.theme = tema === 'claro' ? 'light' : 'dark';
}

if (import.meta.env.DEV) {
  window.despensa = { semilla: () => import('./datos/semilla').then((m) => m.cargarSemilla()) };
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
