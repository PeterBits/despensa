import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { aceptarInvitacion, entrar, RechazoDelServidor } from '../datos/acceso';
import '../estilos/acceso.css';
import { useCeremonia } from './ceremonia';

// Sin vuelta atrás: la invitación ya no vale (410) o el hogar ya está completo (409).
// El texto sale del estado, no del servidor: dice la salida una vez y explica el enlace de entrar.
const CADUCADA = {
  titulo: 'Esta invitación ya no vale',
  linea: 'Pídele a tu pareja un enlace nuevo. Si ya te uniste, entra con tu passkey.',
};
const TEXTOS: Record<number, { titulo: string; linea: string }> = {
  410: CADUCADA,
  409: {
    titulo: 'Este hogar ya tiene dos personas',
    linea: 'Si eres una de ellas, entra con tu passkey.',
  },
};
const TERMINALES = Object.keys(TEXTOS).map(Number);

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
  // El rechazo final se queda aunque luego falle "Entrar con mi passkey": esa ceremonia cambia `error`,
  // y la invitación sigue sin valer.
  const [rechazo, setRechazo] = useState<RechazoDelServidor | null>(null);
  if (!rechazo && error instanceof RechazoDelServidor && TERMINALES.includes(error.estado)) setRechazo(error);

  // Si el estado final llega tras pulsar, el botón desaparece: el foco pasa al título en vez de caer al body.
  const titulo = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (rechazo) titulo.current?.focus();
  }, [rechazo]);

  // Quien ya se unió (y, por ejemplo, perdió la respuesta) no necesita otro enlace: le basta entrar con su passkey.
  if (!token || rechazo) {
    // Sin token cuenta como 410. El título no es una alerta: ya recibe el foco y se leería dos veces.
    const texto = (rechazo && TEXTOS[rechazo.estado]) || CADUCADA;
    return (
      <main className="screen acceso">
        <header>
          <h1 ref={titulo} tabIndex={-1}>
            {texto.titulo}
          </h1>
          <p className="sub">{texto.linea}</p>
        </header>
        <div className="acciones">
          {error && error !== rechazo && (
            <p className="status" role="alert">
              {error.message}
            </p>
          )}
          <button
            type="button"
            className="link"
            aria-busy={ocupada === 'entrar'}
            aria-disabled={ocupada !== null}
            onClick={() => lanzar('entrar', entrar)}
          >
            Entrar con mi passkey
          </button>
        </div>
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
