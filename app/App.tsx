import { BrowserRouter, Navigate, Route, Routes } from 'react-router';
import { Pantalla } from './pantallas/Pantalla';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/semana" replace />} />
        <Route path="/semana" element={<Pantalla titulo="Semana" />} />
        <Route path="/recetas" element={<Pantalla titulo="Recetas" />} />
        <Route path="/lista" element={<Pantalla titulo="Lista" />} />
        <Route path="/registro" element={<Pantalla titulo="Registro" />} />
      </Routes>
    </BrowserRouter>
  );
}
