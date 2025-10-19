import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { useState, useRef, useCallback } from 'react';
import { X } from 'lucide-react';
import { uploadFile } from '@/utils/uploadFile';

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

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert('Размер файла не должен превышать 10 МБ');
      return;
    }

    setIsUploading(true);

    try {
      const result = await uploadFile(file);
      setAttachment({
        url: result.url,
        name: result.fileName,
        size: result.fileSize
      });
    } catch (error) {
      console.error('Upload error:', error);
      alert('Не удалось загрузить файл');
    } finally {
      setIsUploading(false);
    }
  }, []);

  const handleRemoveAttachment = useCallback(() => {
    setAttachment(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const handleSubmit = useCallback(() => {
    onSubmit(attachment || undefined);
    setAttachment(null);
  }, [attachment, onSubmit]);

  const formatFileSize = useCallback((bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }, []);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-full sm:max-w-2xl mx-4">
        <DialogHeader>
          <DialogTitle className="text-base sm:text-lg">Итоги выполнения задачи</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-3 sm:space-y-4">
          <div>
            <label className="text-xs sm:text-sm font-medium mb-2 block">
              Опишите результаты выполнения задачи *
            </label>
            <Textarea
              placeholder="Подробно опишите, что было сделано, какие результаты достигнуты..."
              value={completionReport}
              onChange={(e) => onReportChange(e.target.value)}
              className="min-h-[120px] sm:min-h-[150px] text-sm"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Опишите выполненную работу и результаты
            </p>
          </div>

          <div>
            <label className="text-xs sm:text-sm font-medium mb-2 block">
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
                      className="w-full min-h-[44px] text-sm"
                      disabled={isUploading}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Icon name={isUploading ? "Loader2" : "Paperclip"} size={16} className={`mr-2 ${isUploading ? 'animate-spin' : ''}`} />
                      {isUploading ? 'Загрузка...' : 'Выбрать файл'}
                    </Button>
                  </label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Максимальный размер: 10 МБ
                  </p>
                </div>
              ) : (
                <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                  <Icon name="FileText" size={16} className="text-muted-foreground flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-medium truncate">{attachment.name}</p>
                    <p className="text-xs text-muted-foreground">{formatFileSize(attachment.size)}</p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleRemoveAttachment}
                    className="h-10 w-10 sm:h-8 sm:w-8 p-0 flex-shrink-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 pt-4">
            <Button 
              onClick={handleSubmit} 
              className="flex-1 min-h-[44px] text-sm sm:text-base"
              disabled={!completionReport.trim() || isUploading}
            >
              <Icon name="CheckCircle" size={16} className="mr-2" />
              Завершить задачу
            </Button>
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1 min-h-[44px] text-sm sm:text-base">
              Отмена
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}