import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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

interface Performer {
  username: string;
  full_name: string;
}

interface ProcessReportsProps {
  uploadedReportId?: number;
  onClose?: () => void;
}

export default function ProcessReports({ uploadedReportId, onClose }: ProcessReportsProps) {
  const [files, setFiles] = useState<ArtistFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [deductions, setDeductions] = useState<Record<number, number>>({});

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
        const initialDeductions: Record<number, number> = {};
        data.files.forEach((file: ArtistFile) => {
          initialDeductions[file.id] = file.deduction_percent;
        });
        setDeductions(initialDeductions);
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
      const data = await response.json();

      if (!data.files || !data.files[0] || !data.files[0].data) {
        throw new Error('Нет данных для экспорта');
      }

      const rows = data.files[0].data;
      
      if (rows.length === 0) {
        throw new Error('Отчёт пустой');
      }

      const headers = Object.keys(rows[0]);
      const csvContent = [
        headers.join(','),
        ...rows.map((row: any) => 
          headers.map(header => {
            const value = row[header] ?? '';
            const stringValue = String(value).replace(/"/g, '""');
            return stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('"')
              ? `"${stringValue}"`
              : stringValue;
          }).join(',')
        )
      ].join('\n');

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
    <Card className="bg-gradient-to-br from-black via-yellow-950/20 to-black border-yellow-700/30">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl font-bold text-yellow-100 flex items-center gap-2">
              <Icon name="FileText" size={24} className="text-yellow-400" />
              Обработка отчётов
            </CardTitle>
            <CardDescription className="text-yellow-300/70">
              Выберите исполнителя из списка и скачайте его отчёт в CSV
            </CardDescription>
          </div>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose} className="text-yellow-300 hover:text-yellow-100">
              <Icon name="X" size={20} />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {files.length === 0 ? (
          <div className="text-center py-8 text-yellow-300/50">
            <Icon name="FileQuestion" size={48} className="mx-auto mb-4 opacity-30" />
            <p>Нет файлов для обработки</p>
          </div>
        ) : (
          <div className="space-y-3">
            {files.map((file) => (
              <Card key={file.id} className="bg-black/40 border-yellow-700/20">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Icon name="User" size={16} className="text-yellow-400" />
                        <span className="font-semibold text-yellow-100">{file.artist_full_name}</span>
                        <span className="text-yellow-300/50 text-sm">@{file.artist_username}</span>
                      </div>
                      <div className="text-sm text-yellow-300/70">
                        {file.rows_count} записей
                        {file.sent_at && (
                          <span className="ml-2 text-green-400">
                            • Отправлено {new Date(file.sent_at).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-48">
                        <Label className="text-xs text-yellow-300/70 mb-1 block">Выбрать исполнителя</Label>
                        <Select
                          value={selectedPerformers[file.id] || ''}
                          onValueChange={(value) => selectPerformer(file.id, value)}
                        >
                          <SelectTrigger className="bg-black/30 border-yellow-700/30 text-yellow-100 h-9">
                            <SelectValue placeholder="Выберите..." />
                          </SelectTrigger>
                          <SelectContent>
                            {performers.map((performer) => (
                              <SelectItem key={performer.username} value={performer.username}>
                                {performer.full_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <Button
                        onClick={() => downloadCSV(file)}
                        disabled={!selectedPerformers[file.id]}
                        variant="outline"
                        className="border-yellow-600 text-yellow-300 hover:bg-yellow-600/10 mt-5 disabled:opacity-50"
                      >
                        <Icon name="Download" size={16} className="mr-1" />
                        Скачать CSV
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}