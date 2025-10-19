import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import type { Release } from './types';

interface ReleaseCardProps {
  release: Release;
  userRole: string;
  onView: (releaseId: number) => void;
  onApprove?: (releaseId: number) => void;
  onReject?: (releaseId: number) => void;
  isPending?: boolean;
}

export default function ReleaseCard({ 
  release, 
  userRole, 
  onView, 
  onApprove, 
  onReject,
  isPending = false 
}: ReleaseCardProps) {
  const getStatusBadge = (status: string) => {
    const variants: Record<string, { className: string; text: string; icon: string }> = {
      pending: { className: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40', text: 'На модерации', icon: 'Clock' },
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

  return (
    <Card 
      className={`${
        isPending 
          ? 'border-yellow-500/30 hover:border-yellow-500/60' 
          : 'border-border/50'
      } cursor-pointer hover:shadow-lg hover:shadow-yellow-500/10 transition-all duration-200 bg-gradient-to-br from-black via-yellow-950/20 to-black flex flex-col`}
      onClick={() => onView(release.id)}
    >
      <CardContent className="p-4 flex flex-col h-full">
        <div className="flex items-start justify-between mb-3 gap-2">
          <h4 className="font-bold text-base text-primary line-clamp-2 flex-1">{release.release_name}</h4>
          {getStatusBadge(release.status)}
        </div>

        {release.cover_url && (
          <img 
            src={release.cover_url} 
            alt={release.release_name} 
            className="w-full aspect-square object-cover rounded-lg mb-3 border border-border/50" 
          />
        )}

        <div className="space-y-2 text-sm flex-1">
          <p className="flex items-center gap-1.5 text-muted-foreground">
            <Icon name="Mic2" size={14} className="text-secondary flex-shrink-0" />
            {userRole === 'director' && release.user_id ? (
              <a 
                href={`/user/${release.user_id}`} 
                className="text-secondary hover:underline font-medium truncate" 
                onClick={(e) => e.stopPropagation()}
              >
                {release.artist_name}
              </a>
            ) : (
              <span className="font-medium text-foreground truncate">{release.artist_name}</span>
            )}
          </p>

          {release.genre && release.genre !== '0' && (
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Icon name="Disc" size={12} className="text-primary" />
              {release.genre}
            </p>
          )}

          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Icon name="Calendar" size={12} className="text-primary" />
            {new Date(release.created_at).toLocaleDateString('ru-RU')}
          </p>

          {release.reviewer_name && (
            <p className="text-xs text-muted-foreground flex items-center gap-1.5 truncate">
              <Icon name="User" size={12} className="text-primary" />
              {userRole === 'director' && release.reviewer_id ? (
                <span>
                  Проверил: <a 
                    href={`/user/${release.reviewer_id}`} 
                    className="text-secondary hover:underline" 
                    onClick={(e) => e.stopPropagation()}
                  >
                    {release.reviewer_name}
                  </a>
                </span>
              ) : (
                <span>Проверил: {release.reviewer_name}</span>
              )}
            </p>
          )}
        </div>

        {isPending && (
          <div className="flex flex-col gap-2 mt-3 pt-3 border-t border-border/50">
            <Button
              size="sm"
              variant="outline"
              className="w-full text-xs border-border/50 hover:border-primary/50 hover:bg-primary/10"
              onClick={(e) => {
                e.stopPropagation();
                onView(release.id);
              }}
            >
              <Icon name="Eye" size={14} className="mr-1" />
              Просмотреть
            </Button>
            <div className="flex gap-2">
              {onApprove && (
                <Button
                  size="sm"
                  className="flex-1 text-xs bg-green-600 hover:bg-green-700"
                  onClick={(e) => {
                    e.stopPropagation();
                    onApprove(release.id);
                  }}
                >
                  <Icon name="CheckCircle" size={14} className="mr-1" />
                  Одобрить
                </Button>
              )}
              {onReject && (
                <Button
                  size="sm"
                  variant="destructive"
                  className="flex-1 text-xs"
                  onClick={(e) => {
                    e.stopPropagation();
                    onReject(release.id);
                  }}
                >
                  <Icon name="XCircle" size={14} className="mr-1" />
                  Отклонить
                </Button>
              )}
            </div>
          </div>
        )}

        {!isPending && (
          <div className="flex gap-2 mt-3 pt-3 border-t border-border/50">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onView(release.id);
              }}
              className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground ml-auto"
            >
              <Icon name="Eye" size={14} />
              Подробнее
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
