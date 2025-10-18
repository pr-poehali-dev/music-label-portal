import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import ProcessReports from './ProcessReports';

interface ReportsUploaderProps {
  userId: number;
}

export default function ReportsUploader({ userId }: ReportsUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setResult(null);
    }
  };

  const handleUpload = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (!file) {
      toast({ title: '❌ Выберите файл', variant: 'destructive' });
      return;
    }

    setUploading(true);

    try {
      toast({
        title: '⏳ Загрузка файла...',
        description: 'Обработка может занять до 60 секунд для больших файлов'
      });

      const formData = new FormData();
      formData.append('file', file);
      formData.append('uploaded_by', String(userId));

      const response = await fetch('https://functions.poehali.dev/be12d7b5-90f6-4a13-992e-204cd8f0a264', {
        method: 'POST',
        body: formData,
        signal: AbortSignal.timeout(120000)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        setResult(data);
        toast({
          title: '✅ Файл разбит по артистам',
          description: `Создано ${data.artist_files.length} файлов для артистов`
        });
      } else {
        toast({
          title: '❌ Ошибка загрузки',
          description: data.error || 'Неизвестная ошибка',
          variant: 'destructive'
        });
      }

      setUploading(false);
    } catch (error) {
      toast({
        title: '❌ Ошибка',
        description: 'Не удалось загрузить файл',
        variant: 'destructive'
      });
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Icon name="Upload" size={32} className="text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Загрузка отчётов артистов</h1>
          <p className="text-muted-foreground">Загрузите CSV или Excel файл с данными по стримингу</p>
        </div>
      </div>
      <Card>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Выберите CSV или XLSX файл
            </Label>
            <div className="flex gap-2">
              <Input
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileChange}
              />
              <Button
                type="button"
                onClick={handleUpload}
                disabled={!file || uploading}
              >
                {uploading ? (
                  <>
                    <Icon name="Loader2" size={18} className="mr-2 animate-spin" />
                    Загрузка...
                  </>
                ) : (
                  <>
                    <Icon name="Upload" size={18} className="mr-2" />
                    Загрузить
                  </>
                )}
              </Button>
            </div>
            {file && (
              <p className="text-sm text-muted-foreground">
                Выбран файл: {file.name} ({(file.size / 1024).toFixed(2)} KB)
              </p>
            )}
        </div>

          {result && (
            <div className="space-y-4">
              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                <h4 className="font-semibold mb-2 flex items-center gap-2 text-green-600">
                  <Icon name="CheckCircle" size={20} />
                  Результаты загрузки
                </h4>
                <div className="space-y-1 text-sm">
                  <p>✅ Всего записей: <strong>{result.total_rows}</strong></p>
                  <p>📁 Разбито по исполнителям: <strong>{result.artist_files.length}</strong></p>
                  <div className="mt-2">
                    <p className="font-medium mb-1">Исполнители из файла:</p>
                    <ul className="list-disc list-inside text-xs max-h-40 overflow-y-auto">
                      {result.artist_files.map((af: any, idx: number) => (
                        <li key={idx}>{af.artist_full_name} ({af.rows_count} записей)</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
              {result.artist_files.length > 0 && <ProcessReports uploadedReportId={result.uploaded_report_id} />}
            </div>
          )}

          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
            <h4 className="font-semibold mb-2 flex items-center gap-2 text-blue-600">
              <Icon name="Info" size={20} />
              Как работает система?
            </h4>
            <ol className="text-sm space-y-1 list-decimal list-inside">
              <li>Загрузите общий CSV/XLSX файл со всеми отчётами</li>
              <li>Система автоматически разобьёт файл по исполнителям (из колонки "Исполнитель")</li>
              <li>Выберите нужного исполнителя из выпадающего списка</li>
              <li>Нажмите "Скачать CSV" - файл с данными только этого исполнителя скачается</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}