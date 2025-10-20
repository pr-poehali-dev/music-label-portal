import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';
import { toast } from 'sonner';

interface CompleteTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taskId: number;
  taskTitle: string;
  onComplete: (taskId: number, report: string, file?: File) => Promise<boolean>;
}

export default function CompleteTaskDialog({ 
  open, 
  onOpenChange, 
  taskId, 
  taskTitle,
  onComplete 
}: CompleteTaskDialogProps) {
  const [report, setReport] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.size > 10 * 1024 * 1024) {
        toast.error('Файл слишком большой. Максимум 10 МБ');
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    const fileInput = document.getElementById('completion-file') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  const handleSubmit = async () => {
    if (!report.trim()) {
      toast.error('Заполните отчёт о выполнении');
      return;
    }

    setLoading(true);
    try {
      const success = await onComplete(taskId, report.trim(), file || undefined);
      if (success) {
        setReport('');
        setFile(null);
        onOpenChange(false);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon name="CheckCircle" size={24} className="text-green-500" />
            Завершение задачи
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-sm font-medium">{taskTitle}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="completion-report">
              Отчёт о выполнении <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="completion-report"
              placeholder="Опишите, как была решена задача, что было сделано..."
              value={report}
              onChange={(e) => setReport(e.target.value)}
              rows={6}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              {report.length}/1000 символов
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="completion-file">
              Прикрепить файл (необязательно)
            </Label>
            {!file ? (
              <div className="flex items-center gap-2">
                <Input
                  id="completion-file"
                  type="file"
                  onChange={handleFileChange}
                  className="cursor-pointer"
                  accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.zip"
                />
                <p className="text-xs text-muted-foreground whitespace-nowrap">
                  Макс. 10 МБ
                </p>
              </div>
            ) : (
              <div className="flex items-center gap-2 p-3 border rounded-lg bg-accent/50">
                <Icon name="FileCheck" size={20} className="text-green-500" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(file.size / 1024).toFixed(1)} КБ
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleRemoveFile}
                >
                  <Icon name="X" size={16} />
                </Button>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Отмена
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || !report.trim()}
          >
            {loading ? (
              <>
                <Icon name="Loader" size={16} className="mr-2 animate-spin" />
                Завершение...
              </>
            ) : (
              <>
                <Icon name="Check" size={16} className="mr-2" />
                Завершить задачу
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
