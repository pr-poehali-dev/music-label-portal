import { API_ENDPOINTS } from '@/config/api';

const UPLOAD_URL = API_ENDPOINTS.UPLOAD_FILE;

export interface UploadFileResult {
  url: string;
  fileName: string;
  fileSize: number;
  s3Key?: string;
}

async function uploadInChunks(file: File): Promise<UploadFileResult> {
  // 1MB chunks через FormData (безопасно для 3.5MB лимита)
  const chunkSize = 1 * 1024 * 1024;
  const totalChunks = Math.ceil(file.size / chunkSize);
  
  console.log(`[Upload] Uploading ${file.name} in ${totalChunks} chunks`);
  
  const uploadedChunks: string[] = [];
  
  for (let i = 0; i < totalChunks; i++) {
    const start = i * chunkSize;
    const end = Math.min(start + chunkSize, file.size);
    const chunk = file.slice(start, end);
    
    const formData = new FormData();
    formData.append('file', chunk);
    formData.append('fileName', `${file.name}.part${i}`);
    formData.append('fileSize', String(chunk.size));
    formData.append('isChunk', 'true');
    
    const response = await fetch(UPLOAD_URL, {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown');
      console.error(`[Upload] Chunk ${i+1}/${totalChunks} failed:`, response.status, errorText);
      throw new Error(`Ошибка загрузки части ${i+1}/${totalChunks}`);
    }
    
    const data = await response.json();
    const shortKey = data.s3Key.split('/').pop();
    uploadedChunks.push(shortKey);
    
    console.log(`[Upload] Chunk ${i+1}/${totalChunks} uploaded`);
  }
  
  // Merge chunks
  console.log(`[Upload] Merging ${uploadedChunks.length} chunks...`);
  
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60000); // 60 секунд на merge
  
  try {
    const mergeResponse = await fetch(UPLOAD_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'merge',
        chunks: uploadedChunks,
        fileName: file.name,
        fileSize: file.size
      }),
      signal: controller.signal
    });
    
    clearTimeout(timeout);
    
    if (!mergeResponse.ok) {
      throw new Error('Не удалось объединить файл');
    }
    
    return await mergeResponse.json();
  } catch (error) {
    clearTimeout(timeout);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Таймаут при склеивании файла. Попробуйте ещё раз.');
    }
    throw error;
  }
}

export async function uploadFile(file: File): Promise<UploadFileResult> {
  const maxSize = 150 * 1024 * 1024;
  const fileSizeMB = (file.size / 1024 / 1024).toFixed(2);
  
  console.log(`[Upload] File: ${file.name}, Size: ${fileSizeMB}MB`);
  
  if (file.size > maxSize) {
    throw new Error('Размер файла превышает 150MB');
  }
  
  // Файлы > 2MB загружаем по частям
  if (file.size > 2 * 1024 * 1024) {
    return uploadInChunks(file);
  }
  
  // Маленькие файлы загружаем целиком
  const formData = new FormData();
  formData.append('file', file);
  formData.append('fileName', file.name);
  formData.append('fileSize', String(file.size));
  
  const response = await fetch(UPLOAD_URL, {
    method: 'POST',
    body: formData
  });
  
  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    console.error(`[Upload] Failed: ${response.status}`, errorText);
    throw new Error(`Ошибка загрузки: ${response.status}`);
  }
  
  return await response.json();
}