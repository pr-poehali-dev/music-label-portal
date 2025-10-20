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
    
    // Большие файлы (>3MB) - разбиваем на chunks по 2MB
    console.log('[Upload] 📦 Large file detected, using chunked upload');
    
    const chunkSize = 2 * 1024 * 1024; // 2MB chunks
    const totalChunks = Math.ceil(file.size / chunkSize);
    console.log(`[Upload] Splitting into ${totalChunks} chunks of ~2MB each`);
    
    const contentType = file.type || 'application/octet-stream';
    let s3Key = '';
    let finalUrl = '';
    
    for (let i = 0; i < totalChunks; i++) {
      const start = i * chunkSize;
      const end = Math.min(start + chunkSize, file.size);
      const chunk = file.slice(start, end);
      
      console.log(`[Upload] 📤 Chunk ${i + 1}/${totalChunks}: ${(chunk.size / 1024 / 1024).toFixed(2)}MB`);
      
      // Convert chunk to base64
      const reader = new FileReader();
      const chunkBase64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(chunk);
      });
      
      // Send chunk to backend
      const response = await fetch('https://functions.poehali.dev/01922e7e-40ee-4482-9a75-1bf53b8812d9', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          file: chunkBase64,
          fileName: file.name,
          contentType,
          chunkIndex: i,
          totalChunks,
          s3Key: i > 0 ? s3Key : undefined
        })
      });
      
      if (!response.ok) {
        throw new Error(`Chunk ${i + 1} upload failed: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (i === 0) {
        s3Key = result.s3Key;
        finalUrl = result.url;
      }
      
      if (i === totalChunks - 1) {
        console.log('[Upload] ✅ All chunks uploaded successfully:', finalUrl);
      }
    }
    
    return {
      url: finalUrl,
      s3Key,
      fileName: file.name,
      fileSize: file.size
    };
    
  } catch (error) {
    console.error('[Upload] Fetch error:', error instanceof Error ? error.message : 'Unknown', 'for', file.name);
    throw error;
  }
}