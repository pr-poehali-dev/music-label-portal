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

  const handleUpload = async () => {
    if (!file) {
      toast({ title: '❌ Выберите файл', variant: 'destructive' });
      return;
    }

    setUploading(true);

    try {
      const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');
      
      const reader = new FileReader();
      reader.onerror = () => {
        toast({
          title: '❌ Ошибка чтения файла',
          description: 'Не удалось прочитать файл',
          variant: 'destructive'
        });
        setUploading(false);
      };

      reader.onload = async (event) => {
        try {
          const result = event.target?.result;
          let base64Content: string;
          
          if (isExcel) {
            const arrayBuffer = result as ArrayBuffer;
            const bytes = new Uint8Array(arrayBuffer);
            let binary = '';
            for (let i = 0; i < bytes.length; i++) {
              binary += String.fromCharCode(bytes[i]);
            }
            base64Content = btoa(binary);
          } else {
            const content = result as string;
            base64Content = btoa(unescape(encodeURIComponent(content)));
          }

          console.log('Sending file to backend:', file.name, 'size:', base64Content.length);

          const response = await fetch('https://functions.poehali.dev/be12d7b5-90f6-4a13-992e-204cd8f0a264', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              file_content: base64Content,
              file_type: isExcel ? 'xlsx' : 'csv',
              file_name: file.name,
              uploaded_by: userId
            })
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
        } catch (err) {
          console.error('Fetch error:', err, 'for', 'https://functions.poehali.dev/be12d7b5-90f6-4a13-992e-204cd8f0a264');
          toast({
            title: '❌ Ошибка отправки',
            description: 'Не удалось отправить файл на сервер. Попробуйте файл меньшего размера.',
            variant: 'destructive'
          });
          setUploading(false);
        }
      };

      if (isExcel) {
        reader.readAsArrayBuffer(file);
      } else {
        reader.readAsText(file);
      }
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
    <Card className="bg-gradient-to-br from-yellow-900/40 to-yellow-800/20 border-yellow-700/30">
      <CardHeader>
        <CardTitle className="text-yellow-100 flex items-center gap-2">
          <Icon name="Upload" size={24} className="text-yellow-400" />
          Загрузка отчётов артистов
        </CardTitle>
        <CardDescription className="text-yellow-300/70">
          Загрузите CSV или Excel файл с данными по стримингу. Система автоматически распределит данные по артистам.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="file-upload" className="text-yellow-100">
            Выберите CSV или XLSX файл
          </Label>
          <div className="flex gap-2">
            <Input
              id="file-upload"
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileChange}
              className="bg-black/20 border-yellow-700/30 text-yellow-100"
            />
            <Button
              type="button"
              onClick={handleUpload}
              disabled={!file || uploading}
              className="bg-yellow-600 hover:bg-yellow-700 text-white"
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
            <p className="text-sm text-yellow-300/70">
              Выбран файл: {file.name} ({(file.size / 1024).toFixed(2)} KB)
            </p>
          )}
        </div>

        {result && (
          <div className="space-y-4">
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
              <h4 className="text-green-400 font-semibold mb-2 flex items-center gap-2">
                <Icon name="CheckCircle" size={20} />
                Результаты загрузки
              </h4>
              <div className="space-y-1 text-sm text-green-300">
                <p>✅ Всего записей: <strong>{result.total_rows}</strong></p>
                <p>📁 Разбито по исполнителям: <strong>{result.artist_files.length}</strong></p>
                <div className="mt-2">
                  <p className="text-yellow-300 mb-1">Исполнители из файла:</p>
                  <ul className="list-disc list-inside text-yellow-200 text-xs max-h-40 overflow-y-auto">
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
          <h4 className="text-blue-400 font-semibold mb-2 flex items-center gap-2">
            <Icon name="Info" size={20} />
            Как работает система?
          </h4>
          <ol className="text-sm text-blue-300 space-y-1 list-decimal list-inside">
            <li>Загрузите общий CSV/XLSX файл со всеми отчётами</li>
            <li>Система автоматически разобьёт файл по исполнителям (из колонки "Исполнитель")</li>
            <li>Выберите нужного исполнителя из выпадающего списка</li>
            <li>Нажмите "Скачать CSV" - файл с данными только этого исполнителя скачается</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
}