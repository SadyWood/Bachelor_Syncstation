// packages/timeline/demo/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { SimpleDemoApp } from './SimpleDemoApp';
import '../src/Timeline.css';

const root = document.getElementById('root');
if (root) {
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <SimpleDemoApp />
    </React.StrictMode>,
  );
}
