import { API_ENDPOINTS } from '@/config/api';

export interface UploadFileResult {
  url: string;
  fileName: string;
  fileSize: number;
  s3Key?: string;
}

/**
 * Загрузка файла напрямую в S3 через presigned URL
 * Решает проблему таймаутов Cloud Functions
 */
export async function uploadFile(file: File): Promise<UploadFileResult> {
  const maxSize = 150 * 1024 * 1024;
  const fileSizeMB = (file.size / 1024 / 1024).toFixed(2);
  
  console.log(`[Upload] File: ${file.name}, Size: ${fileSizeMB}MB`);
  
  if (file.size > maxSize) {
    throw new Error('Размер файла превышает 150MB');
  }
  
  try {
    // Шаг 1: Получить presigned URL от backend
    const getUrlResponse = await fetch('https://functions.poehali.dev/187d1243-cb1e-47bb-8241-80d59e0aa345', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fileName: file.name,
        contentType: file.type || 'application/octet-stream'
      })
    });
    
    if (!getUrlResponse.ok) {
      const errorText = await getUrlResponse.text().catch(() => 'Unknown');
      console.error(`[Upload] Failed to get presigned URL:`, getUrlResponse.status, errorText);
      throw new Error(`Не удалось получить URL для загрузки: ${getUrlResponse.status}`);
    }
    
    const { uploadUrl, fileUrl, s3Key, fileName } = await getUrlResponse.json();
    
    console.log(`[Upload] Got presigned URL, uploading directly to S3...`);
    
    // Шаг 2: Загрузить файл напрямую в S3 (без cloud function)
    const uploadResponse = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': file.type || 'application/octet-stream'
      },
      body: file
    });
    
    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text().catch(() => 'Unknown');
      console.error(`[Upload] S3 upload failed:`, uploadResponse.status, errorText);
      throw new Error(`Ошибка загрузки в S3: ${uploadResponse.status}`);
    }
    
    console.log(`[Upload] Success! File uploaded to: ${fileUrl}`);
    
    return {
      url: fileUrl,
      fileName: fileName,
      fileSize: file.size,
      s3Key: s3Key
    };
    
  } catch (error) {
    console.error('[Upload] Fetch error:', error instanceof Error ? error.message : 'Unknown', 'for', file.name);
    throw error;
  }
}