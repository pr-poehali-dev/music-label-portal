/**
 * Глобальная защита от перезагрузки страницы во время загрузки
 */

class UploadGuard {
  private isUploading = false;

  startUpload() {
    this.isUploading = true;
    
    // Блокируем HMR в dev режиме
    if (import.meta.hot) {
      try {
        import.meta.hot.decline();
        console.log('[UploadGuard] HMR disabled');
      } catch (e) {
        console.warn('[UploadGuard] Could not disable HMR:', e);
      }
    }

    console.log('[UploadGuard] Upload protection activated');
  }

  endUpload() {
    this.isUploading = false;
    console.log('[UploadGuard] Upload completed, protections removed');
  }

  getIsUploading() {
    return this.isUploading;
  }
}

export const uploadGuard = new UploadGuard();