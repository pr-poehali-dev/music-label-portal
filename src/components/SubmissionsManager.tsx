import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { createNotification } from '@/hooks/useNotifications';
import PitchingManagement from './PitchingManagement';

interface Submission {
  id: number;
  artist_name: string;
  track_link: string;
  contact_link?: string;
  message?: string;
  status: 'new' | 'reviewing' | 'approved' | 'rejected';
  created_at: string;
  reviewed_by?: number;
  reviewed_by_name?: string;
  reviewed_at?: string;
  admin_comment?: string;
}

interface SubmissionsManagerProps {
  userId: number;
  userRole?: string;
}

const API_URL = 'https://functions.poehali.dev/40a44285-32b8-4e3e-8f8f-b77f16293727';

export default function SubmissionsManager({ userId, userRole = 'manager' }: SubmissionsManagerProps) {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [adminComment, setAdminComment] = useState('');
  const [showModal, setShowModal] = useState(false);
  const { toast } = useToast();

  const loadSubmissions = async () => {
    try {
      const response = await fetch(`${API_URL}?status=${statusFilter}`);
      const data = await response.json();
      setSubmissions(data.submissions || []);
    } catch (error) {
      toast({ title: '❌ Ошибка загрузки заявок', variant: 'destructive' });
    }
  };

  useEffect(() => {
    loadSubmissions();
  }, [statusFilter]);

  const updateStatus = async (submissionId: number, newStatus: string) => {
    try {
      const response = await fetch(API_URL, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: submissionId,
          status: newStatus,
          reviewed_by: userId
        })
      });

      if (response.ok) {
        toast({ title: '✅ Статус обновлён' });
        
        // Notify directors about new submissions
        if (newStatus === 'new') {
          const submission = submissions.find(s => s.id === submissionId);
          if (submission) {
            try {
              await createNotification({
                title: '🎤 Новая заявка на прослушивание',
                message: `Артист ${submission.artist_name} отправил заявку на прослушивание`,
                type: 'new_submission',
                related_entity_type: 'submission',
                related_entity_id: submissionId
              });
            } catch (notifError) {
              console.error('Failed to create notification:', notifError);
            }
          }
        }
        
        loadSubmissions();
      } else {
        toast({ title: '❌ Ошибка обновления', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: '❌ Ошибка обновления', variant: 'destructive' });
    }
  };

  const saveComment = async () => {
    if (!selectedSubmission) return;

    try {
      const response = await fetch(API_URL, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedSubmission.id,
          admin_comment: adminComment,
          reviewed_by: userId
        })
      });

      if (response.ok) {
        toast({ title: '✅ Комментарий сохранён' });
        setShowModal(false);
        setAdminComment('');
        setSelectedSubmission(null);
        loadSubmissions();
      } else {
        toast({ title: '❌ Ошибка сохранения', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: '❌ Ошибка сохранения', variant: 'destructive' });
    }
  };

  const openCommentModal = (submission: Submission) => {
    setSelectedSubmission(submission);
    setAdminComment(submission.admin_comment || '');
    setShowModal(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-500';
      case 'reviewing': return 'bg-yellow-500';
      case 'approved': return 'bg-green-500';
      case 'rejected': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'new': return 'Новая';
      case 'reviewing': return 'На рассмотрении';
      case 'approved': return 'Одобрена';
      case 'rejected': return 'Отклонена';
      default: return status;
    }
  };

  return (
    <div className="space-y-4 md:space-y-6 p-3 md:p-6">
      <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6">
        <Icon name="Music" size={24} className="text-primary md:hidden" />
        <Icon name="Music" size={32} className="text-primary hidden md:block" />
        <h1 className="text-xl md:text-3xl font-bold">Заявки</h1>
      </div>

      <PitchingManagement userId={userId} userRole={userRole} />
    </div>
  );
}