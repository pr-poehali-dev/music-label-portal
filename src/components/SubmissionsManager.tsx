import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Icon from '@/components/ui/icon';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

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
}

const API_URL = 'https://functions.poehali.dev/40a44285-32b8-4e3e-8f8f-b77f16293727';

export default function SubmissionsManager({ userId }: SubmissionsManagerProps) {
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
    <div className="space-y-4">
      <Card className="bg-black/40 border-yellow-500/20 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-yellow-400 flex items-center gap-2">
              <Icon name="Music" size={24} />
              Заявки на прослушивание
            </CardTitle>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48 bg-black/60 border-yellow-500/30">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все заявки</SelectItem>
                <SelectItem value="new">Новые</SelectItem>
                <SelectItem value="reviewing">На рассмотрении</SelectItem>
                <SelectItem value="approved">Одобренные</SelectItem>
                <SelectItem value="rejected">Отклонённые</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {submissions.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Icon name="Inbox" size={48} className="mx-auto mb-4 opacity-50" />
              <p>Заявок не найдено</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              {submissions.map((submission) => (
                <Card key={submission.id} className="bg-black/60 border-yellow-500/20">
                  <CardContent className="p-4">
                    <div className="flex flex-col gap-3">
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <Icon name="User" size={18} className="text-yellow-400" />
                            <h3 className="font-semibold text-white text-lg">{submission.artist_name}</h3>
                          </div>
                          <Badge className={getStatusColor(submission.status)}>
                            {getStatusText(submission.status)}
                          </Badge>
                        </div>

                        <div className="space-y-1 text-sm">
                          <div className="flex items-center gap-2 text-gray-300">
                            <Icon name="Music" size={14} className="text-yellow-400" />
                            <a href={submission.track_link} target="_blank" rel="noopener noreferrer" 
                               className="hover:text-yellow-400 transition-colors break-all">
                              {submission.track_link}
                            </a>
                          </div>

                          {submission.contact_link && (
                            <div className="flex items-center gap-2 text-gray-300">
                              <Icon name="MessageCircle" size={14} className="text-yellow-400" />
                              <span>{submission.contact_link}</span>
                            </div>
                          )}

                          {submission.message && (
                            <div className="flex items-start gap-2 text-gray-300 mt-2">
                              <Icon name="FileText" size={14} className="text-yellow-400 mt-1" />
                              <p className="italic">{submission.message}</p>
                            </div>
                          )}

                          {submission.admin_comment && (
                            <div className="mt-2 p-2 bg-yellow-500/10 rounded border border-yellow-500/20">
                              <p className="text-xs text-gray-400 mb-1">Комментарий:</p>
                              <p className="text-sm text-gray-200">{submission.admin_comment}</p>
                            </div>
                          )}

                          <div className="flex items-center gap-2 text-xs text-gray-500 mt-2">
                            <Icon name="Calendar" size={12} />
                            {new Date(submission.created_at).toLocaleString('ru-RU')}
                            {submission.reviewed_by_name && (
                              <>
                                <span className="mx-1">•</span>
                                <Icon name="User" size={12} />
                                Проверил: {submission.reviewed_by_name}
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        <Button
                          size="sm"
                          onClick={() => openCommentModal(submission)}
                          className="bg-blue-500 hover:bg-blue-600 w-full"
                        >
                          <Icon name="MessageSquare" size={14} className="mr-1" />
                          Комментарий
                        </Button>

                        {submission.status !== 'approved' && (
                          <Button
                            size="sm"
                            onClick={() => updateStatus(submission.id, 'approved')}
                            className="bg-green-500 hover:bg-green-600 w-full"
                          >
                            <Icon name="Check" size={14} className="mr-1" />
                            Одобрить
                          </Button>
                        )}

                        {submission.status !== 'rejected' && (
                          <Button
                            size="sm"
                            onClick={() => updateStatus(submission.id, 'rejected')}
                            className="bg-red-500 hover:bg-red-600 w-full"
                          >
                            <Icon name="X" size={14} className="mr-1" />
                            Отклонить
                          </Button>
                        )}

                        {submission.status === 'new' && (
                          <Button
                            size="sm"
                            onClick={() => updateStatus(submission.id, 'reviewing')}
                            className="bg-yellow-500 hover:bg-yellow-600 w-full"
                          >
                            <Icon name="Eye" size={14} className="mr-1" />
                            В работу
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {showModal && selectedSubmission && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md bg-card border-yellow-500/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-yellow-400">
                <Icon name="MessageSquare" size={24} />
                Комментарий к заявке
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="font-semibold text-white mb-2">{selectedSubmission.artist_name}</p>
                <p className="text-sm text-gray-400 mb-4">
                  {selectedSubmission.track_link}
                </p>
              </div>
              
              <Textarea
                placeholder="Оставьте комментарий для команды..."
                value={adminComment}
                onChange={(e) => setAdminComment(e.target.value)}
                className="min-h-[120px] bg-black/60 border-yellow-500/30"
              />

              <div className="flex gap-2">
                <Button onClick={saveComment} className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-black">
                  <Icon name="Save" size={16} className="mr-2" />
                  Сохранить
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => { setShowModal(false); setAdminComment(''); setSelectedSubmission(null); }} 
                  className="flex-1"
                >
                  Отмена
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}