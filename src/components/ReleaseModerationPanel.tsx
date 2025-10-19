import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import Icon from '@/components/ui/icon';
import ReleaseCard from './release-moderation/ReleaseCard';
import ReleaseDetailsDialog from './release-moderation/ReleaseDetailsDialog';
import type { Release } from './release-moderation/types';

const API_URL = 'https://functions.poehali.dev/05d2ddf9-772f-40cb-bcef-0d70fa96e059';
const PITCHING_API_URL = 'https://functions.poehali.dev/da292f4e-1263-4ad9-878e-0349a94d0480';

interface ReleaseModerationPanelProps {
  userId: number;
  userRole?: string;
}

export default function ReleaseModerationPanel({ userId, userRole = 'manager' }: ReleaseModerationPanelProps) {
  const [releases, setReleases] = useState<Release[]>([]);
  const [selectedRelease, setSelectedRelease] = useState<Release | null>(null);
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject' | null>(null);
  const [reviewComment, setReviewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadReleases();
  }, []);

  const loadReleases = async () => {
    try {
      const response = await fetch(API_URL, {
        headers: { 'X-User-Id': userId.toString() }
      });
      const data = await response.json();
      setReleases(data);
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить релизы',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const loadReleaseDetails = async (releaseId: number) => {
    try {
      const response = await fetch(`${API_URL}?release_id=${releaseId}`, {
        headers: { 'X-User-Id': userId.toString() }
      });
      const data = await response.json();
      
      try {
        const pitchingResponse = await fetch(`${PITCHING_API_URL}?release_id=${releaseId}`, {
          headers: { 'X-User-Id': userId.toString() }
        });
        const pitchingData = await pitchingResponse.json();
        data.pitching = pitchingData && pitchingData.length > 0 ? pitchingData[0] : null;
      } catch {
        data.pitching = null;
      }
      
      setSelectedRelease(data);
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить детали релиза',
        variant: 'destructive'
      });
    }
  };

  const handleReview = async () => {
    if (!selectedRelease || !reviewAction) return;

    setSubmitting(true);
    try {
      const response = await fetch(API_URL, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': userId.toString()
        },
        body: JSON.stringify({
          release_id: selectedRelease.id,
          action: reviewAction,
          comment: reviewComment
        })
      });

      if (!response.ok) throw new Error('Failed to review release');

      toast({
        title: 'Успешно',
        description: `Релиз ${reviewAction === 'approve' ? 'одобрен' : 'отклонён'}`
      });

      setSelectedRelease(null);
      setReviewAction(null);
      setReviewComment('');
      loadReleases();
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось выполнить действие',
        variant: 'destructive'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseDialog = () => {
    setSelectedRelease(null);
    setReviewAction(null);
    setReviewComment('');
  };

  const handleApprove = (releaseId: number) => {
    loadReleaseDetails(releaseId);
    setReviewAction('approve');
  };

  const handleReject = (releaseId: number) => {
    loadReleaseDetails(releaseId);
    setReviewAction('reject');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Icon name="Loader2" className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  const pendingReleases = releases.filter((r) => r.status === 'pending');
  const reviewedReleases = releases.filter((r) => r.status !== 'pending');

  return (
    <div className="space-y-4 md:space-y-6 p-3 md:p-0">
      <h2 className="text-xl md:text-2xl font-bold text-foreground">Модерация релизов</h2>

      {pendingReleases.length > 0 && (
        <div>
          <h3 className="text-base md:text-lg font-semibold mb-3 md:mb-4 flex items-center gap-2">
            <Icon name="Clock" size={20} className="text-primary" />
            <span className="text-primary">Ожидают проверки ({pendingReleases.length})</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
            {pendingReleases.map((release) => (
              <ReleaseCard
                key={release.id}
                release={release}
                userRole={userRole}
                onView={loadReleaseDetails}
                onApprove={handleApprove}
                onReject={handleReject}
                isPending={true}
              />
            ))}
          </div>
        </div>
      )}

      {reviewedReleases.length > 0 && (
        <div>
          <h3 className="text-base md:text-lg font-semibold mb-3 md:mb-4 flex items-center gap-2">
            <Icon name="Archive" size={20} className="text-muted-foreground" />
            <span className="text-muted-foreground">Проверенные ({reviewedReleases.length})</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
            {reviewedReleases.map((release) => (
              <ReleaseCard
                key={release.id}
                release={release}
                userRole={userRole}
                onView={loadReleaseDetails}
                isPending={false}
              />
            ))}
          </div>
        </div>
      )}

      {releases.length === 0 && (
        <Card className="bg-card/50 border-border/50">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Icon name="Music" size={48} className="text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Релизов пока нет</p>
          </CardContent>
        </Card>
      )}

      <ReleaseDetailsDialog
        release={selectedRelease}
        userRole={userRole}
        reviewAction={reviewAction}
        reviewComment={reviewComment}
        submitting={submitting}
        onClose={handleCloseDialog}
        onReviewActionChange={setReviewAction}
        onReviewCommentChange={setReviewComment}
        onSubmitReview={handleReview}
      />
    </div>
  );
}