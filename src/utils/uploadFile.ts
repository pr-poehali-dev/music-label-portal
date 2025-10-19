const UPLOAD_URL = 'https://functions.poehali.dev/08bf9d4e-6ddc-4b6b-91a0-84187cbd89fa';

export interface UploadFileResult {
  url: string;
  fileName: string;
  fileSize: number;
  s3Key?: string;
}

async function uploadLargeFile(file: File): Promise<UploadFileResult> {
  console.log(`Uploading large file: ${file.name}, size: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
  
  // Разбиваем файл на части по 5MB
  const chunkSize = 5 * 1024 * 1024;
  const chunks: Blob[] = [];
  let offset = 0;
  
  while (offset < file.size) {
    chunks.push(file.slice(offset, offset + chunkSize));
    offset += chunkSize;
  }
  
  console.log(`File split into ${chunks.length} chunks`);
  
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
    
    console.log(`Uploading chunk ${i + 1}/${chunks.length}`);
    
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
  console.log(`Successfully uploaded: ${file.name}`);
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
        
        console.log(`Uploading file: ${file.name}, size: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
        
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
          console.error(`Upload failed for ${file.name}:`, response.status, errorText);
          
          if (response.status === 413) {
            throw new Error(`Файл слишком большой. Максимальный размер: 100MB`);
          }
          
          throw new Error(`Ошибка загрузки: ${response.status}`);
        }
        
        const data = await response.json();
        console.log(`Successfully uploaded: ${file.name}`);
        resolve(data);
      } catch (error) {
        console.error(`Error uploading ${file.name}:`, error);
        reject(error);
      }
    };
    
    reader.onerror = () => {
      console.error(`Failed to read file: ${file.name}`);
      reject(new Error('Не удалось прочитать файл'));
    };
    
    reader.readAsDataURL(file);
  });
}