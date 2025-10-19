import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import Icon from '@/components/ui/icon';
import TrackList from './TrackList';
import PitchingSection from './PitchingSection';
import type { Release } from './types';

interface ReleaseDetailsDialogProps {
  release: Release | null;
  userRole: string;
  reviewAction: 'approve' | 'reject' | null;
  reviewComment: string;
  submitting: boolean;
  onClose: () => void;
  onReviewActionChange: (action: 'approve' | 'reject' | null) => void;
  onReviewCommentChange: (comment: string) => void;
  onSubmitReview: () => void;
}

export default function ReleaseDetailsDialog({
  release,
  userRole,
  reviewAction,
  reviewComment,
  submitting,
  onClose,
  onReviewActionChange,
  onReviewCommentChange,
  onSubmitReview
}: ReleaseDetailsDialogProps) {
  if (!release) return null;

  return (
    <Dialog open={release !== null} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-4 md:p-6">
        <DialogHeader>
          <DialogTitle>Детали релиза</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {release.cover_url && (
            <img 
              src={release.cover_url} 
              alt={release.release_name} 
              className="w-32 h-32 md:w-48 md:h-48 object-cover rounded-lg mx-auto shadow-2xl" 
            />
          )}
          <div>
            <h3 className="font-semibold text-base md:text-lg">{release.release_name}</h3>
            <p className="text-sm text-muted-foreground">
              Артист: {userRole === 'director' && release.user_id ? (
                <a href={`/user/${release.user_id}`} className="text-primary hover:underline">
                  {release.artist_name}
                </a>
              ) : release.artist_name}
            </p>
            {release.genre && <p className="text-sm text-muted-foreground">Жанр: {release.genre}</p>}
            {release.copyright && <p className="text-sm text-muted-foreground">Копирайт: {release.copyright}</p>}
            {release.release_date && (
              <p className="text-sm text-muted-foreground">
                Дата релиза: {new Date(release.release_date).toLocaleDateString('ru-RU')}
              </p>
            )}
          </div>

          {release.tracks && release.tracks.length > 0 && (
            <TrackList tracks={release.tracks} />
          )}

          {release.pitching && (
            <PitchingSection pitching={release.pitching} />
          )}

          {reviewAction && (
            <div className="border-t pt-4">
              <label className="text-xs md:text-sm font-medium mb-2 block flex items-center gap-2">
                <Icon name="MessageSquare" size={14} />
                Комментарий {reviewAction === 'reject' && <span className="text-red-500">(обязательно)</span>}
              </label>
              <Textarea
                placeholder="Ваш комментарий..."
                value={reviewComment}
                onChange={(e) => onReviewCommentChange(e.target.value)}
                rows={3}
                className="text-sm"
              />
            </div>
          )}
        </div>
        <DialogFooter className="flex-col md:flex-row gap-2">
          {reviewAction ? (
            <>
              <Button 
                variant="outline" 
                onClick={() => {
                  onReviewActionChange(null);
                  onReviewCommentChange('');
                }} 
                className="w-full md:w-auto"
              >
                <Icon name="X" size={16} className="mr-2" />
                Отмена
              </Button>
              <Button
                onClick={onSubmitReview}
                disabled={submitting || (reviewAction === 'reject' && !reviewComment)}
                variant={reviewAction === 'approve' ? 'default' : 'destructive'}
                className="w-full md:w-auto"
              >
                <Icon 
                  name={submitting ? 'Loader2' : reviewAction === 'approve' ? 'CheckCircle' : 'XCircle'} 
                  size={16} 
                  className={`mr-2 ${submitting ? 'animate-spin' : ''}`} 
                />
                {reviewAction === 'approve' ? 'Одобрить' : 'Отклонить'}
              </Button>
            </>
          ) : (
            <div className="flex flex-col md:flex-row gap-2 w-full">
              <Button
                variant="default"
                className="flex-1"
                onClick={() => onReviewActionChange('approve')}
              >
                <Icon name="CheckCircle" size={16} className="mr-2" />
                Одобрить
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={() => onReviewActionChange('reject')}
              >
                <Icon name="XCircle" size={16} className="mr-2" />
                Отклонить
              </Button>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
