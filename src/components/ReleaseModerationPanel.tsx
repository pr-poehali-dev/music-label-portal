import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import Icon from '@/components/ui/icon';
import ReleaseCard from './release-moderation/ReleaseCard';
import ReleaseDetailsDialog from './release-moderation/ReleaseDetailsDialog';
import type { Release } from './release-moderation/types';
import { API_ENDPOINTS } from '@/config/api';

const API_URL = API_ENDPOINTS.RELEASES;
const PITCHING_API_URL = API_ENDPOINTS.PITCHING;

interface ReleaseModerationPanelProps {
  userId: number;
  userRole?: string;
}

export default function ReleaseModerationPanel({ userId, userRole = 'manager' }: ReleaseModerationPanelProps) {
  const [releases, setReleases] = useState<Release[]>([]);
  const [selectedRelease, setSelectedRelease] = useState<Release | null>(null);
  const [reviewAction, setReviewAction] = useState<'approved' | 'rejected_fixable' | 'rejected_final' | null>(null);
  const [reviewComment, setReviewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());
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

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to review release');
      }

      const actionTexts: Record<string, string> = {
        'approved': 'одобрен',
        'rejected_fixable': 'отклонён (можно исправить)',
        'rejected_final': 'отклонён окончательно'
      };

      toast({
        title: 'Успешно',
        description: `Релиз ${actionTexts[reviewAction] || reviewAction}`
      });

      setSelectedRelease(null);
      setReviewAction(null);
      setReviewComment('');
      loadReleases();
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: error instanceof Error ? error.message : 'Не удалось выполнить действие',
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
    setReviewAction('approved');
  };

  const handleReject = (releaseId: number) => {
    loadReleaseDetails(releaseId);
    // Открываем диалог, но пользователь должен увидеть кнопки выбора
    // Используем rejected_fixable как начальное значение для переключателя
    setReviewAction('rejected_fixable');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Icon name="Loader2" className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  const filterByDate = (release: Release) => {
    if (dateFilter === 'all') return true;
    const releaseDate = new Date(release.created_at);
    const now = new Date();
    
    if (dateFilter === 'today') {
      return releaseDate.toDateString() === now.toDateString();
    }
    if (dateFilter === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return releaseDate >= weekAgo;
    }
    if (dateFilter === 'month') {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      return releaseDate >= monthAgo;
    }
    return true;
  };

  const toggleSection = (sectionId: string) => {
    setCollapsedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  const filteredReleases = releases.filter(filterByDate);
  const pendingReleases = filteredReleases.filter((r) => r.status === 'pending');
  const approvedReleases = filteredReleases.filter((r) => r.status === 'approved');
  const rejectedReleases = filteredReleases.filter((r) => r.status === 'rejected_fixable' || r.status === 'rejected_final');

  return (
    <div className="space-y-4 md:space-y-6 p-3 md:p-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-4">
        <h2 className="text-xl md:text-2xl font-bold text-foreground">Модерация релизов</h2>
        
        <div className="flex gap-2">
          <button
            onClick={() => setDateFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              dateFilter === 'all'
                ? 'bg-primary text-primary-foreground'
                : 'bg-card text-muted-foreground hover:text-foreground border border-border/50'
            }`}
          >
            Все время
          </button>
          <button
            onClick={() => setDateFilter('today')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              dateFilter === 'today'
                ? 'bg-primary text-primary-foreground'
                : 'bg-card text-muted-foreground hover:text-foreground border border-border/50'
            }`}
          >
            Сегодня
          </button>
          <button
            onClick={() => setDateFilter('week')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              dateFilter === 'week'
                ? 'bg-primary text-primary-foreground'
                : 'bg-card text-muted-foreground hover:text-foreground border border-border/50'
            }`}
          >
            Неделя
          </button>
          <button
            onClick={() => setDateFilter('month')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              dateFilter === 'month'
                ? 'bg-primary text-primary-foreground'
                : 'bg-card text-muted-foreground hover:text-foreground border border-border/50'
            }`}
          >
            Месяц
          </button>
        </div>
      </div>

      {pendingReleases.length > 0 && (
        <div>
          <button
            onClick={() => toggleSection('pending')}
            className="w-full text-left mb-3 md:mb-4 flex items-center gap-2 group"
          >
            <Icon name="Clock" size={20} className="text-primary" />
            <span className="text-base md:text-lg font-semibold text-foreground">Ожидают проверки</span>
            <span className="ml-1 px-2 py-0.5 rounded-full bg-primary/20 text-primary text-sm font-medium">({pendingReleases.length})</span>
            <Icon 
              name={collapsedSections.has('pending') ? 'ChevronRight' : 'ChevronDown'} 
              size={18} 
              className="text-muted-foreground ml-auto group-hover:text-foreground transition-colors" 
            />
          </button>
          {!collapsedSections.has('pending') && (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
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
          )}
        </div>
      )}

      {approvedReleases.length > 0 && (
        <div>
          <button
            onClick={() => toggleSection('approved')}
            className="w-full text-left mb-3 md:mb-4 flex items-center gap-2 group"
          >
            <Icon name="CheckCircle" size={20} className="text-green-400" />
            <span className="text-base md:text-lg font-semibold text-foreground">Одобренные</span>
            <span className="ml-1 px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 text-sm font-medium">({approvedReleases.length})</span>
            <Icon 
              name={collapsedSections.has('approved') ? 'ChevronRight' : 'ChevronDown'} 
              size={18} 
              className="text-muted-foreground ml-auto group-hover:text-foreground transition-colors" 
            />
          </button>
          {!collapsedSections.has('approved') && (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
              {approvedReleases.map((release) => (
                <ReleaseCard
                  key={release.id}
                  release={release}
                  userRole={userRole}
                  onView={loadReleaseDetails}
                  isPending={false}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {rejectedReleases.length > 0 && (
        <div>
          <button
            onClick={() => toggleSection('rejected')}
            className="w-full text-left mb-3 md:mb-4 flex items-center gap-2 group"
          >
            <Icon name="XCircle" size={20} className="text-red-400" />
            <span className="text-base md:text-lg font-semibold text-foreground">Отклонённые</span>
            <span className="ml-1 px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 text-sm font-medium">({rejectedReleases.length})</span>
            <Icon 
              name={collapsedSections.has('rejected') ? 'ChevronRight' : 'ChevronDown'} 
              size={18} 
              className="text-muted-foreground ml-auto group-hover:text-foreground transition-colors" 
            />
          </button>
          {!collapsedSections.has('rejected') && (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
              {rejectedReleases.map((release) => (
                <ReleaseCard
                  key={release.id}
                  release={release}
                  userRole={userRole}
                  onView={loadReleaseDetails}
                  isPending={false}
                />
              ))}
            </div>
          )}
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