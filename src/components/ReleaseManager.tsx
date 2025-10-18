import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import Icon from '@/components/ui/icon';

const API_URL = 'https://functions.poehali.dev/05d2ddf9-772f-40cb-bcef-0d70fa96e059';
const UPLOAD_URL = 'https://functions.poehali.dev/b71db925-35e3-4b17-8c1a-bb12f7db8f85';

interface Track {
  track_number: number;
  title: string;
  file_url?: string;
  file_name?: string;
  file_size?: number;
  composer: string;
  author_lyrics?: string;
  language_audio: string;
  explicit_content: boolean;
  lyrics_text?: string;
  tiktok_preview_start?: number;
  file?: File;
}

interface Release {
  id: number;
  release_name: string;
  artist_name?: string;
  cover_url?: string;
  release_date?: string;
  preorder_date?: string;
  sales_start_date?: string;
  genre?: string;
  copyright?: string;
  price_category?: string;
  title_language?: string;
  status: string;
  tracks_count?: number;
  created_at: string;
  review_comment?: string;
  reviewer_name?: string;
}

interface ReleaseManagerProps {
  userId: number;
  userRole?: string;
}

const GENRES = ['Pop', 'Rock', 'Hip-Hop', 'Electronic', 'Jazz', 'Classical', 'R&B', 'Country', 'Alternative'];
const LANGUAGES = ['Русский', 'Английский', 'Испанский', 'Французский', 'Немецкий', 'Итальянский', 'Японский', 'Корейский'];

