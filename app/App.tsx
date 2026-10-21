import { useEffect, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router';
import { haySesion } from './datos/acceso';
import { Bienvenida } from './pantallas/Bienvenida';
import { Invitacion } from './pantallas/Invitacion';
import { Pantalla } from './pantallas/Pantalla';

export function App() {
  return (
    <BrowserRouter>
      <Rutas />
    </BrowserRouter>
  );
}

// Puerta de sesión: /api/yo se pregunta una vez al cargar y, mientras no responde, no se pinta nada.
// Sin sesión solo existen la bienvenida y la invitación; con sesión, las dos llevan a /semana.
export function Rutas() {
  const [sesion, setSesion] = useState<boolean | null>(null);
  useEffect(() => {
    haySesion().then(setSesion);
  }, []);

  if (sesion === null) return null;

  if (!sesion) {
    // Al entrar, la sesión pasa a existir y la ruta en la que esté redirige a /semana.
    const alEntrar = () => setSesion(true);
    return (
      <Routes>
        <Route path="/bienvenida" element={<Bienvenida alEntrar={alEntrar} />} />
        <Route path="/invitacion" element={<Invitacion alEntrar={alEntrar} />} />
        <Route path="*" element={<Navigate to="/bienvenida" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/semana" element={<Pantalla titulo="Semana" />} />
      <Route path="/recetas" element={<Pantalla titulo="Recetas" />} />
      <Route path="/lista" element={<Pantalla titulo="Lista" />} />
      <Route path="/registro" element={<Pantalla titulo="Registro" />} />
      <Route path="*" element={<Navigate to="/semana" replace />} />
    </Routes>
  );
}
