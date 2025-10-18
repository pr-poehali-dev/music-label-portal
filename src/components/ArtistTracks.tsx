import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import Icon from '@/components/ui/icon';

const API_URL = 'https://functions.poehali.dev/637ff9a3-72ab-4285-b752-eb913b065f69';
const UPLOAD_URL = 'https://functions.poehali.dev/b71db925-35e3-4b17-8c1a-bb12f7db8f85';

interface Track {
  id: number;
  title: string;
  file_url: string;
  file_name: string;
  file_size: number;
  duration?: number;
  description?: string;
  genre?: string;
  status: string;
  uploaded_at: string;
  reviewed_at?: string;
  reviewer_name?: string;
  review_comment?: string;
}

interface ArtistTracksProps {
  userId: number;
}

export default function ArtistTracks({ userId }: ArtistTracksProps) {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const { toast } = useToast();

  const [newTrack, setNewTrack] = useState({
    title: '',
    description: '',
    genre: ''
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    loadTracks();
  }, [userId]);

  const loadTracks = async () => {
    try {
      const response = await fetch(API_URL, {
        headers: { 'X-User-Id': userId.toString() }
      });
      const data = await response.json();
      setTracks(data);
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить треки',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const uploadFile = async (file: File): Promise<{ url: string; fileName: string; fileSize: number } | null> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const base64 = e.target?.result as string;
          const response = await fetch(UPLOAD_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              file: base64,
              fileName: file.name,
              fileSize: file.size
            })
          });

          if (!response.ok) {
            resolve(null);
            return;
          }

          const result = await response.json();
          resolve({
            url: result.url,
            fileName: result.fileName,
            fileSize: result.fileSize
          });
        } catch (error) {
          resolve(null);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleUpload = async () => {
    if (!newTrack.title || !selectedFile) {
      toast({
        title: 'Ошибка',
        description: 'Заполните название и выберите файл',
        variant: 'destructive'
      });
      return;
    }

    if (!selectedFile.name.match(/\.(mp3|wav|flac|m4a)$/i)) {
      toast({
        title: 'Ошибка',
        description: 'Поддерживаются только аудио файлы (MP3, WAV, FLAC, M4A)',
        variant: 'destructive'
      });
      return;
    }

    if (selectedFile.size > 50 * 1024 * 1024) {
      toast({
        title: 'Ошибка',
        description: 'Размер файла не должен превышать 50 МБ',
        variant: 'destructive'
      });
      return;
    }

    setUploading(true);

    try {
      const fileData = await uploadFile(selectedFile);
      if (!fileData) {
        throw new Error('Upload failed');
      }

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': userId.toString()
        },
        body: JSON.stringify({
          title: newTrack.title,
          file_url: fileData.url,
          file_name: fileData.fileName,
          file_size: fileData.fileSize,
          description: newTrack.description,
          genre: newTrack.genre
        })
      });

      if (!response.ok) {
        throw new Error('Failed to upload track');
      }

      toast({
        title: 'Успешно',
        description: 'Трек отправлен на модерацию'
      });

      setNewTrack({ title: '', description: '', genre: '' });
      setSelectedFile(null);
      setShowForm(false);
      loadTracks();
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить трек',
        variant: 'destructive'
      });
    } finally {
      setUploading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; text: string; icon: string }> = {
      pending: { variant: 'secondary', text: 'На модерации', icon: 'Clock' },
      approved: { variant: 'default', text: 'Одобрен', icon: 'CheckCircle' },
      rejected: { variant: 'destructive', text: 'Отклонён', icon: 'XCircle' }
    };
    const config = variants[status] || variants.pending;
    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon name={config.icon} size={12} />
        {config.text}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Icon name="Loader2" className="animate-spin" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Мои треки</h2>
        <Button onClick={() => setShowForm(!showForm)}>
          <Icon name={showForm ? 'X' : 'Upload'} size={18} className="mr-2" />
          {showForm ? 'Отменить' : 'Загрузить трек'}
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Загрузить новый трек</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Название трека *</label>
              <Input
                placeholder="Моя новая песня"
                value={newTrack.title}
                onChange={(e) => setNewTrack({ ...newTrack, title: e.target.value })}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Жанр</label>
              <Input
                placeholder="Pop, Rock, Hip-Hop..."
                value={newTrack.genre}
                onChange={(e) => setNewTrack({ ...newTrack, genre: e.target.value })}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Описание</label>
              <Textarea
                placeholder="Расскажите о треке..."
                value={newTrack.description}
                onChange={(e) => setNewTrack({ ...newTrack, description: e.target.value })}
                className="min-h-[100px]"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Аудио файл * (MP3, WAV, FLAC, M4A, до 50 МБ)</label>
              <div className="relative">
                <Input
                  type="file"
                  id="track-upload"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="hidden"
                  accept=".mp3,.wav,.flac,.m4a"
                />
                <label
                  htmlFor="track-upload"
                  className="flex items-center justify-center gap-2 px-4 py-2 border rounded-md cursor-pointer hover:bg-accent transition-colors"
                >
                  <Icon name="Music" size={18} className="text-primary" />
                  <span className="text-sm">
                    {selectedFile ? selectedFile.name : 'Выбрать аудио файл'}
                  </span>
                </label>
              </div>
              {selectedFile && (
                <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                  <Icon name="CheckCircle" size={12} />
                  Файл выбран: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} МБ)
                </p>
              )}
            </div>

            <Button onClick={handleUpload} disabled={uploading} className="w-full">
              <Icon name={uploading ? 'Loader2' : 'Upload'} size={18} className={`mr-2 ${uploading ? 'animate-spin' : ''}`} />
              {uploading ? 'Загрузка...' : 'Загрузить трек'}
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {tracks.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Icon name="Music" size={48} className="text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Вы ещё не загрузили ни одного трека</p>
            </CardContent>
          </Card>
        ) : (
          tracks.map((track) => (
            <Card key={track.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold">{track.title}</h3>
                    {track.genre && (
                      <p className="text-sm text-muted-foreground">{track.genre}</p>
                    )}
                  </div>
                  {getStatusBadge(track.status)}
                </div>

                {track.description && (
                  <p className="text-sm text-muted-foreground mb-3">{track.description}</p>
                )}

                <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                  <span className="flex items-center gap-1">
                    <Icon name="File" size={12} />
                    {track.file_name}
                  </span>
                  <span className="flex items-center gap-1">
                    <Icon name="HardDrive" size={12} />
                    {(track.file_size / 1024 / 1024).toFixed(2)} МБ
                  </span>
                  <span className="flex items-center gap-1">
                    <Icon name="Calendar" size={12} />
                    {new Date(track.uploaded_at).toLocaleDateString('ru-RU')}
                  </span>
                </div>

                {track.status === 'rejected' && track.review_comment && (
                  <div className="mt-3 p-3 bg-destructive/10 rounded-md">
                    <p className="text-sm font-medium text-destructive mb-1">Причина отклонения:</p>
                    <p className="text-sm text-muted-foreground">{track.review_comment}</p>
                  </div>
                )}

                {track.status === 'approved' && track.review_comment && (
                  <div className="mt-3 p-3 bg-green-50 dark:bg-green-950 rounded-md">
                    <p className="text-sm font-medium text-green-700 dark:text-green-400 mb-1">Комментарий:</p>
                    <p className="text-sm text-muted-foreground">{track.review_comment}</p>
                  </div>
                )}

                <audio controls className="w-full mt-3">
                  <source src={track.file_url} />
                  Ваш браузер не поддерживает аудио плеер
                </audio>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
