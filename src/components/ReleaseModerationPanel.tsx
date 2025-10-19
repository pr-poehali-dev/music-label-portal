import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import Icon from '@/components/ui/icon';

const API_URL = 'https://functions.poehali.dev/05d2ddf9-772f-40cb-bcef-0d70fa96e059';
const PITCHING_API_URL = 'https://functions.poehali.dev/da292f4e-1263-4ad9-878e-0349a94d0480';

interface Track {
  id: number;
  track_number: number;
  title: string;
  file_url: string;
  file_name: string;
  composer: string;
  author_lyrics?: string;
  language_audio: string;
  lyrics_text?: string;
}

interface Pitching {
  id: number;
  release_id: number;
  artist_name: string;
  release_name: string;
  release_date: string;
  genre: string;
  artist_description: string;
  release_description: string;
  playlist_fit: string;
  current_reach: string;
  preview_link: string;
  status: string;
  created_at: string;
}

interface Release {
  id: number;
  release_name: string;
  artist_name: string;
  user_id?: number;
  cover_url?: string;
  release_date?: string;
  genre?: string;
  copyright?: string;
  status: string;
  tracks_count?: number;
  created_at: string;
  tracks?: Track[];
  review_comment?: string;
  reviewer_id?: number;
  reviewer_name?: string;
  pitching?: Pitching | null;
}

interface ReleaseModerationPanelProps {
  userId: number;
  userRole?: string;
}

