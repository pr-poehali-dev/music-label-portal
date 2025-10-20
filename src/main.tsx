import * as React from 'react';
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'
import { uploadGuard } from '@/utils/uploadGuard';

// Блокируем HMR если идёт загрузка
if (import.meta.hot) {
  import.meta.hot.on('vite:beforeUpdate', () => {
    if (uploadGuard.getIsUploading()) {
      console.warn('[HMR] Update blocked: upload in progress');
      return false;
    }
  });
}

createRoot(document.getElementById("root")!).render(<App />);