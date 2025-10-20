import { API_ENDPOINTS } from '@/config/api';

const UPLOAD_URL = API_ENDPOINTS.UPLOAD_FILE;

export interface UploadFileResult {
  url: string;
  fileName: string;
  fileSize: number;
  s3Key?: string;
}

async function uploadLargeFile(file: File): Promise<UploadFileResult> {
  const chunkSize = 5 * 1024 * 1024;
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
      throw new Error(`Failed to upload chunk ${i + 1}`);
    }
    
    const data = await response.json();
    uploadedChunks.push(data.s3Key);
  }
  
  // Объединяем части на сервере
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
  
  if (!mergeResponse.ok) {
    throw new Error('Failed to merge file chunks');
  }
  
  const result = await mergeResponse.json();
  return result;
}

export async function uploadFile(file: File): Promise<UploadFileResult> {
  const maxSize = 100 * 1024 * 1024;
  
  if (file.size > maxSize) {
    throw new Error('Размер файла превышает 100MB');
  }
  
  // Для файлов больше 10MB используем chunked upload
  if (file.size > 10 * 1024 * 1024) {
    return uploadLargeFile(file);
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onloadend = async () => {
      try {
        const base64Data = reader.result as string;
        
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
          const errorText = await response.text();
          
          if (response.status === 413) {
            throw new Error(`Файл слишком большой. Максимальный размер: 100MB`);
          }
          
          throw new Error(`Ошибка загрузки: ${response.status}`);
        }
        
        const data = await response.json();
        resolve(data);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Не удалось прочитать файл'));
    };
    
    reader.readAsDataURL(file);
  });
}