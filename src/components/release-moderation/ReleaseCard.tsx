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

  return (
    <Card 
      className={`${
        isPending 
          ? 'border-yellow-600/50 hover:border-yellow-600' 
          : 'border-muted'
      } ${!isPending ? 'cursor-pointer hover:shadow-lg' : ''} transition-all duration-200`}
      onClick={!isPending ? () => onView(release.id) : undefined}
    >
      <CardContent className="p-3 md:p-6">
        <div className="flex gap-3 md:gap-4">
          {release.cover_url && (
            <img 
              src={release.cover_url} 
              alt={release.release_name} 
              className="w-16 h-16 md:w-24 md:h-24 object-cover rounded-lg shadow-lg" 
            />
          )}
          <div className="flex-1">
            <div className="flex items-start justify-between mb-2 gap-2">
              <div className="min-w-0 flex-1">
                <h4 className="font-semibold text-sm md:text-base truncate">{release.release_name}</h4>
                <p className="text-xs md:text-sm text-muted-foreground truncate">
                  Артист: {userRole === 'director' && release.user_id ? (
                    <a 
                      href={`/user/${release.user_id}`} 
                      className="text-primary hover:underline" 
                      onClick={(e) => e.stopPropagation()}
                    >
                      {release.artist_name}
                    </a>
                  ) : release.artist_name}
                </p>
                {release.genre && release.genre !== '0' && (
                  <p className="text-xs text-muted-foreground">{release.genre}</p>
                )}
                {release.reviewer_name && (
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1 truncate">
                    <Icon name="User" size={10} />
                    {userRole === 'director' && release.reviewer_id ? (
                      <span>
                        Проверил: <a 
                          href={`/user/${release.reviewer_id}`} 
                          className="text-primary hover:underline" 
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
              {getStatusBadge(release.status)}
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
              <Icon name="Calendar" size={12} />
              {new Date(release.created_at).toLocaleDateString('ru-RU')}
            </div>
            {isPending && (
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 md:flex-none"
                  onClick={() => onView(release.id)}
                >
                  <Icon name="Eye" size={14} className="md:mr-1" />
                  <span className="hidden md:inline">Просмотреть</span>
                </Button>
                {onApprove && (
                  <Button
                    size="sm"
                    variant="default"
                    className="flex-1 md:flex-none"
                    onClick={() => onApprove(release.id)}
                  >
                    <Icon name="CheckCircle" size={14} className="md:mr-1" />
                    <span className="hidden md:inline">Одобрить</span>
                  </Button>
                )}
                {onReject && (
                  <Button
                    size="sm"
                    variant="destructive"
                    className="flex-1 md:flex-none"
                    onClick={() => onReject(release.id)}
                  >
                    <Icon name="XCircle" size={14} className="md:mr-1" />
                    <span className="hidden md:inline">Отклонить</span>
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
