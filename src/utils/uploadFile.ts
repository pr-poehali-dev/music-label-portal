import { API_ENDPOINTS } from '@/config/api';

const UPLOAD_URL = API_ENDPOINTS.UPLOAD_FILE;

export interface UploadFileResult {
  url: string;
  fileName: string;
  fileSize: number;
  s3Key?: string;
}

async function uploadLargeFile(file: File): Promise<UploadFileResult> {
  const chunkSize = 1.5 * 1024 * 1024; // 1.5MB chunks -> ~2MB в base64 (безопасно для 3.5MB лимита)
  const chunks: Blob[] = [];
  let offset = 0;
  
  while (offset < file.size) {
    chunks.push(file.slice(offset, offset + chunkSize));
    offset += chunkSize;
  }
  
  // Загружаем каждую часть
  const uploadedChunks: string[] = [];
  
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const base64Chunk = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(chunk);
    });
    
    const response = await fetch(UPLOAD_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        file: base64Chunk,
        fileName: `${file.name}.part${i}`,
        fileSize: chunk.size,
        isChunk: true,
        chunkIndex: i,
        totalChunks: chunks.length,
        originalFileName: file.name
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      console.error(`[Upload] Chunk ${i + 1}/${chunks.length} failed:`, response.status, errorText);
      
      if (response.status === 413) {
        throw new Error(`Файл слишком большой. Попробуйте сжать WAV или конвертировать в MP3`);
      }
      
      throw new Error(`Ошибка загрузки части ${i + 1}/${chunks.length}`);
    }
    
    console.log(`[Upload] Chunk ${i + 1}/${chunks.length} uploaded successfully`);
    
    const data = await response.json();
    // Сохраняем только короткий ID вместо полного s3Key
    const shortKey = data.s3Key.split('/').pop(); // Только имя файла
    uploadedChunks.push(shortKey);
  }
  
  // Объединяем части на сервере
  console.log(`[Upload] Merging ${uploadedChunks.length} chunks...`);
  
  const mergeResponse = await fetch(UPLOAD_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      action: 'merge',
      chunks: uploadedChunks,
      fileName: file.name,
      fileSize: file.size
    })
  });
  
  console.log(`[Upload] Merge response status: ${mergeResponse.status}`);
  
  if (!mergeResponse.ok) {
    throw new Error('Failed to merge file chunks');
  }
  
  const result = await mergeResponse.json();
  return result;
}

export async function uploadFile(file: File): Promise<UploadFileResult> {
  const maxSize = 150 * 1024 * 1024; // Увеличили до 150MB
  const fileSizeMB = (file.size / 1024 / 1024).toFixed(2);
  
  console.log(`[Upload] File: ${file.name}, Size: ${fileSizeMB}MB`);
  
  if (file.size > maxSize) {
    throw new Error('Размер файла превышает 150MB');
  }
  
  // Для файлов больше 4MB используем chunked upload
  if (file.size > 4 * 1024 * 1024) {
    console.log(`[Upload] Using chunked upload for ${file.name} (${fileSizeMB}MB)`);
    return uploadLargeFile(file);
  }
  
  console.log(`[Upload] Using direct upload for ${file.name} (${fileSizeMB}MB)`);

  try {
    const base64Data = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Не удалось прочитать файл'));
      reader.readAsDataURL(file);
    });
    
    const response = await fetch(UPLOAD_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        file: base64Data,
        fileName: file.name,
        fileSize: file.size
      })
    });
    
    if (!response.ok) {
      if (response.status === 413) {
        throw new Error(`Файл слишком большой для прямой загрузки`);
      }
      
      throw new Error(`Ошибка загрузки: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    throw error;
  }
}