import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { Release, Pitching } from './types';
import ReleasePlayer from './ReleasePlayer';
import PitchingForm from './PitchingForm';

interface ReleasesListProps {
  releases: Release[];
  getStatusBadge: (status: string) => JSX.Element;
  onEdit?: (release: Release) => void;
  onPitching?: (data: Pitching) => Promise<void>;
}

export default function ReleasesList({ releases, getStatusBadge, onEdit, onPitching }: ReleasesListProps) {
  const [expandedRelease, setExpandedRelease] = useState<number | null>(null);
  const [pitchingRelease, setPitchingRelease] = useState<Release | null>(null);
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  return (
    <div className="grid gap-4">
      {releases.map((release) => (
        <Card key={release.id} className="overflow-hidden hover:shadow-lg transition-shadow">
          <div className="flex items-start gap-6 p-6">
            <div className="relative group flex-shrink-0">
              <div className="w-32 h-32 rounded-lg overflow-hidden bg-muted shadow-md">
                {release.cover_url ? (
                  <img 
                    src={release.cover_url} 
                    alt={release.release_name} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    <Icon name="Disc" size={48} />
                  </div>
                )}
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="text-xl font-bold mb-1 truncate">{release.release_name}</h3>
                  {release.artist_name && (
                    <p className="text-muted-foreground text-sm mb-2">{release.artist_name}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(release.status)}
                  {release.status === 'pending' && onEdit && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onEdit(release)}
                      className="gap-1"
                    >
                      <Icon name="Edit" size={14} />
                      Редактировать
                    </Button>
                  )}
                  {release.status === 'approved' && onPitching && (
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => setPitchingRelease(release)}
                      className="gap-1"
                    >
                      <Icon name="Send" size={14} />
                      Питчинг
                    </Button>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-3 text-sm mb-3">
                {release.release_date && (
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Icon name="Calendar" size={16} />
                    <span>{formatDate(release.release_date)}</span>
                  </div>
                )}
                {release.genre && (
                  <Badge variant="outline" className="gap-1">
                    <Icon name="Disc" size={14} />
                    {release.genre}
                  </Badge>
                )}
                <Badge variant="outline" className="gap-1">
                  <Icon name="Music" size={14} />
                  {release.tracks_count || 0} {release.tracks_count === 1 ? 'трек' : 'треков'}
                </Badge>
              </div>

              {release.copyright && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                  <Icon name="Copyright" size={12} />
                  <span>{release.copyright}</span>
                </div>
              )}

              {release.tracks_count && release.tracks_count > 0 && (
                <div className="mt-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setExpandedRelease(expandedRelease === release.id ? null : release.id)}
                    className="gap-2 -ml-2"
                  >
                    <Icon name="Play" size={16} />
                    {expandedRelease === release.id ? 'Скрыть плеер' : 'Прослушать альбом'}
                  </Button>
                </div>
              )}

              {expandedRelease === release.id && (
                <div className="mt-4">
                  <ReleasePlayer releaseId={release.id} />
                </div>
              )}

              {(release.status === 'rejected' && release.review_comment) && (
                <div className="mt-4 bg-destructive/10 border border-destructive/20 p-4 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Icon name="AlertCircle" size={16} className="text-destructive mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-destructive mb-1">Причина отклонения:</p>
                      <p className="text-sm text-foreground">{release.review_comment}</p>
                      {release.reviewer_name && (
                        <p className="text-xs text-muted-foreground mt-2">— {release.reviewer_name}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {(release.status === 'approved' || release.status === 'rejected') && (
                <div className="mt-4 bg-muted/50 border p-3 rounded-lg">
                  <div className="flex items-center gap-2 text-sm">
                    <Icon name={release.status === 'approved' ? 'CheckCircle' : 'XCircle'} size={16} className={release.status === 'approved' ? 'text-green-600' : 'text-destructive'} />
                    <span className="text-muted-foreground">
                      {release.status === 'approved' ? 'Релиз одобрен' : 'Релиз отклонён'}
                      {release.reviewer_name && ` — ${release.reviewer_name}`}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card>
      ))}
      {releases.length === 0 && (
        <div className="text-center py-16">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
            <Icon name="Music" size={32} className="text-muted-foreground" />
          </div>
          <p className="text-muted-foreground text-lg">Релизов пока нет</p>
        </div>
      )}

      {pitchingRelease && onPitching && (
        <PitchingForm
          release={pitchingRelease}
          isOpen={true}
          onClose={() => setPitchingRelease(null)}
          onSubmit={onPitching}
        />
      )}
    </div>
  );
}