export default function ReleaseModerationPanel({ userId, userRole = 'manager' }: ReleaseModerationPanelProps) {
  const [releases, setReleases] = useState<Release[]>([]);
  const [selectedRelease, setSelectedRelease] = useState<Release | null>(null);
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject' | null>(null);
  const [reviewComment, setReviewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadReleases();
  }, []);

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

  const loadReleaseDetails = async (releaseId: number) => {
    try {
      const response = await fetch(`${API_URL}?release_id=${releaseId}`, {
        headers: { 'X-User-Id': userId.toString() }
      });
      const data = await response.json();
      
      // Загружаем питчинг для этого релиза
      try {
        const pitchingResponse = await fetch(`${PITCHING_API_URL}?release_id=${releaseId}`, {
          headers: { 'X-User-Id': userId.toString() }
        });
        const pitchingData = await pitchingResponse.json();
        data.pitching = pitchingData && pitchingData.length > 0 ? pitchingData[0] : null;
      } catch {
        data.pitching = null;
      }
      
      setSelectedRelease(data);
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить детали релиза',
        variant: 'destructive'
      });
    }
  };

  const handleReview = async () => {
    if (!selectedRelease || !reviewAction) return;

    setSubmitting(true);
    try {
      const response = await fetch(API_URL, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': userId.toString()
        },
        body: JSON.stringify({
          release_id: selectedRelease.id,
          action: reviewAction,
          comment: reviewComment
        })
      });

      if (!response.ok) throw new Error('Failed to review release');

      toast({
        title: 'Успешно',
        description: `Релиз ${reviewAction === 'approve' ? 'одобрен' : 'отклонён'}`
      });

      setSelectedRelease(null);
      setReviewAction(null);
      setReviewComment('');
      loadReleases();
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось выполнить действие',
        variant: 'destructive'
      });
    } finally {
      setSubmitting(false);
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

  const pendingReleases = releases.filter((r) => r.status === 'pending');
  const reviewedReleases = releases.filter((r) => r.status !== 'pending');

  return (
    <div className="space-y-4 md:space-y-6">
      <h2 className="text-xl md:text-2xl font-bold">Модерация релизов</h2>

      {pendingReleases.length > 0 && (
        <div>
          <h3 className="text-base md:text-lg font-semibold mb-3 md:mb-4 text-yellow-600 flex items-center gap-2">
            <Icon name="Clock" size={18} />
            Ожидают проверки ({pendingReleases.length})
          </h3>
          <div className="grid gap-3 md:gap-4">
            {pendingReleases.map((release) => (
              <Card key={release.id} className="border-yellow-600/50 hover:border-yellow-600 transition-all duration-200">
                <CardContent className="p-3 md:p-6">
                  <div className="flex gap-3 md:gap-4">
                    {release.cover_url && (
                      <img src={release.cover_url} alt={release.release_name} className="w-16 h-16 md:w-24 md:h-24 object-cover rounded-lg shadow-lg" />
                    )}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2 gap-2">
                        <div className="min-w-0 flex-1">
                          <h4 className="font-semibold text-sm md:text-base truncate">{release.release_name}</h4>
                          <p className="text-xs md:text-sm text-muted-foreground truncate">
                            Артист: {userRole === 'director' && release.user_id ? (
                              <a href={`/user/${release.user_id}`} className="text-primary hover:underline" onClick={(e) => e.stopPropagation()}>
                                {release.artist_name}
                              </a>
                            ) : release.artist_name}
                          </p>
                          {release.genre && release.genre !== '0' && <p className="text-xs text-muted-foreground">{release.genre}</p>}
                        </div>
                        {getStatusBadge(release.status)}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                        <Icon name="Calendar" size={12} />
                        {new Date(release.created_at).toLocaleDateString('ru-RU')}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 md:flex-none"
                          onClick={() => loadReleaseDetails(release.id)}
                        >
                          <Icon name="Eye" size={14} className="md:mr-1" />
                          <span className="hidden md:inline">Просмотреть</span>
                        </Button>
                        <Button
                          size="sm"
                          variant="default"
                          className="flex-1 md:flex-none"
                          onClick={() => {
                            loadReleaseDetails(release.id);
                            setReviewAction('approve');
                          }}
                        >
                          <Icon name="CheckCircle" size={14} className="md:mr-1" />
                          <span className="hidden md:inline">Одобрить</span>
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="flex-1 md:flex-none"
                          onClick={() => {
                            loadReleaseDetails(release.id);
                            setReviewAction('reject');
                          }}
                        >
                          <Icon name="XCircle" size={14} className="md:mr-1" />
                          <span className="hidden md:inline">Отклонить</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {reviewedReleases.length > 0 && (
        <div>
          <h3 className="text-base md:text-lg font-semibold mb-3 md:mb-4 flex items-center gap-2">
            <Icon name="Archive" size={18} />
            Проверенные ({reviewedReleases.length})
          </h3>
          <div className="grid gap-3 md:gap-4">
            {reviewedReleases.map((release) => (
              <Card key={release.id} className="cursor-pointer hover:shadow-lg transition-all duration-200 border-muted" onClick={() => loadReleaseDetails(release.id)}>
                <CardContent className="p-3 md:p-6">
                  <div className="flex gap-3 md:gap-4">
                    {release.cover_url && (
                      <img src={release.cover_url} alt={release.release_name} className="w-16 h-16 md:w-20 md:h-20 object-cover rounded-lg shadow-lg" />
                    )}
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <h4 className="font-semibold text-sm md:text-base truncate">{release.release_name}</h4>
                          <p className="text-xs md:text-sm text-muted-foreground truncate">
                            {userRole === 'director' && release.user_id ? (
                              <a href={`/user/${release.user_id}`} className="text-primary hover:underline" onClick={(e) => e.stopPropagation()}>
                                {release.artist_name}
                              </a>
                            ) : release.artist_name}
                          </p>
                          {release.reviewer_name && (
                            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1 truncate">
                              <Icon name="User" size={10} />
                              {userRole === 'director' && release.reviewer_id ? (
                                <span>Проверил: <a href={`/user/${release.reviewer_id}`} className="text-primary hover:underline" onClick={(e) => e.stopPropagation()}>{release.reviewer_name}</a></span>
                              ) : (
                                <span>Проверил: {release.reviewer_name}</span>
                              )}
                            </p>
                          )}
                        </div>
                        {getStatusBadge(release.status)}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {releases.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Icon name="Music" size={48} className="text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Релизов пока нет</p>
          </CardContent>
        </Card>
      )}

      {/* Release Details Dialog */}
      <Dialog open={selectedRelease !== null} onOpenChange={() => {
        setSelectedRelease(null);
        setReviewAction(null);
        setReviewComment('');
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-4 md:p-6">
          <DialogHeader>
            <DialogTitle>Детали релиза</DialogTitle>
          </DialogHeader>
          {selectedRelease && (
            <div className="space-y-4">
              {selectedRelease.cover_url && (
                <img src={selectedRelease.cover_url} alt={selectedRelease.release_name} className="w-32 h-32 md:w-48 md:h-48 object-cover rounded-lg mx-auto shadow-2xl" />
              )}
              <div>
                <h3 className="font-semibold text-base md:text-lg">{selectedRelease.release_name}</h3>
                <p className="text-sm text-muted-foreground">
                  Артист: {userRole === 'director' && selectedRelease.user_id ? (
                    <a href={`/user/${selectedRelease.user_id}`} className="text-primary hover:underline">
                      {selectedRelease.artist_name}
                    </a>
                  ) : selectedRelease.artist_name}
                </p>
                {selectedRelease.genre && <p className="text-sm text-muted-foreground">Жанр: {selectedRelease.genre}</p>}
                {selectedRelease.copyright && <p className="text-sm text-muted-foreground">Копирайт: {selectedRelease.copyright}</p>}
                {selectedRelease.release_date && (
                  <p className="text-sm text-muted-foreground">
                    Дата релиза: {new Date(selectedRelease.release_date).toLocaleDateString('ru-RU')}
                  </p>
                )}
              </div>

              {selectedRelease.tracks && selectedRelease.tracks.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2 text-sm md:text-base flex items-center gap-2">
                    <Icon name="Music" size={16} />
                    Треки ({selectedRelease.tracks.length})
                  </h4>
                  <div className="space-y-2">
                    {selectedRelease.tracks.map((track) => (
                      <Card key={track.id} className="bg-black/30 border-yellow-500/20">
                        <CardContent className="p-3 md:pt-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-sm md:text-base truncate">#{track.track_number} - {track.title}</p>
                              <p className="text-xs text-muted-foreground truncate">{track.composer}</p>
                            </div>
                          </div>
                          <audio controls className="w-full mt-2 h-8 md:h-10">
                            <source src={track.file_url} />
                          </audio>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {selectedRelease.pitching && (
                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-3 flex items-center gap-2 text-sm md:text-base">
                    <Icon name="Target" size={18} className="text-blue-500" />
                    Питчинг
                  </h4>
                  <div className="space-y-3 bg-blue-500/10 p-3 md:p-4 rounded-lg border border-blue-500/20">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
                        <Icon name="User" size={12} />
                        Описание артиста
                      </p>
                      <p className="text-xs md:text-sm whitespace-pre-wrap">{selectedRelease.pitching.artist_description}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
                        <Icon name="Disc" size={12} />
                        Описание релиза
                      </p>
                      <p className="text-xs md:text-sm whitespace-pre-wrap">{selectedRelease.pitching.release_description}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
                        <Icon name="ListMusic" size={12} />
                        Подходящие плейлисты
                      </p>
                      <p className="text-xs md:text-sm whitespace-pre-wrap">{selectedRelease.pitching.playlist_fit}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
                        <Icon name="TrendingUp" size={12} />
                        Текущий охват
                      </p>
                      <p className="text-xs md:text-sm">{selectedRelease.pitching.current_reach}</p>
                    </div>
                    {selectedRelease.pitching.preview_link && (
                      <a 
                        href={selectedRelease.pitching.preview_link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                      >
                        <Icon name="ExternalLink" size={14} />
                        Превью релиза
                      </a>
                    )}
                  </div>
                </div>
              )}

              {reviewAction && (
                <div className="border-t pt-4">
                  <label className="text-xs md:text-sm font-medium mb-2 block flex items-center gap-2">
                    <Icon name="MessageSquare" size={14} />
                    Комментарий {reviewAction === 'reject' && <span className="text-red-500">(обязательно)</span>}
                  </label>
                  <Textarea
                    placeholder="Ваш комментарий..."
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    rows={3}
                    className="text-sm"
                  />
                </div>
              )}
            </div>
          )}
          <DialogFooter className="flex-col md:flex-row gap-2">
            {reviewAction ? (
              <>
                <Button variant="outline" onClick={() => {
                  setReviewAction(null);
                  setReviewComment('');
                }} className="w-full md:w-auto">
                  <Icon name="X" size={16} className="mr-2" />
                  Отмена
                </Button>
                <Button
                  onClick={handleReview}
                  disabled={submitting || (reviewAction === 'reject' && !reviewComment)}
                  variant={reviewAction === 'approve' ? 'default' : 'destructive'}
                  className="w-full md:w-auto"
                >
                  <Icon name={submitting ? 'Loader2' : reviewAction === 'approve' ? 'CheckCircle' : 'XCircle'} 
                    size={16} 
                    className={`mr-2 ${submitting ? 'animate-spin' : ''}`} 
                  />
                  {reviewAction === 'approve' ? 'Одобрить' : 'Отклонить'}
                </Button>
              </>
            ) : (
              <div className="flex flex-col md:flex-row gap-2 w-full">
                <Button
                  variant="default"
                  className="flex-1"
                  onClick={() => setReviewAction('approve')}
                >
                  <Icon name="CheckCircle" size={16} className="mr-2" />
                  Одобрить
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={() => setReviewAction('reject')}
                >
                  <Icon name="XCircle" size={16} className="mr-2" />
                  Отклонить
                </Button>
              </div>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}