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
    <div className="grid gap-3">
      {releases.map((release) => (
        <Card key={release.id} className="overflow-hidden hover:shadow-md transition-shadow">
          <div className="flex items-start gap-4 p-4">
            <div className="relative group flex-shrink-0">
              <div className="w-20 h-20 rounded-md overflow-hidden bg-muted">
                {release.cover_url ? (
                  <img 
                    src={release.cover_url} 
                    alt={release.release_name} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    <Icon name="Disc" size={32} />
                  </div>
                )}
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold mb-0.5 truncate text-base">{release.release_name}</h3>
                  {release.artist_name && (
                    <p className="text-muted-foreground text-sm">{release.artist_name}</p>
                  )}
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {getStatusBadge(release.status)}
                  {release.status === 'pending' && onEdit && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onEdit(release)}
                      className="gap-1 h-7 px-2"
                    >
                      <Icon name="Edit" size={12} />
                      <span className="hidden sm:inline">Изменить</span>
                    </Button>
                  )}
                  {release.status === 'approved' && onPitching && (
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => setPitchingRelease(release)}
                      className="gap-1 h-7 px-2"
                    >
                      <Icon name="Send" size={12} />
                      <span className="hidden sm:inline">Питчинг</span>
                    </Button>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-2 text-xs mb-2">
                {release.release_date && (
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Icon name="Calendar" size={12} />
                    <span>{formatDate(release.release_date)}</span>
                  </div>
                )}
                {release.genre && (
                  <Badge variant="outline" className="gap-1 h-5 text-xs px-1.5">
                    <Icon name="Disc" size={10} />
                    {release.genre}
                  </Badge>
                )}
                {release.tracks_count > 0 && (
                  <Badge variant="outline" className="gap-1 h-5 text-xs px-1.5">
                    <Icon name="Music" size={10} />
                    {release.tracks_count}
                  </Badge>
                )}
              </div>

              {release.tracks_count && release.tracks_count > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setExpandedRelease(expandedRelease === release.id ? null : release.id)}
                  className="gap-1.5 h-7 -ml-2 text-xs"
                >
                  <Icon name={expandedRelease === release.id ? 'ChevronUp' : 'Play'} size={12} />
                  {expandedRelease === release.id ? 'Скрыть' : 'Прослушать'}
                </Button>
              )}

              {expandedRelease === release.id && (
                <div className="mt-3">
                  <ReleasePlayer releaseId={release.id} />
                </div>
              )}

              {(release.status === 'rejected' && release.review_comment) && (
                <div className="mt-3 bg-destructive/10 border border-destructive/20 p-3 rounded-md">
                  <div className="flex items-start gap-2">
                    <Icon name="AlertCircle" size={14} className="text-destructive mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-xs font-medium text-destructive mb-1">Причина отклонения:</p>
                      <p className="text-xs text-foreground">{release.review_comment}</p>
                      {release.reviewer_name && (
                        <p className="text-xs text-muted-foreground mt-1.5">— {release.reviewer_name}</p>
                      )}
                    </div>
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