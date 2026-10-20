import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import './estilos/tokens.css';
import './estilos/base.css';

// Para capturas y revisiones: ?tema=claro|oscuro fuerza el tema.
const tema = new URLSearchParams(location.search).get('tema');
if (tema === 'claro' || tema === 'oscuro') {
  document.documentElement.dataset.theme = tema === 'claro' ? 'light' : 'dark';
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
