/**
 * Глобальная защита от перезагрузки страницы во время загрузки
 */

class UploadGuard {
  private isUploading = false;
  private hmrBlocked = false;
  private originalFetch: typeof fetch | null = null;

  startUpload() {
    this.isUploading = true;
    
    // Блокируем HMR в dev режиме
    if (import.meta.hot && !this.hmrBlocked) {
      try {
        import.meta.hot.decline();
        this.hmrBlocked = true;
        console.log('[UploadGuard] HMR disabled');
      } catch (e) {
        console.warn('[UploadGuard] Could not disable HMR:', e);
      }
    }

    // Перехватываем fetch для блокировки HMR запросов
    if (!this.originalFetch) {
      this.originalFetch = window.fetch;
      window.fetch = (...args) => {
        const url = args[0]?.toString() || '';
        
        // Блокируем HMR запросы во время загрузки
        if (this.isUploading && (url.includes('/@vite/client') || url.includes('?t='))) {
          console.warn('[UploadGuard] Blocked HMR request during upload:', url);
          return Promise.reject(new Error('HMR blocked during upload'));
        }
        
        return this.originalFetch!(...args);
      };
    }

    console.log('[UploadGuard] Upload protection activated');
  }

  endUpload() {
    this.isUploading = false;
    this.hmrBlocked = false;
    
    // Восстанавливаем оригинальный fetch
    if (this.originalFetch) {
      window.fetch = this.originalFetch;
      this.originalFetch = null;
    }
    
    console.log('[UploadGuard] Upload completed, protections removed');
  }

  getIsUploading() {
    return this.isUploading;
  }
}

export const uploadGuard = new UploadGuard();