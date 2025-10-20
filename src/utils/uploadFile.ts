export interface UploadFileResult {
  url: string;
  fileName: string;
  fileSize: number;
  s3Key?: string;
}

/**
 * Простая загрузка файла через FormData
 * Без chunking - один запрос, быстро и надёжно
 */
export async function uploadFile(file: File): Promise<UploadFileResult> {
  const maxSize = 50 * 1024 * 1024; // 50MB лимит для прямой загрузки
  const fileSizeMB = (file.size / 1024 / 1024).toFixed(2);
  
  console.log(`[Upload] File: ${file.name}, Size: ${fileSizeMB}MB`);
  
  if (file.size > maxSize) {
    throw new Error('Размер файла превышает 50MB');
  }
  
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('fileName', file.name);
    
    const response = await fetch('https://functions.poehali.dev/01922e7e-40ee-4482-9a75-1bf53b8812d9', {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown');
      console.error(`[Upload] Failed:`, response.status, errorText);
      throw new Error(`Ошибка загрузки: ${response.status}`);
    }
    
    const result = await response.json();
    console.log(`[Upload] Success! File uploaded to: ${result.url}`);
    
    return result;
    
  } catch (error) {
    console.error('[Upload] Fetch error:', error instanceof Error ? error.message : 'Unknown', 'for', file.name);
    throw error;
  }
}