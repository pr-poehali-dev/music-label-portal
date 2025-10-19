const UPLOAD_URL = 'https://functions.poehali.dev/08bf9d4e-6ddc-4b6b-91a0-84187cbd89fa';

export interface UploadFileResult {
  url: string;
  fileName: string;
  fileSize: number;
  s3Key?: string;
}

export async function uploadFile(file: File): Promise<UploadFileResult> {
  const maxSize = 50 * 1024 * 1024;
  
  if (file.size > maxSize) {
    throw new Error('Размер файла превышает 50MB');
  }
  
  // WAV файлы в base64 увеличиваются на ~33%, поэтому реальный лимит для WAV ~15MB
  const isWav = file.name.toLowerCase().endsWith('.wav');
  const wavLimit = 15 * 1024 * 1024;
  
  if (isWav && file.size > wavLimit) {
    throw new Error(`WAV файлы больше 15MB не поддерживаются. Конвертируйте в MP3 или используйте файл меньшего размера. Текущий размер: ${(file.size / 1024 / 1024).toFixed(1)}MB`);
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
            throw new Error(`Файл слишком большой для загрузки. Конвертируйте WAV в MP3 или используйте меньший файл`);
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