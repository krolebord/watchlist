import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app.tsx';

import './index.css';
import { trpc } from './trpc.ts';

const rootElement = document.getElementById('root');

trpc.greet.query('world').then((text) => {
  if (rootElement) {
    createRoot(rootElement).render(
      <StrictMode>
        <App message={text} />
      </StrictMode>,
    );
  }
});
