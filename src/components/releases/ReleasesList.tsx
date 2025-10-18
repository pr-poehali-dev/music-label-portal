import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { Release } from './types';

interface ReleasesListProps {
  releases: Release[];
  getStatusBadge: (status: string) => JSX.Element;
}

export default function ReleasesList({ releases, getStatusBadge }: ReleasesListProps) {
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
                {getStatusBadge(release.status)}
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
    </div>
  );
}
