import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

interface ArtistFile {
  id: number;
  artist_username: string;
  artist_full_name: string;
  deduction_percent: number;
  sent_to_artist_id: number | null;
  sent_at: string | null;
  rows_count: number;
  file_name?: string;
  uploaded_at?: string;
}

interface ProcessReportsProps {
  uploadedReportId?: number;
  onClose?: () => void;
}

export default function ProcessReports({ uploadedReportId, onClose }: ProcessReportsProps) {
  const [files, setFiles] = useState<ArtistFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedArtist, setSelectedArtist] = useState<string>('');
  const { toast } = useToast();

  useEffect(() => {
    loadFiles();
  }, [uploadedReportId]);

  const loadFiles = async () => {
    try {
      const url = uploadedReportId
        ? `https://functions.poehali.dev/be12d7b5-90f6-4a13-992e-204cd8f0a264?uploaded_report_id=${uploadedReportId}`
        : 'https://functions.poehali.dev/be12d7b5-90f6-4a13-992e-204cd8f0a264';

      const response = await fetch(url);
      const data = await response.json();

      if (data.files) {
        setFiles(data.files);
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить файлы отчётов',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const downloadCSV = async (file: ArtistFile) => {
    try {
      const performerName = file.artist_full_name;
      
      toast({
        title: 'Загрузка...',
        description: `Скачиваем отчёт для ${performerName}...`,
      });

      const response = await fetch(`https://functions.poehali.dev/be12d7b5-90f6-4a13-992e-204cd8f0a264?file_id=${file.id}`);
      
      if (!response.ok) {
        throw new Error(`Ошибка ${response.status}`);
      }

      const csvContent = await response.text();

      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `отчет_${performerName.replace(/\s+/g, '_')}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: 'Готово!',
        description: `Отчёт скачан: ${performerName}`,
      });
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: error instanceof Error ? error.message : 'Не удалось скачать',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <Card className="bg-gradient-to-br from-black via-yellow-950/20 to-black border-yellow-700/30">
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Icon name="Loader2" size={24} className="animate-spin text-yellow-400" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-black/60 via-yellow-950/20 to-black/60 border-yellow-500/20 backdrop-blur-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl font-bold text-yellow-400 flex items-center gap-2">
              <Icon name="FileText" size={24} className="text-yellow-500" />
              Отчёты по исполнителям
            </CardTitle>
            <CardDescription className="text-gray-400">
              Скачайте отдельный CSV-файл для каждого исполнителя
            </CardDescription>
          </div>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose} className="text-gray-400 hover:text-yellow-400">
              <Icon name="X" size={20} />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {files.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Icon name="FileQuestion" size={48} className="mx-auto mb-4 opacity-30" />
            <p>Нет файлов для обработки</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <label className="block text-sm font-medium text-yellow-400 mb-2">
                  Выберите исполнителя
                </label>
                <Select value={selectedArtist} onValueChange={setSelectedArtist}>
                  <SelectTrigger className="bg-black/40 border-yellow-500/20 text-yellow-100">
                    <SelectValue placeholder="Выберите исполнителя..." />
                  </SelectTrigger>
                  <SelectContent>
                    {files.map((file) => (
                      <SelectItem key={file.id} value={String(file.id)}>
                        {file.artist_full_name} ({file.rows_count} записей)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={() => {
                  const file = files.find(f => String(f.id) === selectedArtist);
                  if (file) downloadCSV(file);
                }}
                disabled={!selectedArtist}
                className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:shadow-lg hover:shadow-yellow-500/50 text-black font-semibold"
              >
                <Icon name="Download" size={16} className="mr-2" />
                Скачать CSV
              </Button>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-gray-400">Доступные исполнители:</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {files.map((file) => (
                  <Card key={file.id} className="bg-black/40 border-yellow-500/10">
                    <CardContent className="p-3">
                      <div className="flex items-center gap-2">
                        <Icon name="User" size={14} className="text-yellow-500" />
                        <span className="text-sm text-yellow-100">{file.artist_full_name}</span>
                        <span className="text-xs text-gray-500 ml-auto">{file.rows_count} записей</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}