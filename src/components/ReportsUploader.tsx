import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

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
      const reader = new FileReader();
      reader.onload = async (event) => {
        const content = event.target?.result as string;
        const base64Content = btoa(unescape(encodeURIComponent(content)));

        const response = await fetch('https://functions.poehali.dev/be12d7b5-90f6-4a13-992e-204cd8f0a264', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            file_content: base64Content,
            file_type: 'csv',
            uploaded_by: userId
          })
        });

        const data = await response.json();

        if (response.ok && data.success) {
          setResult(data);
          toast({
            title: '✅ Отчёт загружен',
            description: `Обработано: ${data.inserted} записей, пропущено: ${data.skipped}`
          });
        } else {
          toast({
            title: '❌ Ошибка загрузки',
            description: data.error || 'Неизвестная ошибка',
            variant: 'destructive'
          });
        }

        setUploading(false);
      };

      reader.readAsText(file);
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
          Загрузите CSV-файл с данными по стримингу. Система автоматически распределит данные по артистам.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="file-upload" className="text-yellow-100">
            Выберите CSV файл
          </Label>
          <div className="flex gap-2">
            <Input
              id="file-upload"
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="bg-black/20 border-yellow-700/30 text-yellow-100"
            />
            <Button
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
          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
            <h4 className="text-green-400 font-semibold mb-2 flex items-center gap-2">
              <Icon name="CheckCircle" size={20} />
              Результаты загрузки
            </h4>
            <div className="space-y-1 text-sm text-green-300">
              <p>✅ Обработано записей: <strong>{result.inserted}</strong></p>
              <p>⚠️ Пропущено записей: <strong>{result.skipped}</strong></p>
              {result.errors && result.errors.length > 0 && (
                <div className="mt-2">
                  <p className="text-yellow-400">⚠️ Ошибки:</p>
                  <ul className="list-disc list-inside text-yellow-300 text-xs mt-1">
                    {result.errors.map((err: string, idx: number) => (
                      <li key={idx}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
          <h4 className="text-blue-400 font-semibold mb-2 flex items-center gap-2">
            <Icon name="Info" size={20} />
            Формат файла
          </h4>
          <ul className="text-sm text-blue-300 space-y-1 list-disc list-inside">
            <li>CSV файл с заголовками</li>
            <li>Колонка "Название альбома" должна содержать username артиста</li>
            <li>Обязательные поля: Период использования, Площадка, Количество</li>
            <li>Данные автоматически привязываются к артистам по username в названии альбома</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
