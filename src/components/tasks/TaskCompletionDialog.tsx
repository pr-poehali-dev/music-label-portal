import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { useState, useRef } from 'react';
import { X } from 'lucide-react';

interface TaskCompletionDialogProps {
  isOpen: boolean;
  completionReport: string;
  onOpenChange: (open: boolean) => void;
  onReportChange: (report: string) => void;
  onSubmit: (attachmentData?: { url: string; name: string; size: number }) => void;
}

export default function TaskCompletionDialog({
  isOpen,
  completionReport,
  onOpenChange,
  onReportChange,
  onSubmit
}: TaskCompletionDialogProps) {
  const [attachment, setAttachment] = useState<{ url: string; name: string; size: number } | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert('Размер файла не должен превышать 10 МБ');
      return;
    }

    setIsUploading(true);

    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      
      reader.onload = async () => {
        const base64 = reader.result as string;
        
        const response = await fetch('https://functions.poehali.dev/08bf9d4e-6ddc-4b6b-91a0-84187cbd89fa', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            file: base64,
            fileName: file.name,
            fileSize: file.size
          })
        });

        if (!response.ok) {
          throw new Error('Ошибка загрузки файла');
        }

        const data = await response.json();
        setAttachment({
          url: data.url,
          name: data.fileName,
          size: data.fileSize
        });
      };
    } catch (error) {
      console.error('Upload error:', error);
      alert('Не удалось загрузить файл');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveAttachment = () => {
    setAttachment(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = () => {
    onSubmit(attachment || undefined);
    setAttachment(null);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Итоги выполнения задачи</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">
              Опишите результаты выполнения задачи *
            </label>
            <Textarea
              placeholder="Подробно опишите, что было сделано, какие результаты достигнуты..."
              value={completionReport}
              onChange={(e) => onReportChange(e.target.value)}
              className="min-h-[150px]"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Опишите выполненную работу и результаты
            </p>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">
              Прикрепить файл (необязательно)
            </label>
            <div className="space-y-2">
              {!attachment ? (
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="completion-file"
                    disabled={isUploading}
                  />
                  <label htmlFor="completion-file">
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      disabled={isUploading}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Icon name={isUploading ? "Loader2" : "Paperclip"} size={18} className={`mr-2 ${isUploading ? 'animate-spin' : ''}`} />
                      {isUploading ? 'Загрузка...' : 'Выбрать файл'}
                    </Button>
                  </label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Максимальный размер: 10 МБ
                  </p>
                </div>
              ) : (
                <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                  <Icon name="FileText" size={18} className="text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{attachment.name}</p>
                    <p className="text-xs text-muted-foreground">{formatFileSize(attachment.size)}</p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleRemoveAttachment}
                    className="h-8 w-8 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button 
              onClick={handleSubmit} 
              className="flex-1"
              disabled={!completionReport.trim() || isUploading}
            >
              <Icon name="CheckCircle" size={18} className="mr-2" />
              Завершить задачу
            </Button>
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Отмена
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}