import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import ToonAdminEditor from './ToonAdminEditor';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ToonAdminEditor />
  </StrictMode>,
);
