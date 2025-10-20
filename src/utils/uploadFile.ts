import { API_ENDPOINTS } from '@/config/api';

const UPLOAD_URL = API_ENDPOINTS.UPLOAD_FILE;

export interface UploadFileResult {
  url: string;
  fileName: string;
  fileSize: number;
  s3Key?: string;
}

export async function uploadFile(file: File): Promise<UploadFileResult> {
  const maxSize = 150 * 1024 * 1024;
  const fileSizeMB = (file.size / 1024 / 1024).toFixed(2);
  
  console.log(`[Upload] File: ${file.name}, Size: ${fileSizeMB}MB`);
  
  if (file.size > maxSize) {
    throw new Error('Размер файла превышает 150MB');
  }
  
  // Используем FormData вместо base64+JSON
  const formData = new FormData();
  formData.append('file', file);
  formData.append('fileName', file.name);
  formData.append('fileSize', String(file.size));
  
  const response = await fetch(UPLOAD_URL, {
    method: 'POST',
    body: formData
    // НЕ устанавливаем Content-Type - браузер сам добавит multipart/form-data с boundary
  });
  
  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error');
    console.error(`[Upload] Failed: ${response.status}`, errorText);
    
    if (response.status === 413) {
      throw new Error(`Файл слишком большой (${fileSizeMB}MB). Максимум 150MB`);
    }
    
    throw new Error(`Ошибка загрузки: ${response.status}`);
  }
  
  const result = await response.json();
  return result;
}
