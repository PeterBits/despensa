import type { ReactNode } from 'react';
import { NavLink } from 'react-router';

const pestanas: { ruta: string; texto: string; icono: ReactNode }[] = [
  {
    ruta: '/semana',
    texto: 'Semana',
    icono: (
      <>
        <rect x="3.5" y="5" width="17" height="15" rx="2.5" />
        <path d="M3.5 10h17M8 3v4M16 3v4" />
      </>
    ),
  },
  {
    ruta: '/recetas',
    texto: 'Recetas',
    icono: (
      <>
        <path d="M5 4.5h11a3 3 0 0 1 3 3v12H8a3 3 0 0 1-3-3z" />
        <path d="M5 16.5a3 3 0 0 1 3-3h11" />
      </>
    ),
  },
  {
    ruta: '/lista',
    texto: 'Lista',
    icono: (
      <>
        <path d="M9 6h11M9 12h11M9 18h11" />
        <path d="M4 6l1 1 2-2M4 12l1 1 2-2" />
        <circle cx="5" cy="18" r="1" />
      </>
    ),
  },
  {
    ruta: '/registro',
    texto: 'Registro',
    icono: <path d="M4 20V10M10 20V4M16 20v-7M21 20H3" />,
  },
];

export function BarraPestanas() {
  return (
    <nav className="tabs" aria-label="Secciones">
      <div className="tabs-in">
        {pestanas.map(({ ruta, texto, icono }) => (
          <NavLink key={ruta} to={ruta} className="tab">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              {icono}
            </svg>
            {texto}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
