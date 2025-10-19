import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { Release, Track } from './types';

interface ModerationPanelProps {
  releases: Release[];
  userId: number;
  onReview: (releaseId: number, status: string, comment?: string) => Promise<void>;
  loadTracks: (releaseId: number) => Promise<Track[]>;
}

export default function ModerationPanel({ releases, userId, onReview, loadTracks }: ModerationPanelProps) {
  const [expandedRelease, setExpandedRelease] = useState<number | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewing, setReviewing] = useState(false);

  const pendingReleases = releases.filter((r) => r.status === 'pending');

  const toggleExpand = async (releaseId: number) => {
    if (expandedRelease === releaseId) {
      setExpandedRelease(null);
      setTracks([]);
    } else {
      setExpandedRelease(releaseId);
      const releaseTracks = await loadTracks(releaseId);
      setTracks(releaseTracks);
    }
  };

  const handleReview = async (releaseId: number, status: string) => {
    if (status === 'rejected' && !reviewComment.trim()) {
      return;
    }
    setReviewing(true);
    await onReview(releaseId, status, reviewComment);
    setReviewComment('');
    setExpandedRelease(null);
    setTracks([]);
    setReviewing(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Релизы на модерации</h2>
        <Badge variant="secondary">{pendingReleases.length}</Badge>
      </div>

      {pendingReleases.map((release) => (
        <Card key={release.id}>
          <CardHeader>
            <div className="flex items-start gap-4">
              {release.cover_url && (
                <img src={release.cover_url} alt={release.release_name} className="w-24 h-24 object-cover rounded" />
              )}
              <div className="flex-1">
                <CardTitle className="text-lg mb-2">{release.release_name}</CardTitle>
                <div className="space-y-1 text-sm text-muted-foreground">
                  {release.genre && release.genre !== '0' && <div><Icon name="Disc" size={14} className="inline mr-1" />{release.genre}</div>}
                  {release.copyright && <div><Icon name="Copyright" size={14} className="inline mr-1" />{release.copyright}</div>}
                  {release.tracks_count > 0 && <div><Icon name="Music" size={14} className="inline mr-1" />{release.tracks_count} треков</div>}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={() => toggleExpand(release.id)}
                >
                  <Icon name={expandedRelease === release.id ? 'ChevronUp' : 'ChevronDown'} size={16} className="mr-2" />
                  {expandedRelease === release.id ? 'Скрыть треки' : 'Показать треки'}
                </Button>
              </div>
            </div>
          </CardHeader>

          {expandedRelease === release.id && (
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {tracks.map((track) => (
                  <div key={track.track_number} className="border rounded-lg p-3">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-medium">{track.track_number}. {track.title}</p>
                        <p className="text-sm text-muted-foreground">{track.composer}</p>
                      </div>
                      <Badge variant="outline">{track.language_audio}</Badge>
                    </div>
                    {track.file_url && (
                      <audio controls className="w-full mt-2">
                        <source src={track.file_url} />
                      </audio>
                    )}
                    {track.lyrics_text && (
                      <details className="mt-2">
                        <summary className="text-xs cursor-pointer text-muted-foreground">Текст песни</summary>
                        <p className="text-xs mt-1 whitespace-pre-wrap">{track.lyrics_text}</p>
                      </details>
                    )}
                  </div>
                ))}
              </div>

              <div className="space-y-3 border-t pt-4">
                <Textarea
                  placeholder="Комментарий к решению (обязательно при отклонении)"
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  rows={3}
                />
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleReview(release.id, 'approved')}
                    disabled={reviewing}
                    className="flex-1"
                  >
                    <Icon name="CheckCircle" size={16} className="mr-2" />
                    Одобрить
                  </Button>
                  <Button
                    onClick={() => handleReview(release.id, 'rejected')}
                    disabled={reviewing || !reviewComment.trim()}
                    variant="destructive"
                    className="flex-1"
                  >
                    <Icon name="XCircle" size={16} className="mr-2" />
                    Отклонить
                  </Button>
                </div>
              </div>
            </CardContent>
          )}
        </Card>
      ))}

      {pendingReleases.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          Нет релизов на модерации
        </div>
      )}
    </div>
  );
}