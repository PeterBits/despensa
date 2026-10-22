import { useEffect, useMemo, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router';
import { leerSesion, olvidarSesion, type Sesion } from './datos/acceso';
import { abrirCopia } from './datos/local';
import { iniciarSincronizacion } from './datos/sincronizacion';
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
// Con sesión se abre la copia local del hogar antes de pintar las pestañas y se arranca la sincronización.
export function Rutas() {
  // undefined: aún se está preguntando; null: no hay sesión.
  const [sesion, setSesion] = useState<Sesion | null | undefined>(undefined);
  useEffect(() => {
    leerSesion().then(setSesion);
  }, []);

  const hogarId = sesion?.hogarId;
  // Se abre durante el render, no en un efecto: las pantallas hijas leen `copia()` al pintarse.
  useMemo(() => {
    if (hogarId) abrirCopia(hogarId);
  }, [hogarId]);
  useEffect(() => {
    if (!hogarId) return;
    return iniciarSincronizacion({
      alPerderSesion: () => {
        olvidarSesion();
        setSesion(null);
      },
    });
  }, [hogarId]);

  if (sesion === undefined) return null;

  if (!sesion) {
    // Al entrar, se vuelve a leer la sesión y la ruta en la que esté redirige a /semana.
    const alEntrar = () => leerSesion().then(setSesion);
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
