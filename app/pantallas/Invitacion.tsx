import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { aceptarInvitacion, InvitacionCaducada } from '../datos/acceso';
import '../estilos/acceso.css';
import { useCeremonia } from './ceremonia';

// La misma frase que da el servidor con un 410.
const CADUCADA = 'Esta invitación ya no vale. Pide otra.';

export function Invitacion({ alEntrar }: { alEntrar?: () => void }) {
  const { hash, pathname, search } = useLocation();
  const navigate = useNavigate();
  // El enlace lleva el token en el hash: se lee una vez y se quita de la URL, para que no quede a la vista ni en el historial.
  const [token] = useState(() => hash.slice(1));
  useEffect(() => {
    if (!hash) return;
    window.history.replaceState(window.history.state, '', pathname + search);
    navigate({ pathname, search }, { replace: true });
  }, [hash, pathname, search, navigate]);

  const { ocupada, error, lanzar } = useCeremonia(alEntrar);
  const caducada = !token ? CADUCADA : error instanceof InvitacionCaducada ? error.message : null;

  if (caducada) {
    return (
      <main className="screen acceso">
        <header role="alert">
          <h1>{caducada}</h1>
          <p className="sub">Pídele a tu pareja que te mande un enlace nuevo.</p>
        </header>
      </main>
    );
  }

  return (
    <main className="screen acceso">
      <header>
        <h1>Tu pareja te invita a su Despensa</h1>
      </header>
      <div className="acciones">
        {error && (
          <p className="status" role="alert">
            {error.message}
          </p>
        )}
        <button
          type="button"
          className="cta"
          aria-busy={ocupada !== null}
          aria-disabled={ocupada !== null}
          onClick={() => lanzar('aceptar', () => aceptarInvitacion(token))}
        >
          Entrar con Face ID
        </button>
      </div>
    </main>
  );
}
