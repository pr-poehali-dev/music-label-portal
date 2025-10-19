const UPLOAD_URL = 'https://functions.poehali.dev/08bf9d4e-6ddc-4b6b-91a0-84187cbd89fa';

export interface UploadFileResult {
  url: string;
  fileName: string;
  fileSize: number;
  s3Key?: string;
}

export async function uploadFile(file: File): Promise<UploadFileResult> {
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
          throw new Error(`Upload failed: ${response.status} - ${errorText}`);
        }
        
        const data = await response.json();
        resolve(data);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsDataURL(file);
  });
}
