import { useState } from 'react';

export function App({ message }: { message: string }) {
  const [count, setCount] = useState(0);

  return (
    <>
      <h1>Vite + React</h1>
      <p>{message}</p>
      <div className="card">
        <button type="button" onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">Click on the Vite and React logos to learn more</p>
    </>
  );
}
