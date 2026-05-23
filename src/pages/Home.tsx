import { Button } from '@/components/Button';
import { useCounter } from '@/hooks/useCounter';

export function Home() {
  const { count, increment, decrement, reset } = useCounter(0);

  return (
    <main className="home">
      <h1>Vikingspill</h1>
      <p>Velkommen! Vite + React + TypeScript er klart.</p>

      <section className="counter">
        <p>
          Teller: <strong>{count}</strong>
        </p>
        <div className="counter__actions">
          <Button onClick={decrement}>-</Button>
          <Button onClick={reset} variant="secondary">
            Nullstill
          </Button>
          <Button onClick={increment}>+</Button>
        </div>
      </section>
    </main>
  );
}
