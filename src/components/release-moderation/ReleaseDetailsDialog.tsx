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
  reviewAction: 'approved' | 'rejected_fixable' | 'rejected_final' | null;
  reviewComment: string;
  submitting: boolean;
  onClose: () => void;
  onReviewActionChange: (action: 'approved' | 'rejected_fixable' | 'rejected_final' | null) => void;
  onReviewCommentChange: (comment: string) => void;
  onSubmitReview: () => void;
}

function RejectionTypeSelector({ 
  rejectionType, 
  onChange 
}: { 
  rejectionType: 'rejected_fixable' | 'rejected_final';
  onChange: (type: 'rejected_fixable' | 'rejected_final') => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <label className="text-sm font-semibold flex items-center gap-2">
        <Icon name="AlertCircle" size={16} className="text-destructive" />
        Выберите тип отклонения:
      </label>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => onChange('rejected_fixable')}
          className={`px-4 py-3 rounded-lg border-2 text-sm font-medium transition-all ${
            rejectionType === 'rejected_fixable'
              ? 'border-orange-500 bg-orange-500/20 text-orange-300 shadow-lg shadow-orange-500/20'
              : 'border-border bg-card text-muted-foreground hover:border-orange-500/50 hover:bg-orange-500/5'
          }`}
        >
          <div className="flex flex-col items-center gap-2">
            <Icon name="Edit" size={20} />
            <span className="font-semibold">Можно исправить</span>
            <span className="text-xs opacity-70">Артист сможет подать повторно</span>
          </div>
        </button>
        <button
          type="button"
          onClick={() => onChange('rejected_final')}
          className={`px-4 py-3 rounded-lg border-2 text-sm font-medium transition-all ${
            rejectionType === 'rejected_final'
              ? 'border-red-500 bg-red-500/20 text-red-300 shadow-lg shadow-red-500/20'
              : 'border-border bg-card text-muted-foreground hover:border-red-500/50 hover:bg-red-500/5'
          }`}
        >
          <div className="flex flex-col items-center gap-2">
            <Icon name="Ban" size={20} />
            <span className="font-semibold">Окончательно</span>
            <span className="text-xs opacity-70">Без возможности исправления</span>
          </div>
        </button>
      </div>
    </div>
  );
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

  const [rejectionType, setRejectionType] = React.useState<'rejected_fixable' | 'rejected_final'>('rejected_fixable');

  React.useEffect(() => {
    if (reviewAction === 'rejected_fixable' || reviewAction === 'rejected_final') {
      setRejectionType(reviewAction);
    }
  }, [reviewAction]);

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
            <div className="border-t pt-4 space-y-4">
              {(reviewAction === 'rejected_fixable' || reviewAction === 'rejected_final') && (
                <RejectionTypeSelector 
                  rejectionType={rejectionType} 
                  onChange={(type) => {
                    setRejectionType(type);
                    onReviewActionChange(type);
                  }} 
                />
              )}
              <div>
                <label className="text-xs md:text-sm font-medium mb-2 block flex items-center gap-2">
                  <Icon name="MessageSquare" size={14} />
                  Комментарий {(reviewAction === 'rejected_fixable' || reviewAction === 'rejected_final') && <span className="text-red-500">(обязательно)</span>}
                </label>
                <Textarea
                  placeholder="Ваш комментарий..."
                  value={reviewComment}
                  onChange={(e) => onReviewCommentChange(e.target.value)}
                  rows={3}
                  className="text-sm"
                />
              </div>
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
                disabled={submitting || ((reviewAction === 'rejected_fixable' || reviewAction === 'rejected_final') && !reviewComment)}
                variant={reviewAction === 'approved' ? 'default' : 'destructive'}
                className="w-full md:w-auto"
              >
                <Icon 
                  name={submitting ? 'Loader2' : reviewAction === 'approved' ? 'CheckCircle' : 'XCircle'} 
                  size={16} 
                  className={`mr-2 ${submitting ? 'animate-spin' : ''}`} 
                />
                {reviewAction === 'approved' ? 'Одобрить' : 'Подтвердить отклонение'}
              </Button>
            </>
          ) : (
            <div className="flex flex-col gap-2 w-full">
              <Button
                variant="default"
                className="w-full"
                onClick={() => onReviewActionChange('approved')}
              >
                <Icon name="CheckCircle" size={16} className="mr-2" />
                Одобрить
              </Button>
              <div className="flex flex-col md:flex-row gap-2">
                <Button
                  variant="outline"
                  className="flex-1 border-orange-500 text-orange-600 hover:bg-orange-50"
                  onClick={() => onReviewActionChange('rejected_fixable')}
                >
                  <Icon name="Edit" size={16} className="mr-2" />
                  <span className="hidden md:inline">Отклонить (можно исправить)</span>
                  <span className="md:hidden">Отклонить</span>
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={() => onReviewActionChange('rejected_final')}
                >
                  <Icon name="Ban" size={16} className="mr-2" />
                  <span className="hidden md:inline">Отклонить окончательно</span>
                  <span className="md:hidden">Окончательно</span>
                </Button>
              </div>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}