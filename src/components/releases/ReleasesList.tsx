import { useState, useMemo, memo, lazy, Suspense } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { LazyImage } from '@/components/ui/image-lazy';
import { Release, Pitching } from './types';
import { Skeleton } from '@/components/ui/skeleton';

const ReleasePlayer = lazy(() => import('./ReleasePlayer'));
const PitchingForm = lazy(() => import('./PitchingForm'));

interface ReleasesListProps {
  releases: Release[];
  getStatusBadge: (status: string) => JSX.Element;
  onEdit?: (release: Release) => void;
  onPitching?: (data: Pitching) => Promise<void>;
}

const ReleasesList = memo(function ReleasesList({ releases, getStatusBadge, onEdit, onPitching }: ReleasesListProps) {
  const [expandedRelease, setExpandedRelease] = useState<number | null>(null);
  const [pitchingRelease, setPitchingRelease] = useState<Release | null>(null);
  
  const formatDate = useMemo(() => (dateStr?: string) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
  }, []);

  return (
    <div className="grid gap-2 sm:gap-3">
      {releases.map((release) => (
        <Card key={release.id} className="overflow-hidden md:hover:shadow-md transition-shadow">
          <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4 p-3 sm:p-4">
            <div className="relative group flex-shrink-0 w-full sm:w-auto">
              <div className="w-20 sm:w-20 aspect-square rounded-md overflow-hidden bg-muted">
                {release.cover_url ? (
                  <LazyImage
                    src={release.cover_url} 
                    alt={release.release_name} 
                    className="w-full h-full object-cover md:group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    <Icon name="Disc" size={24} className="sm:w-8 sm:h-8" />
                  </div>
                )}
              </div>
              {release.tracks_count !== undefined && release.tracks_count > 0 && (
                <div className="mt-1 text-xs text-muted-foreground text-center">
                  {release.tracks_count} тр.
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0 w-full">
              <div className="flex flex-col sm:flex-row items-start justify-between gap-2 mb-2">
                <div className="flex-1 min-w-0 w-full">
                  <h3 className="font-semibold mb-0.5 text-sm sm:text-base break-words">{release.release_name}</h3>
                  {release.artist_name && (
                    <p className="text-muted-foreground text-xs sm:text-sm truncate">{release.artist_name}</p>
                  )}
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0 w-full sm:w-auto flex-wrap">
                  {getStatusBadge(release.status)}
                  {release.status === 'pending' && onEdit && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onEdit(release)}
                      className="gap-1 h-8 sm:h-7 px-2 sm:px-3 flex-1 sm:flex-initial min-h-[44px] sm:min-h-0 text-xs"
                    >
                      <Icon name="Edit" size={12} className="flex-shrink-0" />
                      <span>Изменить</span>
                    </Button>
                  )}
                  {release.status === 'approved' && onPitching && (
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => setPitchingRelease(release)}
                      className="gap-1 h-8 sm:h-7 px-2 sm:px-3 flex-1 sm:flex-initial min-h-[44px] sm:min-h-0 text-xs"
                    >
                      <Icon name="Send" size={12} className="flex-shrink-0" />
                      <span>Питчинг</span>
                    </Button>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5 sm:gap-2 text-xs mb-2">
                {release.release_date && (
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Icon name="Calendar" size={12} className="flex-shrink-0" />
                    <span className="text-[10px] sm:text-xs">{formatDate(release.release_date)}</span>
                  </div>
                )}
                {release.genre && release.genre !== '0' && (
                  <Badge variant="outline" className="gap-1 h-5 text-[10px] sm:text-xs px-1.5">
                    <Icon name="Disc" size={10} className="flex-shrink-0" />
                    <span className="truncate max-w-[100px]">{release.genre}</span>
                  </Badge>
                )}
              </div>

              {release.tracks_count > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setExpandedRelease(expandedRelease === release.id ? null : release.id)}
                  className="gap-1.5 h-9 sm:h-7 -ml-2 text-xs min-h-[44px] sm:min-h-0"
                >
                  <Icon name={expandedRelease === release.id ? 'ChevronUp' : 'Play'} size={12} className="flex-shrink-0" />
                  {expandedRelease === release.id ? 'Скрыть' : 'Прослушать'}
                </Button>
              )}

              {expandedRelease === release.id && (
                <div className="mt-2 sm:mt-3">
                  <Suspense fallback={<Skeleton className="h-48 sm:h-64 w-full" />}>
                    <ReleasePlayer releaseId={release.id} />
                  </Suspense>
                </div>
              )}

              {(release.status === 'rejected' && release.review_comment) && (
                <div className="mt-2 sm:mt-3 bg-destructive/10 border border-destructive/20 p-2 sm:p-3 rounded-md">
                  <div className="flex items-start gap-2">
                    <Icon name="AlertCircle" size={14} className="text-destructive mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-destructive mb-1">Причина отклонения:</p>
                      <p className="text-xs text-foreground break-words">{release.review_comment}</p>
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
        <div className="text-center py-12 sm:py-16 px-4">
          <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-muted mb-3 sm:mb-4">
            <Icon name="Music" size={24} className="sm:w-8 sm:h-8 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground text-sm sm:text-lg">Релизов пока нет</p>
        </div>
      )}

      {pitchingRelease && onPitching && (
        <Suspense fallback={<Skeleton className="h-96 w-full" />}>
          <PitchingForm
            release={pitchingRelease}
            isOpen={true}
            onClose={() => setPitchingRelease(null)}
            onSubmit={onPitching}
          />
        </Suspense>
      )}
    </div>
  );
});

export default ReleasesList;