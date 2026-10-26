import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { version } from '../../package.json';
import { compartirInvitacion, contarMiembros, invitar, miembrosConocidos, salir } from '../datos/acceso';
import { BarraPestanas } from '../componentes/BarraPestanas';
import '../estilos/ajustes.css';

const VALE = 'Vale 24 horas y una sola vez.';

const mensaje = (error: unknown) => (error instanceof Error ? error.message : 'Algo ha fallado. Inténtalo otra vez.');

// Ajustes: invitar a tu pareja, cerrar sesión y la versión. Al salir, `alSalir` vuelve a la bienvenida.
export function Ajustes({ alSalir }: { alSalir: () => void }) {
  // Lo que se sepa al abrir (de /api/yo al entrar) y luego lo que responda al contar. null: no se sabe, y se ofrece
  // invitar mientras tanto: así nada queda en blanco ni salta. Solo con 2 se dice que ya estáis los dos.
  const [miembros, setMiembros] = useState<number | null>(miembrosConocidos);
  const [invitando, setInvitando] = useState(false);
  const [saliendo, setSaliendo] = useState(false);
  const [estado, setEstado] = useState('');
  const [errorInvitar, setErrorInvitar] = useState('');
  const [errorSalir, setErrorSalir] = useState('');
  const [aMano, setAMano] = useState<string | null>(null);
  const campo = useRef<HTMLInputElement>(null);
  // El enlace pedido por adelantado (nunca va a la consola), si hay una petición en marcha y si la pantalla sigue
  // montada.
  const preparado = useRef<string | null>(null);
  const pidiendo = useRef(false);
  const montada = useRef(false);

  useEffect(() => {
    montada.current = true;
    contarMiembros().then((n) => montada.current && n !== null && setMiembros(n));
    return () => {
      montada.current = false;
    };
  }, []);

  // Safari solo abre la hoja de compartir (o copia) dentro del toque, y esperar a la red antes lo puede perder.
  // Por eso el enlace se pide al abrir Ajustes si falta alguien (o no se sabe), y otra vez tras usarlo.
  // Si falla, no se dice nada: al tocar se pedirá como siempre y el fallo saldrá entonces.
  const prepararEnlace = () => {
    if (pidiendo.current || preparado.current !== null) return;
    pidiendo.current = true;
    invitar()
      .then((enlace) => {
        if (montada.current) preparado.current = enlace;
      })
      .catch(() => {})
      .finally(() => {
        pidiendo.current = false;
      });
  };
  useEffect(() => {
    if (miembros !== 2) prepararEnlace();
  }, [miembros]);

  // Sin hoja ni portapapeles, el enlace queda seleccionado y con el foco para copiarlo.
  useEffect(() => {
    if (aMano === null) return;
    campo.current?.focus();
    campo.current?.select();
  }, [aMano]);

  const alInvitar = async () => {
    if (invitando) return;
    // Con el enlace listo, se comparte aquí mismo, antes de cualquier espera; si no, se pide y luego se comparte.
    const listo = preparado.current;
    preparado.current = null;
    const compartiendo = listo === null ? null : compartirInvitacion(listo);
    setInvitando(true);
    setEstado('');
    setErrorInvitar('');
    setAMano(null);
    try {
      const enlace = listo ?? (await invitar());
      const resultado = await (compartiendo ?? compartirInvitacion(enlace));
      if (resultado === 'compartida') setEstado(`Invitación lista. ${VALE}`);
      if (resultado === 'copiada') setEstado(`Enlace copiado. ${VALE}`);
      if (resultado === 'a mano') {
        setAMano(enlace);
        setEstado(VALE);
      }
      // Cerrar la hoja no gasta el enlace: sirve para el siguiente toque. Si se mandó o se enseñó, se pide otro.
      if (resultado === 'cancelada') preparado.current ??= enlace;
      else prepararEnlace();
    } catch (error) {
      setErrorInvitar(mensaje(error));
    } finally {
      setInvitando(false);
    }
  };

  const alSalirPulsado = async () => {
    if (saliendo) return;
    setSaliendo(true);
    setErrorSalir('');
    try {
      await salir();
      alSalir();
    } catch (error) {
      setErrorSalir(mensaje(error));
      setSaliendo(false);
    }
  };

  return (
    <>
      <main className="screen config">
        <div className="top">
          <Link className="back" to="/semana">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M15 5l-7 7 7 7" />
            </svg>
            Semana
          </Link>
        </div>
        <header>
          <h1>Ajustes</h1>
        </header>

        <section aria-labelledby="t-pareja">
          <h2 className="sec" id="t-pareja">
            Tu pareja
          </h2>
          {miembros === 2 && <p className="dentro">Ya estáis los dos en este hogar.</p>}
          {miembros !== 2 && (
            <div>
              <p className="txt">Mándale un enlace para que entre en vuestra Despensa desde su iPhone.</p>
              <button
                className="cta"
                type="button"
                aria-disabled={invitando}
                aria-busy={invitando}
                onClick={alInvitar}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 15V3M8 7l4-4 4 4" />
                  <path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7" />
                </svg>
                Invitar a tu pareja
              </button>
              {aMano !== null && (
                <label className="campo">
                  <span className="rot">Enlace de invitación</span>
                  <input ref={campo} readOnly value={aMano} />
                </label>
              )}
              <p className="estado" role="status">
                {estado}
              </p>
              {errorInvitar && (
                <p className="error" role="alert">
                  {errorInvitar}
                </p>
              )}
            </div>
          )}
        </section>

        <section aria-labelledby="t-sesion">
          <h2 className="sec" id="t-sesion">
            Sesión
          </h2>
          <p className="txt">Para volver a entrar en este iPhone, usa tu passkey.</p>
          <button
            className="cta quiet"
            type="button"
            aria-disabled={saliendo}
            aria-busy={saliendo}
            onClick={alSalirPulsado}
          >
            Cerrar sesión
          </button>
          {errorSalir && (
            <p className="error" role="alert">
              {errorSalir}
            </p>
          )}
        </section>

        <p className="version">Versión {version}</p>
      </main>
      <BarraPestanas />
    </>
  );
}
