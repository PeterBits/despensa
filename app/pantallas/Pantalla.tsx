import { BarraPestanas } from '../componentes/BarraPestanas';

export function Pantalla({ titulo }: { titulo: string }) {
  return (
    <>
      <main className="screen">
        <header>
          <h1>{titulo}</h1>
        </header>
      </main>
      <BarraPestanas />
    </>
  );
}
