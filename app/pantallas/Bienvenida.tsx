import { crearHogar, entrar } from '../datos/acceso';
import '../estilos/acceso.css';
import { useCeremonia } from './ceremonia';

export function Bienvenida({ alEntrar }: { alEntrar?: () => void }) {
  const { ocupada, error, lanzar } = useCeremonia(alEntrar);
  return (
    <main className="screen acceso">
      <header>
        <h1>Despensa</h1>
        <p className="sub">
          Decide con tu pareja la comida de la semana en un par de minutos, con la lista de la compra hecha sola.
        </p>
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
          aria-busy={ocupada === 'crear'}
          aria-disabled={ocupada !== null}
          onClick={() => lanzar('crear', crearHogar)}
        >
          Crear nuestro hogar
        </button>
        <button
          type="button"
          className="link"
          aria-busy={ocupada === 'entrar'}
          aria-disabled={ocupada !== null}
          onClick={() => lanzar('entrar', entrar)}
        >
          Ya tengo cuenta: entrar
        </button>
      </div>
    </main>
  );
}
