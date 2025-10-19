import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
          <h3 className="text-base md:text-lg font-semibold mb-3 md:mb-4 text-blue-600">На рассмотрении ({pendingPitchings.length})</h3>
          <div className="grid gap-3 md:gap-4">
            {pendingPitchings.map((pitching) => (
              <Card 
                key={pitching.id} 
                className="border-blue-600/50 cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setSelectedPitching(pitching)}
              >
                <CardContent className="p-4 md:pt-6">
                  <div className="flex items-start justify-between mb-2 md:mb-3 gap-2">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm md:text-lg mb-1 truncate">{pitching.release_name}</h4>
                      <p className="text-xs md:text-sm text-muted-foreground mb-1 truncate">
                        Артист: {userRole === 'director' && pitching.user_id ? (
                          <a href={`/user/${pitching.user_id}`} className="text-primary hover:underline" onClick={(e) => e.stopPropagation()}>
                            {pitching.artist_name}
                          </a>
                        ) : pitching.artist_name}
                      </p>
                      <div className="flex gap-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Icon name="Calendar" size={12} />
                          {formatDate(pitching.release_date)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Icon name="Disc" size={12} />
                          {pitching.genre}
                        </span>
                      </div>
                    </div>
                    {getStatusBadge(pitching.status)}
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div>
                      <p className="font-medium">Охват:</p>
                      <p className="text-muted-foreground">{pitching.current_reach}</p>
                    </div>
                    <div>
                      <p className="font-medium">Подходящие плейлисты:</p>
                      <p className="text-muted-foreground line-clamp-2">{pitching.playlist_fit}</p>
                    </div>
                  </div>

                  {pitching.preview_link && (
                    <a 
                      href={pitching.preview_link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 mt-3 text-sm text-primary hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Icon name="ExternalLink" size={14} />
                      Прослушать превью
                    </a>
                  )}
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
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Детали питчинга</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg">{selectedPitching.release_name}</h3>
                <p className="text-sm text-muted-foreground">
                  Артист: {userRole === 'director' && selectedPitching.user_id ? (
                    <a href={`/user/${selectedPitching.user_id}`} className="text-primary hover:underline">
                      {selectedPitching.artist_name}
                    </a>
                  ) : selectedPitching.artist_name}
                </p>
                <p className="text-sm text-muted-foreground">Жанр: {selectedPitching.genre}</p>
                <p className="text-sm text-muted-foreground">Дата релиза: {formatDate(selectedPitching.release_date)}</p>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Описание артиста</h4>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{selectedPitching.artist_description}</p>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Описание релиза</h4>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{selectedPitching.release_description}</p>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Подходящие плейлисты</h4>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{selectedPitching.playlist_fit}</p>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Текущий охват</h4>
                <p className="text-sm text-muted-foreground">{selectedPitching.current_reach}</p>
              </div>

              {selectedPitching.artist_photos && selectedPitching.artist_photos.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Фото артиста</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {selectedPitching.artist_photos.map((photo, index) => (
                      <img 
                        key={index} 
                        src={photo} 
                        alt={`Артист ${index + 1}`} 
                        className="w-full h-32 object-cover rounded-lg" 
                      />
                    ))}
                  </div>
                </div>
              )}

              {selectedPitching.preview_link && (
                <div>
                  <h4 className="font-semibold mb-2">Превью</h4>
                  <a 
                    href={selectedPitching.preview_link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-primary hover:underline"
                  >
                    <Icon name="ExternalLink" size={16} />
                    Открыть ссылку на превью
                  </a>
                </div>
              )}

              <div className="text-xs text-muted-foreground pt-4 border-t">
                Отправлено: {formatDate(selectedPitching.created_at)}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}