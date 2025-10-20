export interface UploadFileResult {
  url: string;
  fileName: string;
  fileSize: number;
  s3Key?: string;
}

/**
 * Загрузка файла: маленькие через FormData, большие через presigned S3 URL
 */
export async function uploadFile(file: File): Promise<UploadFileResult> {
  const maxSize = 50 * 1024 * 1024;
  const fileSizeMB = (file.size / 1024 / 1024).toFixed(2);
  
  console.log(`[Upload] File: ${file.name}, Size: ${fileSizeMB}MB`);
  
  if (file.size > maxSize) {
    throw new Error('Размер файла превышает 50MB');
  }
  
  try {
    // Маленькие файлы (<3MB) через FormData
    if (file.size < 3 * 1024 * 1024) {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('fileName', file.name);
      
      const response = await fetch('https://functions.poehali.dev/01922e7e-40ee-4482-9a75-1bf53b8812d9', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        console.error('HTTP', response.status, ':', 'https://functions.poehali.dev/01922e7e-40ee-4482-9a75-1bf53b8812d9');
        throw new Error(`Ошибка загрузки: ${response.status}`);
      }
      
      const result = await response.json();
      console.log(`[Upload] Success! File uploaded to: ${result.url}`);
      return result;
    }
    
    // Большие файлы (>3MB) через presigned S3 URL
    console.log('[Upload] Getting presigned URL...');
    
    const contentType = file.type || 'application/octet-stream';
    const presignedResponse = await fetch(
      `https://functions.poehali.dev/01922e7e-40ee-4482-9a75-1bf53b8812d9?fileName=${encodeURIComponent(file.name)}&contentType=${encodeURIComponent(contentType)}`,
      { method: 'GET' }
    );
    
    if (!presignedResponse.ok) {
      throw new Error(`Не удалось получить presigned URL: ${presignedResponse.status}`);
    }
    
    const { presignedUrl, url, s3Key, fileName } = await presignedResponse.json();
    
    console.log('[Upload] Uploading directly to S3...');
    const uploadResponse = await fetch(presignedUrl, {
      method: 'PUT',
      body: file,
      headers: { 'Content-Type': contentType }
    });
    
    if (!uploadResponse.ok) {
      throw new Error(`S3 upload failed: ${uploadResponse.status}`);
    }
    
    console.log(`[Upload] Success! File uploaded to: ${url}`);
    
    return {
      url,
      s3Key,
      fileName,
      fileSize: file.size
    };
    
  } catch (error) {
    console.error('[Upload] Fetch error:', error instanceof Error ? error.message : 'Unknown', 'for', file.name);
    throw error;
  }
}