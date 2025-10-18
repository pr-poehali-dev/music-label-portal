import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { Release } from './types';

interface ReleasesListProps {
  releases: Release[];
  getStatusBadge: (status: string) => JSX.Element;
}

export default function ReleasesList({ releases, getStatusBadge }: ReleasesListProps) {
  return (
    <div className="grid gap-4">
      {releases.map((release) => (
        <Card key={release.id}>
          <CardHeader>
            <div className="flex items-start gap-4">
              {release.cover_url && (
                <img src={release.cover_url} alt={release.release_name} className="w-20 h-20 object-cover rounded" />
              )}
              <div className="flex-1">
                <CardTitle className="text-lg mb-2">{release.release_name}</CardTitle>
                <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                  {release.genre && <Badge variant="outline">{release.genre}</Badge>}
                  <span className="flex items-center gap-1">
                    <Icon name="Music" size={14} />
                    {release.tracks_count || 0} треков
                  </span>
                  {getStatusBadge(release.status)}
                </div>
              </div>
            </div>
          </CardHeader>
          {(release.status === 'rejected' && release.review_comment) && (
            <CardContent>
              <div className="bg-destructive/10 p-3 rounded-md">
                <p className="text-sm font-medium mb-1">Причина отклонения:</p>
                <p className="text-sm">{release.review_comment}</p>
                {release.reviewer_name && (
                  <p className="text-xs text-muted-foreground mt-2">— {release.reviewer_name}</p>
                )}
              </div>
            </CardContent>
          )}
        </Card>
      ))}
      {releases.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          Релизов пока нет
        </div>
      )}
    </div>
  );
}