export default function ReleaseManager({ userId, userRole = 'artist' }: ReleaseManagerProps) {
  const [releases, setReleases] = useState<Release[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const { toast } = useToast();

  const [newRelease, setNewRelease] = useState({
    release_name: '',
    release_date: '',
    preorder_date: '',
    sales_start_date: '',
    genre: '',
    copyright: '',
    price_category: '0.99',
    title_language: 'Русский'
  });

  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);

  useEffect(() => {
    loadReleases();
  }, [userId]);

  const loadReleases = async () => {
    try {
      const response = await fetch(API_URL, {
        headers: { 'X-User-Id': userId.toString() }
      });
      const data = await response.json();
      setReleases(data);
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить релизы',
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

  const handleCoverChange = (file: File | null) => {
    setCoverFile(file);
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => setCoverPreview(e.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setCoverPreview(null);
    }
  };

  const addTrack = () => {
    setTracks([...tracks, {
      track_number: tracks.length + 1,
      title: '',
      composer: '',
      language_audio: 'Русский',
      explicit_content: false
    }]);
  };

  const removeTrack = (index: number) => {
    setTracks(tracks.filter((_, i) => i !== index));
  };

  const updateTrack = (index: number, field: keyof Track, value: any) => {
    const updated = [...tracks];
    updated[index] = { ...updated[index], [field]: value };
    setTracks(updated);
  };

  const handleSubmit = async () => {
    if (!newRelease.release_name || !coverFile) {
      toast({
        title: 'Ошибка',
        description: 'Заполните название и загрузите обложку',
        variant: 'destructive'
      });
      return;
    }

    if (tracks.length === 0) {
      toast({
        title: 'Ошибка',
        description: 'Добавьте хотя бы один трек',
        variant: 'destructive'
      });
      return;
    }

    setUploading(true);

    try {
      const coverData = await uploadFile(coverFile);
      if (!coverData) throw new Error('Cover upload failed');

      const uploadedTracks = await Promise.all(
        tracks.map(async (track) => {
          if (!track.file) {
            throw new Error(`Track ${track.track_number} file missing`);
          }
          const trackData = await uploadFile(track.file);
          if (!trackData) throw new Error(`Track ${track.track_number} upload failed`);
          
          return {
            ...track,
            file_url: trackData.url,
            file_name: trackData.fileName,
            file_size: trackData.fileSize,
            file: undefined
          };
        })
      );

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': userId.toString()
        },
        body: JSON.stringify({
          ...newRelease,
          cover_url: coverData.url,
          tracks: uploadedTracks
        })
      });

      if (!response.ok) throw new Error('Failed to create release');

      toast({
        title: 'Успешно',
        description: 'Релиз отправлен на модерацию'
      });

      setShowForm(false);
      setNewRelease({
        release_name: '',
        release_date: '',
        preorder_date: '',
        sales_start_date: '',
        genre: '',
        copyright: '',
        price_category: '0.99',
        title_language: 'Русский'
      });
      setCoverFile(null);
      setCoverPreview(null);
      setTracks([]);
      loadReleases();
    } catch (error: any) {
      toast({
        title: 'Ошибка',
        description: error.message || 'Не удалось создать релиз',
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
        <h2 className="text-2xl font-bold">Мои релизы</h2>
        {userRole === 'artist' && (
          <Button onClick={() => setShowForm(!showForm)}>
            <Icon name={showForm ? 'X' : 'Upload'} size={18} className="mr-2" />
            {showForm ? 'Отменить' : 'Создать релиз'}
          </Button>
        )}
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Новый релиз</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Cover Upload */}
            <div>
              <label className="text-sm font-medium mb-2 block">Обложка альбома *</label>
              <div className="flex items-center gap-4">
                {coverPreview ? (
                  <div className="relative">
                    <img src={coverPreview} alt="Cover" className="w-48 h-48 object-cover rounded-lg border-2 border-yellow-600" />
                    <Button
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => handleCoverChange(null)}
                    >
                      <Icon name="X" size={16} />
                    </Button>
                  </div>
                ) : (
                  <div className="w-48 h-48 border-2 border-dashed border-yellow-600 rounded-lg flex items-center justify-center bg-black/50">
                    <label htmlFor="cover-upload" className="cursor-pointer flex flex-col items-center">
                      <Icon name="Upload" size={32} className="text-yellow-600 mb-2" />
                      <span className="text-sm text-yellow-600">Загрузить обложку</span>
                      <input
                        type="file"
                        id="cover-upload"
                        className="hidden"
                        accept="image/*"
                        onChange={(e) => handleCoverChange(e.target.files?.[0] || null)}
                      />
                    </label>
                  </div>
                )}
              </div>
            </div>

            {/* Release Parameters */}
            <div className="border-t border-yellow-600/30 pt-6">
              <h3 className="text-lg font-semibold text-yellow-600 mb-4">ПАРАМЕТРЫ АЛЬБОМА</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Название альбома *</label>
                  <Input
                    placeholder="Название альбома"
                    value={newRelease.release_name}
                    onChange={(e) => setNewRelease({ ...newRelease, release_name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Дата релиза *</label>
                  <Input
                    type="date"
                    value={newRelease.release_date}
                    onChange={(e) => setNewRelease({ ...newRelease, release_date: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Исполнитель *</label>
                  <Input placeholder="Исполнитель" value={newRelease.copyright} onChange={(e) => setNewRelease({ ...newRelease, copyright: e.target.value })} />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Дата предзаказа</label>
                  <Input
                    type="date"
                    value={newRelease.preorder_date}
                    onChange={(e) => setNewRelease({ ...newRelease, preorder_date: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Жанр *</label>
                  <Select value={newRelease.genre} onValueChange={(value) => setNewRelease({ ...newRelease, genre: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите..." />
                    </SelectTrigger>
                    <SelectContent>
                      {GENRES.map((g) => (
                        <SelectItem key={g} value={g}>{g}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Дата начала продаж</label>
                  <Input
                    type="date"
                    value={newRelease.sales_start_date}
                    onChange={(e) => setNewRelease({ ...newRelease, sales_start_date: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Копирайт *</label>
                  <Input placeholder="Копирайт" value={newRelease.copyright} onChange={(e) => setNewRelease({ ...newRelease, copyright: e.target.value })} />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Ценовая категория</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={newRelease.price_category}
                    onChange={(e) => setNewRelease({ ...newRelease, price_category: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Язык Названия альбома *</label>
                  <Select value={newRelease.title_language} onValueChange={(value) => setNewRelease({ ...newRelease, title_language: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LANGUAGES.map((l) => (
                        <SelectItem key={l} value={l}>{l}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Tracks List */}
            <div className="border-t border-yellow-600/30 pt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-yellow-600">СПИСОК ТРЕКОВ</h3>
                <Button onClick={addTrack} variant="outline" size="sm">
                  <Icon name="Plus" size={16} className="mr-1" />
                  Добавить композицию
                </Button>
              </div>

              {tracks.map((track, index) => (
                <Card key={index} className="mb-4 bg-black/30 border-yellow-600/30">
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-semibold text-yellow-600">#{track.track_number}</span>
                      <Button variant="ghost" size="sm" onClick={() => removeTrack(index)}>
                        <Icon name="Trash2" size={16} />
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs mb-1 block">Название *</label>
                        <Input
                          placeholder="Название трека"
                          value={track.title}
                          onChange={(e) => updateTrack(index, 'title', e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="text-xs mb-1 block">Исполнитель *</label>
                        <Input
                          placeholder="Исполнитель"
                          value={track.composer}
                          onChange={(e) => updateTrack(index, 'composer', e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="text-xs mb-1 block">Композитор</label>
                        <Input
                          placeholder="Композитор"
                          value={track.composer}
                          onChange={(e) => updateTrack(index, 'composer', e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="text-xs mb-1 block">Автор слов</label>
                        <Input
                          placeholder="Автор слов"
                          value={track.author_lyrics || ''}
                          onChange={(e) => updateTrack(index, 'author_lyrics', e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="text-xs mb-1 block">Язык Аудио *</label>
                        <Select value={track.language_audio} onValueChange={(value) => updateTrack(index, 'language_audio', value)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {LANGUAGES.map((l) => (
                              <SelectItem key={l} value={l}>{l}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-xs mb-1 block">Аудио файл * (MP3, WAV, до 50 МБ)</label>
                        <Input
                          type="file"
                          accept=".mp3,.wav,.flac,.m4a"
                          onChange={(e) => updateTrack(index, 'file', e.target.files?.[0])}
                        />
                        {track.file && (
                          <p className="text-xs text-green-600 mt-1">
                            {track.file.name} ({(track.file.size / 1024 / 1024).toFixed(2)} МБ)
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="text-xs mb-1 block">Текст песни</label>
                        <Textarea
                          placeholder="Текст песни..."
                          value={track.lyrics_text || ''}
                          onChange={(e) => updateTrack(index, 'lyrics_text', e.target.value)}
                          rows={2}
                        />
                      </div>
                      <div>
                        <label className="text-xs mb-1 block">TikTok превью (сек.)</label>
                        <Input
                          type="number"
                          placeholder="0"
                          value={track.tiktok_preview_start || ''}
                          onChange={(e) => updateTrack(index, 'tiktok_preview_start', parseInt(e.target.value) || 0)}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {tracks.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  Добавьте треки для релиза
                </div>
              )}
            </div>

            <Button onClick={handleSubmit} disabled={uploading} className="w-full" size="lg">
              <Icon name={uploading ? 'Loader2' : 'Send'} size={18} className={`mr-2 ${uploading ? 'animate-spin' : ''}`} />
              {uploading ? 'Загрузка...' : 'Отправить на модерацию'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Releases List */}
      <div className="grid gap-4">
        {releases.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Icon name="Music" size={48} className="text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Релизов пока нет</p>
            </CardContent>
          </Card>
        ) : (
          releases.map((release) => (
            <Card key={release.id}>
              <CardContent className="pt-6">
                <div className="flex gap-4">
                  {release.cover_url && (
                    <img src={release.cover_url} alt={release.release_name} className="w-32 h-32 object-cover rounded-lg" />
                  )}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="text-xl font-semibold">{release.release_name}</h3>
                        {release.genre && <p className="text-sm text-muted-foreground">{release.genre}</p>}
                      </div>
                      {getStatusBadge(release.status)}
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      {release.release_date && (
                        <p>Дата релиза: {new Date(release.release_date).toLocaleDateString('ru-RU')}</p>
                      )}
                      {release.tracks_count !== undefined && (
                        <p>Треков: {release.tracks_count}</p>
                      )}
                    </div>
                    {release.status === 'rejected' && release.review_comment && (
                      <div className="mt-3 p-3 bg-destructive/10 rounded-md">
                        <p className="text-sm font-medium text-destructive mb-1">Причина отклонения:</p>
                        <p className="text-sm text-muted-foreground">{release.review_comment}</p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
