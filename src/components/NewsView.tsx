import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface News {
  id: number;
  title: string;
  content: string;
  type: 'update' | 'faq' | 'job';
  is_active: boolean;
  priority: number;
  created_at: string;
  updated_at: string;
  created_by: number | null;
}

interface Job {
  id: number;
  position: string;
  schedule: string;
  workplace: string;
  duties: string;
  salary: string;
  contact: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: number | null;
}

interface NewsViewProps {
  userRole: 'artist' | 'manager' | 'director';
  userId: number;
}

export default function NewsView({ userRole, userId }: NewsViewProps) {
  const [news, setNews] = useState<News[]>([]);
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [selectedType, setSelectedType] = useState<string>('update');
  const { toast } = useToast();
  
  const [editingNews, setEditingNews] = useState<News | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    type: 'update' as 'update' | 'faq' | 'job',
    priority: 0,
    is_active: true
  });

  const [jobs, setJobs] = useState<Job[]>([]);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [isCreatingJob, setIsCreatingJob] = useState(false);
  const [jobFormData, setJobFormData] = useState({
    position: '',
    schedule: '',
    workplace: '',
    duties: '',
    salary: '',
    contact: '',
    is_active: true
  });

  const loadJobs = async () => {
    try {
      const response = await fetch('https://functions.poehali.dev/57ba52aa-ffc4-4822-b9ee-d1847947bc41');
      const data = await response.json();
      setJobs(data);
    } catch (error) {
      console.error('Failed to load jobs:', error);
    }
  };

  const loadNews = async () => {
    try {
      const response = await fetch('https://functions.poehali.dev/02b8e089-cfba-4460-9cad-479b3d0c5c80');
      const data = await response.json();
      setNews(data);
    } catch (error) {
      console.error('Failed to load news:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить новости',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateCountdown = () => {
    const reportDates = [
      new Date(new Date().getFullYear(), 3, 30),
      new Date(new Date().getFullYear(), 5, 30),
      new Date(new Date().getFullYear(), 9, 30),
      new Date(new Date().getFullYear() + 1, 1, 28)
    ];
    
    const now = new Date();
    const nextReport = reportDates.find(date => date > now) || reportDates[0];
    
    const diff = nextReport.getTime() - now.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    setCountdown({ days, hours, minutes, seconds });
  };

  useEffect(() => {
    loadNews();
    loadJobs();
    calculateCountdown();
    const interval = setInterval(calculateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleCreateNews = async () => {
    try {
      const response = await fetch('https://functions.poehali.dev/02b8e089-cfba-4460-9cad-479b3d0c5c80', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': userId.toString()
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) throw new Error('Failed to create news');

      toast({
        title: 'Успешно',
        description: 'Новость создана'
      });

      setFormData({ title: '', content: '', type: 'update', priority: 0, is_active: true });
      setIsCreating(false);
      loadNews();
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось создать новость',
        variant: 'destructive'
      });
    }
  };

  const handleUpdateNews = async () => {
    if (!editingNews) return;

    try {
      const response = await fetch('https://functions.poehali.dev/02b8e089-cfba-4460-9cad-479b3d0c5c80', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': userId.toString()
        },
        body: JSON.stringify({ ...formData, id: editingNews.id })
      });

      if (!response.ok) throw new Error('Failed to update news');

      toast({
        title: 'Успешно',
        description: 'Новость обновлена'
      });

      setEditingNews(null);
      loadNews();
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось обновить новость',
        variant: 'destructive'
      });
    }
  };

  const startEdit = (item: News) => {
    setEditingNews(item);
    setFormData({
      title: item.title,
      content: item.content,
      type: item.type,
      priority: item.priority,
      is_active: item.is_active
    });
  };

  const handleDeleteNews = async (id: number) => {
    if (!confirm('Вы уверены, что хотите удалить эту новость?')) return;

    try {
      const response = await fetch(`https://functions.poehali.dev/02b8e089-cfba-4460-9cad-479b3d0c5c80?id=${id}`, {
        method: 'DELETE',
        headers: {
          'X-User-Id': userId.toString()
        }
      });

      if (!response.ok) throw new Error('Failed to delete news');

      toast({
        title: 'Успешно',
        description: 'Новость удалена'
      });

      loadNews();
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось удалить новость',
        variant: 'destructive'
      });
    }
  };

  const handleSaveJob = async () => {
    try {
      const url = editingJob 
        ? `https://functions.poehali.dev/57ba52aa-ffc4-4822-b9ee-d1847947bc41?id=${editingJob.id}`
        : 'https://functions.poehali.dev/57ba52aa-ffc4-4822-b9ee-d1847947bc41';
      
      const response = await fetch(url, {
        method: editingJob ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': userId.toString()
        },
        body: JSON.stringify(jobFormData)
      });

      if (!response.ok) throw new Error('Failed to save job');

      toast({
        title: 'Успешно',
        description: editingJob ? 'Вакансия обновлена' : 'Вакансия создана'
      });

      setEditingJob(null);
      setIsCreatingJob(false);
      setJobFormData({ position: '', schedule: '', workplace: '', duties: '', salary: '', contact: '', is_active: true });
      loadJobs();
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось сохранить вакансию',
        variant: 'destructive'
      });
    }
  };

  const handleDeleteJob = async (id: number) => {
    if (!confirm('Вы уверены, что хотите удалить эту вакансию?')) return;

    try {
      const response = await fetch(`https://functions.poehali.dev/57ba52aa-ffc4-4822-b9ee-d1847947bc41?id=${id}`, {
        method: 'DELETE',
        headers: {
          'X-User-Id': userId.toString()
        }
      });

      if (!response.ok) throw new Error('Failed to delete job');

      toast({
        title: 'Успешно',
        description: 'Вакансия удалена'
      });

      loadJobs();
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось удалить вакансию',
        variant: 'destructive'
      });
    }
  };

  const startEditJob = (job: Job) => {
    setEditingJob(job);
    setJobFormData({
      position: job.position,
      schedule: job.schedule,
      workplace: job.workplace,
      duties: job.duties,
      salary: job.salary,
      contact: job.contact,
      is_active: job.is_active
    });
  };

  const getTypeConfig = (type: string) => {
    switch (type) {
      case 'update': 
        return { icon: 'Zap', label: 'Обновление', color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30' };
      case 'faq': 
        return { icon: 'HelpCircle', label: 'FAQ', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30' };
      case 'job': 
        return { icon: 'Briefcase', label: 'Вакансия', color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/30' };
      default: 
        return { icon: 'Info', label: type, color: 'text-gray-400', bg: 'bg-gray-500/10', border: 'border-gray-500/30' };
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Icon name="Loader2" className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const updateNews = news.filter(n => n.type === 'update');
  const faqNews = news.filter(n => n.type === 'faq');
  
  const filteredNews = selectedType === 'update' ? updateNews : faqNews;
  const stats = {
    update: updateNews.length,
    faq: faqNews.length
  };

  return (
    <div className="max-w-5xl mx-auto space-y-4 px-2 md:px-0">
      {/* Компактный счетчик */}
      <Card className="overflow-hidden border-purple-500/30 bg-gradient-to-br from-purple-900/20 via-blue-900/10 to-transparent backdrop-blur-sm">
        <div className="flex flex-col md:flex-row items-center justify-between p-4 md:p-6 gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-500/20">
              <Icon name="CalendarClock" className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Следующий отчет</h3>
              <p className="text-lg font-bold text-white">30 октября 2025</p>
            </div>
          </div>
          <div className="flex gap-2 md:gap-4">
            {[
              { label: 'дн', value: countdown.days },
              { label: 'ч', value: countdown.hours },
              { label: 'мин', value: countdown.minutes },
              { label: 'сек', value: countdown.seconds }
            ].map(({ label, value }) => (
              <div key={label} className="flex flex-col items-center min-w-[60px] md:min-w-[70px]">
                <div className="text-2xl md:text-3xl font-bold text-purple-400 tabular-nums">{String(value).padStart(2, '0')}</div>
                <div className="text-xs text-muted-foreground uppercase">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Фильтры */}
      <div className="flex flex-wrap gap-2">
        {[
          { key: 'update', label: 'Обновления', icon: 'Zap', count: stats.update },
          { key: 'faq', label: 'FAQ', icon: 'HelpCircle', count: stats.faq }
        ].map(({ key, label, icon, count }) => (
          <Button
            key={key}
            variant={selectedType === key ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedType(key)}
            className="gap-2"
          >
            <Icon name={icon} className="w-4 h-4" />
            {label}
            <Badge variant="secondary" className="ml-1">{count}</Badge>
          </Button>
        ))}
        
        {userRole === 'director' && (
          <Button
            size="sm"
            onClick={() => {
              setIsCreating(true);
              setEditingNews(null);
              setFormData({ title: '', content: '', type: 'update', priority: 0, is_active: true });
            }}
            className="ml-auto gap-2"
          >
            <Icon name="Plus" className="w-4 h-4" />
            Создать
          </Button>
        )}
      </div>

      {/* Список новостей - компактный grid */}
      <div className="grid gap-3">
        {filteredNews.map((item) => {
          const config = getTypeConfig(item.type);
          return (
            <Card 
              key={item.id} 
              className={`p-4 border ${config.border} ${config.bg} backdrop-blur-sm hover:scale-[1.01] transition-transform group`}
            >
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${config.bg} shrink-0`}>
                  <Icon name={config.icon} className={`w-5 h-5 ${config.color}`} />
                </div>
                <div className="flex-1 min-w-0" onClick={() => userRole === 'director' ? startEdit(item) : null} className={userRole === 'director' ? 'cursor-pointer' : ''}>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-semibold text-white text-base leading-tight">{item.title}</h3>
                    <Badge variant="outline" className={`${config.color} shrink-0 text-xs`}>
                      {config.label}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">{item.content}</p>
                  <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Icon name="Clock" className="w-3 h-3" />
                      {new Date(item.updated_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
                    </span>
                    {userRole === 'director' && (
                      <span className="flex items-center gap-1 ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                        <Icon name="Edit" className="w-3 h-3" />
                        Редактировать
                      </span>
                    )}
                  </div>
                </div>
                {userRole === 'director' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteNews(item.id);
                    }}
                    className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/20 hover:text-red-400"
                  >
                    <Icon name="Trash2" className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {filteredNews.length === 0 && (
        <Card className="p-8 text-center">
          <Icon name="Inbox" className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">Новостей пока нет</p>
        </Card>
      )}

      {/* Вакансии - отдельный блок */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Icon name="Briefcase" className="w-5 h-5 text-green-400" />
            <h2 className="text-xl font-bold text-white">Открытые вакансии</h2>
            <Badge variant="secondary" className="ml-2">{jobs.length}</Badge>
          </div>
          {userRole === 'director' && (
            <Button
              size="sm"
              onClick={() => {
                setIsCreatingJob(true);
                setEditingJob(null);
                setJobFormData({ position: '', schedule: '', workplace: '', duties: '', salary: '', contact: '', is_active: true });
              }}
              className="gap-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 border-green-500/30"
              variant="outline"
            >
              <Icon name="Plus" className="w-4 h-4" />
              Добавить вакансию
            </Button>
          )}
        </div>
        <div className="grid gap-4">
          {jobs.map((job) => (
            <Card 
              key={job.id} 
              className="p-6 border-green-500/30 bg-gradient-to-br from-green-900/20 via-emerald-900/10 to-transparent backdrop-blur-sm hover:scale-[1.01] transition-transform group"
            >
              <div className="flex gap-4">
                <div className="p-3 rounded-xl bg-green-500/20 shrink-0 h-fit">
                  <Icon name="Briefcase" className="w-6 h-6 text-green-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <h3 className="text-xl font-bold text-white">{job.position}</h3>
                    {userRole === 'director' && (
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => startEditJob(job)}
                          className="hover:bg-green-500/20 hover:text-green-400"
                        >
                          <Icon name="Edit" className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteJob(job.id)}
                          className="hover:bg-red-500/20 hover:text-red-400"
                        >
                          <Icon name="Trash2" className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-3 mb-4">
                    <div className="flex items-center gap-2 text-sm">
                      <Icon name="Calendar" className="w-4 h-4 text-green-400" />
                      <span className="text-muted-foreground">График:</span>
                      <span className="text-white font-medium">{job.schedule}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Icon name="MapPin" className="w-4 h-4 text-green-400" />
                      <span className="text-muted-foreground">Место:</span>
                      <span className="text-white font-medium">{job.workplace}</span>
                    </div>
                  </div>

                  <div className="space-y-3 mb-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Обязанности:</p>
                      <p className="text-white leading-relaxed">{job.duties}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 pt-3 border-t border-green-500/20">
                    <div className="flex items-center gap-2">
                      <Icon name="Wallet" className="w-4 h-4 text-green-400" />
                      <span className="text-lg font-bold text-green-400">{job.salary}</span>
                    </div>
                    <a
                      href={job.contact}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-auto"
                    >
                      <Button className="gap-2 bg-green-500 hover:bg-green-600">
                        <Icon name="Send" className="w-4 h-4" />
                        Откликнуться
                      </Button>
                    </a>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
        {jobs.length === 0 && (
          <Card className="p-8 text-center border-green-500/30">
            <Icon name="Briefcase" className="w-12 h-12 mx-auto text-green-400 mb-3 opacity-50" />
            <p className="text-muted-foreground">Вакансий пока нет</p>
          </Card>
        )}
      </div>

      {/* Модальное окно редактирования */}
      <Dialog open={isCreating || !!editingNews} onOpenChange={(open) => {
        if (!open) {
          setIsCreating(false);
          setEditingNews(null);
        }
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingNews ? 'Редактировать новость' : 'Создать новость'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Заголовок"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
            <Textarea
              placeholder="Содержание"
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              rows={6}
            />
            <div className="grid grid-cols-2 gap-4">
              <Select value={formData.type} onValueChange={(value: any) => setFormData({ ...formData, type: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="update">Обновление</SelectItem>
                  <SelectItem value="faq">FAQ</SelectItem>
                  <SelectItem value="job">Вакансия</SelectItem>
                </SelectContent>
              </Select>
              <Input
                type="number"
                placeholder="Приоритет (0-100)"
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
              <span className="text-sm">Активна</span>
            </div>
            <div className="flex gap-2 pt-4">
              <Button onClick={editingNews ? handleUpdateNews : handleCreateNews} className="flex-1">
                <Icon name="Save" className="w-4 h-4 mr-2" />
                {editingNews ? 'Сохранить' : 'Создать'}
              </Button>
              <Button variant="outline" onClick={() => {
                setIsCreating(false);
                setEditingNews(null);
              }}>
                Отмена
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Модальное окно для вакансий */}
      <Dialog open={isCreatingJob || !!editingJob} onOpenChange={(open) => {
        if (!open) {
          setIsCreatingJob(false);
          setEditingJob(null);
        }
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingJob ? 'Редактировать вакансию' : 'Создать вакансию'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Должность"
              value={jobFormData.position}
              onChange={(e) => setJobFormData({ ...jobFormData, position: e.target.value })}
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                placeholder="График (например, 5/2)"
                value={jobFormData.schedule}
                onChange={(e) => setJobFormData({ ...jobFormData, schedule: e.target.value })}
              />
              <Input
                placeholder="Место работы"
                value={jobFormData.workplace}
                onChange={(e) => setJobFormData({ ...jobFormData, workplace: e.target.value })}
              />
            </div>
            <Textarea
              placeholder="Обязанности"
              value={jobFormData.duties}
              onChange={(e) => setJobFormData({ ...jobFormData, duties: e.target.value })}
              rows={4}
            />
            <Input
              placeholder="Зарплата (например, 15000₽ в месяц)"
              value={jobFormData.salary}
              onChange={(e) => setJobFormData({ ...jobFormData, salary: e.target.value })}
            />
            <Input
              placeholder="Контакт для отклика (например, https://t.me/username)"
              value={jobFormData.contact}
              onChange={(e) => setJobFormData({ ...jobFormData, contact: e.target.value })}
            />
            <div className="flex items-center gap-2">
              <Switch
                checked={jobFormData.is_active}
                onCheckedChange={(checked) => setJobFormData({ ...jobFormData, is_active: checked })}
              />
              <span className="text-sm">Активна</span>
            </div>
            <div className="flex gap-2 pt-4">
              <Button onClick={handleSaveJob} className="flex-1">
                <Icon name="Save" className="w-4 h-4 mr-2" />
                {editingJob ? 'Сохранить' : 'Создать'}
              </Button>
              <Button variant="outline" onClick={() => {
                setIsCreatingJob(false);
                setEditingJob(null);
              }}>
                Отмена
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}