import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import Icon from '@/components/ui/icon';

const API_URL = 'https://functions.poehali.dev/da292f4e-1263-4ad9-878e-0349a94d0480';

interface Pitching {
  id: number;
  release_id: number;
  user_id?: number;
  artist_name: string;
  release_name: string;
  release_date: string;
  genre: string;
  artist_description: string;
  release_description: string;
  playlist_fit: string;
  current_reach: string;
  preview_link: string;
  artist_photos: string[];
  status: string;
  created_at: string;
  user_full_name?: string;
}

interface PitchingManagementProps {
  userId: number;
  userRole?: string;
}

export default function PitchingManagement({ userId, userRole = 'manager' }: PitchingManagementProps) {
  const [pitchings, setPitchings] = useState<Pitching[]>([]);
  const [selectedPitching, setSelectedPitching] = useState<Pitching | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadPitchings();
  }, []);

  const loadPitchings = async () => {
    try {
      const response = await fetch(API_URL, {
        headers: { 'X-User-Id': userId.toString() }
      });
      const data = await response.json();
      setPitchings(data);
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить питчинги',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: '✓ Скопировано',
      description: `${label} скопирован${label.includes('ссылка') ? 'а' : ''}`,
    });
  };

  const copyAllInfo = () => {
    if (!selectedPitching) return;
    
    const text = `
📀 РЕЛИЗ: ${selectedPitching.release_name}
🎤 АРТИСТ: ${selectedPitching.artist_name}
🎵 ЖАНР: ${selectedPitching.genre}
📅 ДАТА РЕЛИЗА: ${formatDate(selectedPitching.release_date)}

📊 ТЕКУЩИЙ ОХВАТ:
${selectedPitching.current_reach}

👤 ОБ АРТИСТЕ:
${selectedPitching.artist_description}

💿 О РЕЛИЗЕ:
${selectedPitching.release_description}

🎧 ПОДХОДЯЩИЕ ПЛЕЙЛИСТЫ:
${selectedPitching.playlist_fit}

🔗 ПРЕВЬЮ: ${selectedPitching.preview_link}
    `.trim();
    
    navigator.clipboard.writeText(text);
    toast({
      title: '✓ Вся информация скопирована',
      description: 'Данные питчинга скопированы в буфер обмена',
    });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; text: string; icon: string }> = {
      pending: { variant: 'secondary', text: 'На рассмотрении', icon: 'Clock' },
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

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Icon name="Loader2" className="animate-spin" size={32} />
      </div>
    );
  }

  const pendingPitchings = pitchings.filter((p) => p.status === 'pending');

  return (
    <div className="space-y-4 md:space-y-6 p-3 md:p-0">
      <h2 className="text-xl md:text-2xl font-bold">Питчинги релизов</h2>

      {pendingPitchings.length > 0 && (
        <div>
          <h3 className="text-base md:text-lg font-semibold mb-3 md:mb-4 flex items-center gap-2">
            <Icon name="Clock" size={20} className="text-blue-600" />
            <span className="text-blue-600">На рассмотрении ({pendingPitchings.length})</span>
          </h3>
          <div className="grid gap-3 md:gap-4">
            {pendingPitchings.map((pitching) => (
              <Card 
                key={pitching.id} 
                className="border-blue-200 hover:border-blue-400 cursor-pointer hover:shadow-lg transition-all duration-200 bg-gradient-to-br from-white to-blue-50/30"
                onClick={() => setSelectedPitching(pitching)}
              >
                <CardContent className="p-5 md:p-6">
                  <div className="flex items-start justify-between mb-4 gap-3">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-base md:text-xl mb-2 text-gray-900">{pitching.release_name}</h4>
                      <p className="text-sm md:text-base text-gray-700 mb-2 flex items-center gap-2">
                        <Icon name="Mic2" size={16} className="text-blue-600 flex-shrink-0" />
                        {userRole === 'director' && pitching.user_id ? (
                          <a href={`/user/${pitching.user_id}`} className="text-blue-600 hover:underline font-medium" onClick={(e) => e.stopPropagation()}>
                            {pitching.artist_name}
                          </a>
                        ) : (
                          <span className="font-medium">{pitching.artist_name}</span>
                        )}
                      </p>
                      <div className="flex flex-wrap gap-3 text-xs md:text-sm text-gray-600">
                        <span className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-full border border-gray-200">
                          <Icon name="Calendar" size={14} className="text-blue-600" />
                          {formatDate(pitching.release_date)}
                        </span>
                        <span className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-full border border-gray-200">
                          <Icon name="Disc" size={14} className="text-blue-600" />
                          {pitching.genre}
                        </span>
                      </div>
                    </div>
                    {getStatusBadge(pitching.status)}
                  </div>
                  
                  <div className="space-y-3 text-sm md:text-base">
                    <div className="bg-white/70 p-3 rounded-lg border border-gray-200">
                      <p className="font-semibold text-gray-700 mb-1 flex items-center gap-1.5">
                        <Icon name="TrendingUp" size={14} className="text-blue-600" />
                        Охват:
                      </p>
                      <p className="text-gray-600">{pitching.current_reach}</p>
                    </div>
                    <div className="bg-white/70 p-3 rounded-lg border border-gray-200">
                      <p className="font-semibold text-gray-700 mb-1 flex items-center gap-1.5">
                        <Icon name="ListMusic" size={14} className="text-blue-600" />
                        Подходящие плейлисты:
                      </p>
                      <p className="text-gray-600 line-clamp-2">{pitching.playlist_fit}</p>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-4 pt-4 border-t border-gray-200">
                    {pitching.preview_link && (
                      <a 
                        href={pitching.preview_link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Icon name="Play" size={16} />
                        Прослушать
                      </a>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedPitching(pitching);
                      }}
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-900"
                    >
                      <Icon name="Eye" size={16} />
                      Подробнее
                    </button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {pitchings.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Icon name="Music" size={48} className="text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Питчингов пока нет</p>
          </CardContent>
        </Card>
      )}

      {selectedPitching && (
        <Dialog open={true} onOpenChange={() => setSelectedPitching(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold flex items-center justify-between pr-8">
                <span>Детали питчинга</span>
                <Button
                  onClick={copyAllInfo}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  <Icon name="Copy" size={16} />
                  Копировать всё
                </Button>
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-5">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-5 rounded-xl border border-blue-200">
                <h3 className="font-bold text-xl mb-2 text-gray-900">{selectedPitching.release_name}</h3>
                <div className="space-y-2 text-sm text-gray-700">
                  <p className="flex items-center gap-2">
                    <Icon name="Mic2" size={16} className="text-blue-600" />
                    <span className="font-semibold">Артист:</span>
                    {userRole === 'director' && selectedPitching.user_id ? (
                      <a href={`/user/${selectedPitching.user_id}`} className="text-blue-600 hover:underline font-medium">
                        {selectedPitching.artist_name}
                      </a>
                    ) : (
                      <span className="font-medium">{selectedPitching.artist_name}</span>
                    )}
                    <button
                      onClick={() => copyToClipboard(selectedPitching.artist_name, 'Имя артиста')}
                      className="ml-1 text-gray-400 hover:text-gray-700"
                    >
                      <Icon name="Copy" size={14} />
                    </button>
                  </p>
                  <p className="flex items-center gap-2">
                    <Icon name="Disc" size={16} className="text-blue-600" />
                    <span className="font-semibold">Жанр:</span>
                    <span>{selectedPitching.genre}</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <Icon name="Calendar" size={16} className="text-blue-600" />
                    <span className="font-semibold">Дата релиза:</span>
                    <span>{formatDate(selectedPitching.release_date)}</span>
                  </p>
                </div>
              </div>

              <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                <h4 className="font-bold mb-3 text-gray-900 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Icon name="TrendingUp" size={18} className="text-blue-600" />
                    Текущий охват
                  </span>
                  <button
                    onClick={() => copyToClipboard(selectedPitching.current_reach, 'Охват')}
                    className="text-gray-400 hover:text-gray-700"
                  >
                    <Icon name="Copy" size={16} />
                  </button>
                </h4>
                <p className="text-gray-700 whitespace-pre-wrap">{selectedPitching.current_reach}</p>
              </div>

              <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                <h4 className="font-bold mb-3 text-gray-900 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Icon name="User" size={18} className="text-blue-600" />
                    Описание артиста
                  </span>
                  <button
                    onClick={() => copyToClipboard(selectedPitching.artist_description, 'Описание артиста')}
                    className="text-gray-400 hover:text-gray-700"
                  >
                    <Icon name="Copy" size={16} />
                  </button>
                </h4>
                <p className="text-gray-700 whitespace-pre-wrap">{selectedPitching.artist_description}</p>
              </div>

              <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                <h4 className="font-bold mb-3 text-gray-900 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Icon name="Album" size={18} className="text-blue-600" />
                    Описание релиза
                  </span>
                  <button
                    onClick={() => copyToClipboard(selectedPitching.release_description, 'Описание релиза')}
                    className="text-gray-400 hover:text-gray-700"
                  >
                    <Icon name="Copy" size={16} />
                  </button>
                </h4>
                <p className="text-gray-700 whitespace-pre-wrap">{selectedPitching.release_description}</p>
              </div>

              <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                <h4 className="font-bold mb-3 text-gray-900 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Icon name="ListMusic" size={18} className="text-blue-600" />
                    Подходящие плейлисты
                  </span>
                  <button
                    onClick={() => copyToClipboard(selectedPitching.playlist_fit, 'Список плейлистов')}
                    className="text-gray-400 hover:text-gray-700"
                  >
                    <Icon name="Copy" size={16} />
                  </button>
                </h4>
                <p className="text-gray-700 whitespace-pre-wrap">{selectedPitching.playlist_fit}</p>
              </div>

              {selectedPitching.artist_photos && selectedPitching.artist_photos.length > 0 && (
                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                  <h4 className="font-bold mb-3 text-gray-900 flex items-center gap-2">
                    <Icon name="Image" size={18} className="text-blue-600" />
                    Фото артиста
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {selectedPitching.artist_photos.map((photo, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={photo}
                          alt={`${selectedPitching.artist_name} ${index + 1}`}
                          className="w-full h-48 object-cover rounded-lg border border-gray-200"
                        />
                        <button
                          onClick={() => copyToClipboard(photo, 'Ссылка на фото')}
                          className="absolute top-2 right-2 bg-white/90 hover:bg-white p-2 rounded-lg shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Icon name="Copy" size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedPitching.preview_link && (
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-5 rounded-xl border border-green-200">
                  <h4 className="font-bold mb-3 text-gray-900 flex items-center gap-2">
                    <Icon name="Play" size={18} className="text-green-600" />
                    Превью трека
                  </h4>
                  <div className="flex items-center gap-3">
                    <a
                      href={selectedPitching.preview_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
                    >
                      <Icon name="ExternalLink" size={16} />
                      Открыть превью
                    </a>
                    <button
                      onClick={() => copyToClipboard(selectedPitching.preview_link, 'Ссылка')}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 rounded-lg font-medium border border-gray-300 transition-colors"
                    >
                      <Icon name="Copy" size={16} />
                      Копировать ссылку
                    </button>
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
