import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import Icon from '@/components/ui/icon';
import { API_ENDPOINTS } from '@/config/api';

const API_URL = API_ENDPOINTS.PITCHING;

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
    const variants: Record<string, { className: string; text: string; icon: string }> = {
      pending: { className: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40', text: 'На рассмотрении', icon: 'Clock' },
      approved: { className: 'bg-green-500/20 text-green-300 border-green-500/40', text: 'Одобрен', icon: 'CheckCircle' },
      rejected: { className: 'bg-red-500/20 text-red-300 border-red-500/40', text: 'Отклонён', icon: 'XCircle' }
    };
    const config = variants[status] || variants.pending;
    return (
      <Badge className={`gap-1 border ${config.className}`}>
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
        <Icon name="Loader2" className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  const pendingPitchings = pitchings.filter((p) => p.status === 'pending');

  return (
    <div className="space-y-4 md:space-y-6 p-3 md:p-0">
      <h2 className="text-xl md:text-2xl font-bold text-foreground">Питчинги релизов</h2>

      {pendingPitchings.length > 0 && (
        <div>
          <h3 className="text-base md:text-lg font-semibold mb-3 md:mb-4 flex items-center gap-2">
            <Icon name="Clock" size={20} className="text-primary" />
            <span className="text-primary">На рассмотрении ({pendingPitchings.length})</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
            {pendingPitchings.map((pitching) => (
              <Card 
                key={pitching.id} 
                className="border-yellow-500/30 hover:border-yellow-500/60 cursor-pointer hover:shadow-lg hover:shadow-yellow-500/10 transition-all duration-200 bg-gradient-to-br from-black via-yellow-950/20 to-black flex flex-col"
                onClick={() => setSelectedPitching(pitching)}
              >
                <CardContent className="p-4 flex flex-col h-full">
                  <div className="flex items-start justify-between mb-3 gap-2">
                    <h4 className="font-bold text-base text-primary line-clamp-2 flex-1">{pitching.release_name}</h4>
                    {getStatusBadge(pitching.status)}
                  </div>

                  <div className="space-y-2 text-sm mb-3">
                    <p className="flex items-center gap-1.5 text-muted-foreground">
                      <Icon name="Mic2" size={14} className="text-secondary flex-shrink-0" />
                      <span className="font-medium text-foreground truncate">{pitching.artist_name}</span>
                    </p>
                    <div className="flex flex-wrap gap-2 text-xs">
                      <span className="flex items-center gap-1 bg-card/50 px-2 py-0.5 rounded-full border border-border">
                        <Icon name="Calendar" size={12} className="text-primary" />
                        {formatDate(pitching.release_date)}
                      </span>
                      <span className="flex items-center gap-1 bg-card/50 px-2 py-0.5 rounded-full border border-border">
                        <Icon name="Disc" size={12} className="text-primary" />
                        {pitching.genre}
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-xs flex-1">
                    <div className="bg-card/30 p-2 rounded border border-border/50">
                      <p className="font-semibold text-foreground mb-1 flex items-center gap-1">
                        <Icon name="TrendingUp" size={12} className="text-primary" />
                        Охват:
                      </p>
                      <p className="text-muted-foreground line-clamp-2">{pitching.current_reach}</p>
                    </div>
                    <div className="bg-card/30 p-2 rounded border border-border/50">
                      <p className="font-semibold text-foreground mb-1 flex items-center gap-1">
                        <Icon name="ListMusic" size={12} className="text-primary" />
                        Плейлисты:
                      </p>
                      <p className="text-muted-foreground line-clamp-2">{pitching.playlist_fit}</p>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-3 pt-3 border-t border-border/50">
                    {pitching.preview_link && (
                      <a 
                        href={pitching.preview_link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-secondary hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Icon name="Play" size={14} />
                        Прослушать
                      </a>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedPitching(pitching);
                      }}
                      className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground ml-auto"
                    >
                      <Icon name="Eye" size={14} />
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
        <Card className="bg-card/50 border-border/50">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Icon name="Music" size={48} className="text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Питчингов пока нет</p>
          </CardContent>
        </Card>
      )}

      {selectedPitching && (
        <Dialog open={true} onOpenChange={() => setSelectedPitching(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-black via-yellow-950/20 to-black border-yellow-500/30">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold flex items-center justify-between pr-8">
                <span className="text-primary">Детали питчинга</span>
                <Button
                  onClick={copyAllInfo}
                  variant="outline"
                  size="sm"
                  className="gap-2 border-yellow-500/30 hover:border-yellow-500/60 hover:bg-yellow-500/10"
                >
                  <Icon name="Copy" size={16} />
                  Копировать всё
                </Button>
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-5">
              <div className="bg-gradient-to-br from-yellow-950/30 to-orange-950/30 p-5 rounded-xl border border-yellow-500/30">
                <h3 className="font-bold text-xl mb-2 text-primary">{selectedPitching.release_name}</h3>
                <div className="space-y-2 text-sm text-foreground">
                  <p className="flex items-center gap-2">
                    <Icon name="Mic2" size={16} className="text-secondary" />
                    <span className="font-semibold">Артист:</span>
                    {userRole === 'director' && selectedPitching.user_id ? (
                      <a href={`/user/${selectedPitching.user_id}`} className="text-secondary hover:underline font-medium">
                        {selectedPitching.artist_name}
                      </a>
                    ) : (
                      <span className="font-medium">{selectedPitching.artist_name}</span>
                    )}
                    <button
                      onClick={() => copyToClipboard(selectedPitching.artist_name, 'Имя артиста')}
                      className="ml-1 text-muted-foreground hover:text-primary"
                    >
                      <Icon name="Copy" size={14} />
                    </button>
                  </p>
                  <p className="flex items-center gap-2">
                    <Icon name="Disc" size={16} className="text-primary" />
                    <span className="font-semibold">Жанр:</span>
                    <span>{selectedPitching.genre}</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <Icon name="Calendar" size={16} className="text-primary" />
                    <span className="font-semibold">Дата релиза:</span>
                    <span>{formatDate(selectedPitching.release_date)}</span>
                  </p>
                </div>
              </div>

              <div className="bg-card/50 p-5 rounded-xl border border-border/50">
                <h4 className="font-bold mb-3 text-foreground flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Icon name="TrendingUp" size={18} className="text-primary" />
                    Текущий охват
                  </span>
                  <button
                    onClick={() => copyToClipboard(selectedPitching.current_reach, 'Охват')}
                    className="text-muted-foreground hover:text-primary"
                  >
                    <Icon name="Copy" size={16} />
                  </button>
                </h4>
                <p className="text-muted-foreground whitespace-pre-wrap">{selectedPitching.current_reach}</p>
              </div>

              <div className="bg-card/50 p-5 rounded-xl border border-border/50">
                <h4 className="font-bold mb-3 text-foreground flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Icon name="User" size={18} className="text-primary" />
                    Описание артиста
                  </span>
                  <button
                    onClick={() => copyToClipboard(selectedPitching.artist_description, 'Описание артиста')}
                    className="text-muted-foreground hover:text-primary"
                  >
                    <Icon name="Copy" size={16} />
                  </button>
                </h4>
                <p className="text-muted-foreground whitespace-pre-wrap">{selectedPitching.artist_description}</p>
              </div>

              <div className="bg-card/50 p-5 rounded-xl border border-border/50">
                <h4 className="font-bold mb-3 text-foreground flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Icon name="Album" size={18} className="text-primary" />
                    Описание релиза
                  </span>
                  <button
                    onClick={() => copyToClipboard(selectedPitching.release_description, 'Описание релиза')}
                    className="text-muted-foreground hover:text-primary"
                  >
                    <Icon name="Copy" size={16} />
                  </button>
                </h4>
                <p className="text-muted-foreground whitespace-pre-wrap">{selectedPitching.release_description}</p>
              </div>

              <div className="bg-card/50 p-5 rounded-xl border border-border/50">
                <h4 className="font-bold mb-3 text-foreground flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Icon name="ListMusic" size={18} className="text-primary" />
                    Подходящие плейлисты
                  </span>
                  <button
                    onClick={() => copyToClipboard(selectedPitching.playlist_fit, 'Список плейлистов')}
                    className="text-muted-foreground hover:text-primary"
                  >
                    <Icon name="Copy" size={16} />
                  </button>
                </h4>
                <p className="text-muted-foreground whitespace-pre-wrap">{selectedPitching.playlist_fit}</p>
              </div>

              {selectedPitching.artist_photos && selectedPitching.artist_photos.length > 0 && (
                <div className="bg-card/50 p-5 rounded-xl border border-border/50">
                  <h4 className="font-bold mb-3 text-foreground flex items-center gap-2">
                    <Icon name="Image" size={18} className="text-primary" />
                    Фото артиста
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {selectedPitching.artist_photos.map((photo, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={photo}
                          alt={`${selectedPitching.artist_name} ${index + 1}`}
                          className="w-full h-48 object-cover rounded-lg border border-border/50"
                        />
                        <button
                          onClick={() => copyToClipboard(photo, 'Ссылка на фото')}
                          className="absolute top-2 right-2 bg-card/90 hover:bg-card p-2 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity border border-border/50 text-primary"
                        >
                          <Icon name="Copy" size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedPitching.preview_link && (
                <div className="bg-gradient-to-br from-green-950/30 to-emerald-950/30 p-5 rounded-xl border border-green-500/30">
                  <h4 className="font-bold mb-3 text-foreground flex items-center gap-2">
                    <Icon name="Play" size={18} className="text-green-400" />
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
                      className="inline-flex items-center gap-2 px-4 py-2 bg-card hover:bg-muted text-foreground rounded-lg font-medium border border-border/50 transition-colors"
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