import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import Icon from '@/components/ui/icon';

const API_URL = 'https://functions.poehali.dev/05d2ddf9-772f-40cb-bcef-0d70fa96e059';

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

interface Release {
  id: number;
  release_name: string;
  artist_name: string;
  cover_url?: string;
  release_date?: string;
  genre?: string;
  copyright?: string;
  status: string;
  tracks_count?: number;
  created_at: string;
  tracks?: Track[];
  review_comment?: string;
}

interface ReleaseModerationPanelProps {
  userId: number;
}

export default function ReleaseModerationPanel({ userId }: ReleaseModerationPanelProps) {
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
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Модерация релизов</h2>

      {pendingReleases.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4 text-yellow-600">Ожидают проверки ({pendingReleases.length})</h3>
          <div className="grid gap-4">
            {pendingReleases.map((release) => (
              <Card key={release.id} className="border-yellow-600/50">
                <CardContent className="pt-6">
                  <div className="flex gap-4">
                    {release.cover_url && (
                      <img src={release.cover_url} alt={release.release_name} className="w-24 h-24 object-cover rounded-lg" />
                    )}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-semibold">{release.release_name}</h4>
                          <p className="text-sm text-muted-foreground">Артист: {release.artist_name}</p>
                          {release.genre && <p className="text-xs text-muted-foreground">{release.genre}</p>}
                        </div>
                        {getStatusBadge(release.status)}
                      </div>
                      <div className="text-xs text-muted-foreground mb-3">
                        Треков: {release.tracks_count || 0} • Создан: {new Date(release.created_at).toLocaleDateString('ru-RU')}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => loadReleaseDetails(release.id)}
                        >
                          <Icon name="Eye" size={14} className="mr-1" />
                          Просмотреть
                        </Button>
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => {
                            loadReleaseDetails(release.id);
                            setReviewAction('approve');
                          }}
                        >
                          <Icon name="CheckCircle" size={14} className="mr-1" />
                          Одобрить
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => {
                            loadReleaseDetails(release.id);
                            setReviewAction('reject');
                          }}
                        >
                          <Icon name="XCircle" size={14} className="mr-1" />
                          Отклонить
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
          <h3 className="text-lg font-semibold mb-4">Проверенные ({reviewedReleases.length})</h3>
          <div className="grid gap-4">
            {reviewedReleases.map((release) => (
              <Card key={release.id}>
                <CardContent className="pt-6">
                  <div className="flex gap-4">
                    {release.cover_url && (
                      <img src={release.cover_url} alt={release.release_name} className="w-20 h-20 object-cover rounded-lg" />
                    )}
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-semibold">{release.release_name}</h4>
                          <p className="text-sm text-muted-foreground">{release.artist_name}</p>
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
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Детали релиза</DialogTitle>
          </DialogHeader>
          {selectedRelease && (
            <div className="space-y-4">
              {selectedRelease.cover_url && (
                <img src={selectedRelease.cover_url} alt={selectedRelease.release_name} className="w-48 h-48 object-cover rounded-lg mx-auto" />
              )}
              <div>
                <h3 className="font-semibold text-lg">{selectedRelease.release_name}</h3>
                <p className="text-sm text-muted-foreground">Артист: {selectedRelease.artist_name}</p>
                {selectedRelease.genre && <p className="text-sm text-muted-foreground">Жанр: {selectedRelease.genre}</p>}
                {selectedRelease.copyright && <p className="text-sm text-muted-foreground">Копирайт: {selectedRelease.copyright}</p>}
              </div>

              {selectedRelease.tracks && selectedRelease.tracks.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Треки ({selectedRelease.tracks.length})</h4>
                  <div className="space-y-2">
                    {selectedRelease.tracks.map((track) => (
                      <Card key={track.id} className="bg-black/30">
                        <CardContent className="pt-4">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <p className="font-medium">#{track.track_number} - {track.title}</p>
                              <p className="text-xs text-muted-foreground">{track.composer}</p>
                            </div>
                          </div>
                          <audio controls className="w-full mt-2">
                            <source src={track.file_url} />
                          </audio>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {reviewAction && (
                <div className="border-t pt-4">
                  <label className="text-sm font-medium mb-2 block">
                    Комментарий {reviewAction === 'reject' && '(обязательно при отклонении)'}
                  </label>
                  <Textarea
                    placeholder="Ваш комментарий..."
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    rows={3}
                  />
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            {reviewAction ? (
              <>
                <Button variant="outline" onClick={() => {
                  setReviewAction(null);
                  setReviewComment('');
                }}>
                  Отмена
                </Button>
                <Button
                  onClick={handleReview}
                  disabled={submitting || (reviewAction === 'reject' && !reviewComment)}
                  variant={reviewAction === 'approve' ? 'default' : 'destructive'}
                >
                  <Icon name={submitting ? 'Loader2' : reviewAction === 'approve' ? 'CheckCircle' : 'XCircle'} 
                    size={16} 
                    className={`mr-2 ${submitting ? 'animate-spin' : ''}`} 
                  />
                  {reviewAction === 'approve' ? 'Одобрить' : 'Отклонить'}
                </Button>
              </>
            ) : (
              <div className="flex gap-2 w-full">
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
