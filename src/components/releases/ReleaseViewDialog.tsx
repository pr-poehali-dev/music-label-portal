import { useState, useEffect, lazy, Suspense } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import Icon from '@/components/ui/icon';
import { Release } from './types';

const ReleasePlayer = lazy(() => import('./ReleasePlayer'));

interface ReleaseViewDialogProps {
  release: Release | null;
  userId: number;
  userRole?: string;
  onClose: () => void;
  onStatusChange?: (releaseId: number, status: string, comment?: string) => void;
  loadTracks?: (releaseId: number) => Promise<any[]>;
}

export default function ReleaseViewDialog({
  release,
  userId,
  userRole = 'artist',
  onClose,
  onStatusChange,
  loadTracks
}: ReleaseViewDialogProps) {
  const [tracks, setTracks] = useState<any[]>([]);
  const [loadingTracks, setLoadingTracks] = useState(false);
  const [reviewAction, setReviewAction] = useState<'pending' | 'approved' | 'rejected_fixable' | 'rejected_final' | null>(null);
  const [reviewComment, setReviewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (release && loadTracks) {
      setLoadingTracks(true);
      loadTracks(release.id)
        .then((data) => setTracks(data || []))
        .catch(() => setTracks([]))
        .finally(() => setLoadingTracks(false));
    }
  }, [release, loadTracks]);

  if (!release) return null;

  const isManager = userRole === 'manager' || userRole === 'director';
  const canChangeStatus = isManager && onStatusChange;

  const handleSubmitReview = async () => {
    if (!reviewAction || !onStatusChange) return;
    if ((reviewAction === 'rejected_fixable' || reviewAction === 'rejected_final') && !reviewComment.trim()) return;

    setSubmitting(true);
    try {
      await onStatusChange(release.id, reviewAction, reviewComment);
      setReviewAction(null);
      setReviewComment('');
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  return (
    <Dialog open={release !== null} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-4 md:p-6">
        <DialogHeader>
          <DialogTitle>Информация о релизе</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {release.cover_url && (
            <div className="flex justify-center">
              <img 
                src={release.cover_url} 
                alt={release.release_name} 
                className="w-32 h-32 md:w-48 md:h-48 object-cover rounded-lg shadow-2xl" 
              />
            </div>
          )}

          <div className="space-y-2">
            <h3 className="font-semibold text-lg md:text-xl">{release.release_name}</h3>
            
            {release.artist_name && (
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Icon name="User" size={14} />
                Артист: {release.artist_name}
              </p>
            )}

            {release.genre && release.genre !== '0' && (
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Icon name="Disc" size={14} />
                Жанр: {release.genre}
              </p>
            )}

            {release.copyright && (
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Icon name="Shield" size={14} />
                Копирайт: {release.copyright}
              </p>
            )}

            {release.release_date && (
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Icon name="Calendar" size={14} />
                Дата релиза: {formatDate(release.release_date)}
              </p>
            )}

            {release.preorder_date && (
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Icon name="Clock" size={14} />
                Предзаказ: {formatDate(release.preorder_date)}
              </p>
            )}

            {release.title_language && (
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Icon name="Languages" size={14} />
                Язык: {release.title_language}
              </p>
            )}
          </div>

          {tracks.length > 0 && (
            <div>
              <h4 className="font-semibold mb-3 text-sm md:text-base flex items-center gap-2">
                <Icon name="Music" size={16} />
                Треки ({tracks.length})
              </h4>
              <Suspense fallback={
                <div className="flex justify-center py-8">
                  <Icon name="Loader2" size={24} className="animate-spin text-yellow-500" />
                </div>
              }>
                <ReleasePlayer key={`player-${release.id}`} userId={userId} releaseId={release.id} />
              </Suspense>
            </div>
          )}

          {release.review_comment && (
            <div className="bg-destructive/10 border border-destructive/20 p-3 rounded-lg">
              <div className="flex items-start gap-2">
                <Icon name="AlertCircle" size={16} className="text-destructive mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-destructive mb-1">Комментарий модератора:</p>
                  <p className="text-sm text-foreground break-words">{release.review_comment}</p>
                  {release.reviewer_name && (
                    <p className="text-xs text-muted-foreground mt-2">— {release.reviewer_name}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {canChangeStatus && reviewAction && (
            <div className="border-t pt-4">
              <label className="text-sm font-medium mb-2 block flex items-center gap-2">
                <Icon name="MessageSquare" size={14} />
                Комментарий {(reviewAction === 'rejected_fixable' || reviewAction === 'rejected_final') && <span className="text-destructive">(обязательно)</span>}
              </label>
              <Textarea
                placeholder="Укажите причину изменения статуса..."
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                rows={3}
                className="text-sm"
              />
            </div>
          )}
        </div>

        <DialogFooter className="flex-col md:flex-row gap-2">
          {canChangeStatus && reviewAction ? (
            <>
              <Button 
                variant="outline" 
                onClick={() => {
                  setReviewAction(null);
                  setReviewComment('');
                }} 
                className="w-full md:w-auto"
              >
                <Icon name="X" size={16} className="mr-2" />
                Отмена
              </Button>
              <Button
                onClick={handleSubmitReview}
                disabled={submitting || ((reviewAction === 'rejected_fixable' || reviewAction === 'rejected_final') && !reviewComment.trim())}
                variant={reviewAction === 'approved' ? 'default' : (reviewAction === 'rejected_fixable' || reviewAction === 'rejected_final') ? 'destructive' : 'secondary'}
                className="w-full md:w-auto"
              >
                <Icon 
                  name={submitting ? 'Loader2' : reviewAction === 'approved' ? 'CheckCircle' : (reviewAction === 'rejected_fixable' || reviewAction === 'rejected_final') ? 'XCircle' : 'Clock'} 
                  size={16} 
                  className={`mr-2 ${submitting ? 'animate-spin' : ''}`} 
                />
                {reviewAction === 'approved' ? 'Одобрить' : reviewAction === 'rejected_fixable' ? 'Отклонить (можно исправить)' : reviewAction === 'rejected_final' ? 'Отклонить окончательно' : 'На модерацию'}
              </Button>
            </>
          ) : canChangeStatus && release.status !== 'pending' ? (
            <div className="flex flex-col md:flex-row gap-2 w-full">
              {release.status !== 'pending' && (
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={() => setReviewAction('pending')}
                >
                  <Icon name="Clock" size={16} className="mr-2" />
                  На модерацию
                </Button>
              )}
              {release.status !== 'approved' && (
                <Button
                  variant="default"
                  className="flex-1"
                  onClick={() => setReviewAction('approved')}
                >
                  <Icon name="CheckCircle" size={16} className="mr-2" />
                  Одобрить
                </Button>
              )}
              {!release.status.startsWith('rejected') && (
                <>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setReviewAction('rejected_fixable')}
                  >
                    <Icon name="Edit" size={16} className="mr-2" />
                    Отклонить (можно исправить)
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1"
                    onClick={() => setReviewAction('rejected_final')}
                  >
                    <Icon name="Ban" size={16} className="mr-2" />
                    Отклонить окончательно
                  </Button>
                </>
              )}
            </div>
          ) : !isManager && release.status === 'rejected_fixable' ? (
            <div className="flex flex-col md:flex-row gap-2 w-full">
              <Button
                variant="default"
                className="flex-1"
                onClick={async () => {
                  if (!onStatusChange) return;
                  try {
                    await onStatusChange(release.id, 'fix_and_resubmit', '');
                    onClose();
                  } catch (error) {
                    console.error('Failed to resubmit:', error);
                  }
                }}
              >
                <Icon name="Edit" size={16} className="mr-2" />
                Исправить и подать снова
              </Button>
              <Button variant="outline" onClick={onClose} className="flex-1">
                Закрыть
              </Button>
            </div>
          ) : (
            <Button variant="outline" onClick={onClose} className="w-full md:w-auto">
              Закрыть
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}