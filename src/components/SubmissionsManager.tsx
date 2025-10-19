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

      <Tabs defaultValue="submissions" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-card/60 backdrop-blur-sm border border-border rounded-xl p-1">
          <TabsTrigger value="submissions" className="flex items-center gap-2">
            <Icon name="Headphones" className="w-4 h-4 text-purple-500 animate-pulse" />
            Прослушивания
          </TabsTrigger>
          <TabsTrigger value="pitchings" className="flex items-center gap-2">
            <Icon name="Target" className="w-4 h-4 text-red-500 animate-pulse" />
            Питчинги
          </TabsTrigger>
        </TabsList>

        <TabsContent value="submissions" className="space-y-4 md:space-y-6 mt-4 md:mt-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <h2 className="text-lg md:text-xl font-semibold">Заявки на прослушивание</h2>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
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

      {submissions.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Icon name="Inbox" size={48} className="mx-auto mb-4 opacity-50 text-muted-foreground" />
            <p className="text-muted-foreground">Заявок не найдено</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {submissions.map((submission) => (
            <Card key={submission.id}>
              <CardContent className="p-4">
                <div className="flex flex-col gap-3">
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Icon name="User" size={18} className="text-primary" />
                        <h3 className="font-semibold text-lg">{submission.artist_name}</h3>
                      </div>
                      <Badge className={getStatusColor(submission.status)}>
                        {getStatusText(submission.status)}
                      </Badge>
                    </div>

                    <div className="space-y-1 text-sm">
                      <div className="flex items-center gap-2">
                        <Icon name="Music" size={14} className="text-primary" />
                        <a href={submission.track_link} target="_blank" rel="noopener noreferrer" 
                           className="hover:text-primary transition-colors break-all text-muted-foreground">
                          {submission.track_link}
                        </a>
                      </div>

                      {submission.contact_link && (
                        <div className="flex items-center gap-2">
                          <Icon name="MessageCircle" size={14} className="text-primary" />
                          <span className="text-muted-foreground">{submission.contact_link}</span>
                        </div>
                      )}

                      {submission.message && (
                        <div className="flex items-start gap-2 mt-2">
                          <Icon name="FileText" size={14} className="text-primary mt-1" />
                          <p className="italic text-muted-foreground">{submission.message}</p>
                        </div>
                      )}

                      {submission.admin_comment && (
                        <div className="mt-2 p-2 bg-primary/10 rounded border border-primary/20">
                          <p className="text-xs text-muted-foreground mb-1">Комментарий:</p>
                          <p className="text-sm">{submission.admin_comment}</p>
                        </div>
                      )}

                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
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

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="sm" variant="outline" className="w-full">
                        <Icon name="MoreVertical" size={16} className="mr-1" />
                        Действия
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem 
                        onClick={() => openCommentModal(submission)}
                        className="cursor-pointer"
                      >
                        <Icon name="MessageSquare" size={14} className="mr-2" />
                        Комментарий
                      </DropdownMenuItem>
                      
                      {submission.status !== 'approved' && (
                        <DropdownMenuItem 
                          onClick={() => updateStatus(submission.id, 'approved')}
                          className="cursor-pointer"
                        >
                          <Icon name="Check" size={14} className="mr-2 text-green-500" />
                          Одобрить
                        </DropdownMenuItem>
                      )}
                      
                      {submission.status !== 'rejected' && (
                        <DropdownMenuItem 
                          onClick={() => updateStatus(submission.id, 'rejected')}
                          className="cursor-pointer"
                        >
                          <Icon name="X" size={14} className="mr-2 text-red-500" />
                          Отклонить
                        </DropdownMenuItem>
                      )}
                      
                      {submission.status === 'new' && (
                        <DropdownMenuItem 
                          onClick={() => updateStatus(submission.id, 'reviewing')}
                          className="cursor-pointer"
                        >
                          <Icon name="Eye" size={14} className="mr-2" />
                          В работу
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {showModal && selectedSubmission && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon name="MessageSquare" size={20} />
                Комментарий к заявке
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="font-semibold mb-2">{selectedSubmission.artist_name}</p>
                <p className="text-sm text-muted-foreground mb-4">
                  {selectedSubmission.track_link}
                </p>
              </div>
              
              <Textarea
                placeholder="Оставьте комментарий для команды..."
                value={adminComment}
                onChange={(e) => setAdminComment(e.target.value)}
                className="min-h-[120px]"
              />

              <div className="flex gap-2">
                <Button onClick={saveComment} className="flex-1">
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
        </TabsContent>

        <TabsContent value="pitchings" className="mt-6">
          <PitchingManagement userId={userId} userRole={userRole} />
        </TabsContent>
      </Tabs>
    </div>
  );
}