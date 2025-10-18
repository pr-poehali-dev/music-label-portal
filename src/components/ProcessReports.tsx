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

interface ProcessReportsProps {
  uploadedReportId?: number;
  onClose?: () => void;
}

export default function ProcessReports({ uploadedReportId, onClose }: ProcessReportsProps) {
  const [files, setFiles] = useState<ArtistFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [deductions, setDeductions] = useState<Record<number, number>>({});
  const [artists, setArtists] = useState<Array<{ id: number; full_name: string; username: string }>>([]);
  const [selectedArtists, setSelectedArtists] = useState<Record<number, number>>({});
  const { toast } = useToast();

  useEffect(() => {
    loadFiles();
    loadArtists();
  }, [uploadedReportId]);

  const loadArtists = async () => {
    try {
      const response = await fetch('https://functions.poehali.dev/fc27959a-c6bb-4c65-87c6-1eec8cc0a86f?role=artist');
      const data = await response.json();
      if (data.users) {
        setArtists(data.users);
      }
    } catch (error) {
      console.error('Ошибка загрузки артистов:', error);
    }
  };

  const assignArtistToReport = async (fileId: number, artistId: number) => {
    try {
      const response = await fetch('https://functions.poehali.dev/be12d7b5-90f6-4a13-992e-204cd8f0a264', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          file_id: fileId,
          artist_id: artistId,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSelectedArtists({ ...selectedArtists, [fileId]: artistId });
        toast({
          title: 'Привязано',
          description: 'Отчёт привязан к артисту',
        });
        loadFiles();
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось привязать отчёт',
        variant: 'destructive',
      });
    }
  };

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

  const updateDeduction = async (fileId: number, percent: number) => {
    try {
      const response = await fetch('https://functions.poehali.dev/be12d7b5-90f6-4a13-992e-204cd8f0a264', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          file_id: fileId,
          deduction_percent: percent,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setDeductions({ ...deductions, [fileId]: percent });
        toast({
          title: 'Сохранено',
          description: 'Процент удержания обновлён',
        });
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось сохранить процент',
        variant: 'destructive',
      });
    }
  };

  const downloadCSV = async (file: ArtistFile) => {
    try {
      toast({
        title: 'Загрузка...',
        description: `Скачиваем отчёт для ${file.artist_full_name}...`,
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
      a.download = `отчет_${file.artist_full_name.replace(/\s+/g, '_')}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: 'Готово!',
        description: `Отчёт скачан: ${file.artist_full_name}`,
      });
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: error instanceof Error ? error.message : 'Не удалось скачать',
        variant: 'destructive',
      });
    }
  };

  const exportAndSend = async (file: ArtistFile) => {
    try {
      if (!file.sent_to_artist_id) {
        toast({
          title: 'Ошибка',
          description: 'Сначала привяжите отчёт к артисту',
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Экспорт начат',
        description: `Подготовка отчёта для ${file.artist_full_name}...`,
      });

      const response = await fetch('https://functions.poehali.dev/4c11f3e5-93f5-42fb-862e-9fbcd9ce7825', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          file_id: file.id,
          artist_id: file.sent_to_artist_id,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Ошибка экспорта');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `report_${file.artist_username}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: 'Готово!',
        description: 'PDF скачан и отправлен в ЛК артиста',
      });

      loadFiles();
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: error instanceof Error ? error.message : 'Не удалось экспортировать',
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
              Привяжите отчёт к артисту, установите % вычета и экспортируйте PDF
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
                        <Label className="text-xs text-yellow-300/70 mb-1 block">Привязать к артисту</Label>
                        <Select
                          value={file.sent_to_artist_id?.toString() || ''}
                          onValueChange={(value) => assignArtistToReport(file.id, parseInt(value))}
                          disabled={!!file.sent_at}
                        >
                          <SelectTrigger className="bg-black/30 border-yellow-700/30 text-yellow-100 h-9">
                            <SelectValue placeholder="Выберите..." />
                          </SelectTrigger>
                          <SelectContent>
                            {artists.map((artist) => (
                              <SelectItem key={artist.id} value={artist.id.toString()}>
                                {artist.full_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="w-32">
                        <Label className="text-xs text-yellow-300/70 mb-1 block">% вычета</Label>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          step="0.1"
                          value={deductions[file.id] || 0}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value) || 0;
                            setDeductions({ ...deductions, [file.id]: value });
                          }}
                          onBlur={(e) => {
                            const value = parseFloat(e.target.value) || 0;
                            updateDeduction(file.id, value);
                          }}
                          className="bg-black/30 border-yellow-700/30 text-yellow-100 text-center h-9"
                          disabled={!!file.sent_at}
                        />
                      </div>

                      <div className="flex gap-2 mt-5">
                        <Button
                          onClick={() => downloadCSV(file)}
                          variant="outline"
                          className="border-yellow-600 text-yellow-300 hover:bg-yellow-600/10"
                        >
                          <Icon name="Download" size={16} className="mr-1" />
                          CSV
                        </Button>
                        <Button
                          onClick={() => exportAndSend(file)}
                          disabled={!!file.sent_at || !file.sent_to_artist_id}
                          className="bg-yellow-600 hover:bg-yellow-700 text-black font-semibold disabled:opacity-50"
                          title={!file.sent_to_artist_id ? 'Сначала привяжите к артисту' : ''}
                        >
                          <Icon name="Send" size={16} className="mr-1" />
                          {file.sent_at ? 'Отправлено' : 'PDF + ЛК'}
                        </Button>
                      </div>
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