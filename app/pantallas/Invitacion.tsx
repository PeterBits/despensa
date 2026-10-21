import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { aceptarInvitacion, RechazoDelServidor } from '../datos/acceso';
import '../estilos/acceso.css';
import { useCeremonia } from './ceremonia';

// La misma frase que da el servidor con un 410.
const CADUCADA = 'Esta invitación ya no vale. Pide otra.';
// Sin vuelta atrás: la invitación ya no vale (410) o el hogar ya está completo (409).
const TERMINALES = [410, 409];

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
  const rechazo = error instanceof RechazoDelServidor && TERMINALES.includes(error.estado) ? error : null;

  // Si el estado final llega tras pulsar, el botón desaparece: el foco pasa al título en vez de caer al body.
  const titulo = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (rechazo) titulo.current?.focus();
  }, [rechazo]);

  if (!token || rechazo) {
    return (
      <main className="screen acceso">
        <header>
          <h1 ref={titulo} tabIndex={-1}>
            <span role="alert">{rechazo ? rechazo.message : CADUCADA}</span>
          </h1>
          {rechazo?.estado !== 409 && <p className="sub">Pídele a tu pareja que te mande un enlace nuevo.</p>}
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
