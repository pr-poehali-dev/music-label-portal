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

      setIsCreating(false);
      setFormData({ title: '', content: '', type: 'update', priority: 0, is_active: true });
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
      setFormData({ title: '', content: '', type: 'update', priority: 0, is_active: true });
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
    <div className="min-h-screen bg-gradient-to-br from-black via-purple-950/20 to-black">
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        
        {/* Hero Header */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-purple-600 via-pink-500 to-orange-500 p-[2px]">
          <div className="bg-black/90 backdrop-blur-xl rounded-3xl p-8 md:p-12">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-3 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-sm">
                    <Icon name="Radio" className="w-8 h-8 text-purple-400" />
                  </div>
                  <div>
                    <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 bg-clip-text text-transparent">
                      Центр новостей
                    </h1>
                    <p className="text-muted-foreground mt-1">Будьте в курсе всех обновлений лейбла</p>
                  </div>
                </div>
              </div>
              
              {/* Countdown */}
              <div className="flex flex-col items-end">
                <p className="text-sm text-muted-foreground mb-2">До следующего отчёта</p>
                <div className="flex gap-2">
                  {[
                    { label: 'дн', value: countdown.days },
                    { label: 'ч', value: countdown.hours },
                    { label: 'мин', value: countdown.minutes }
                  ].map(({ label, value }) => (
                    <div key={label} className="flex flex-col items-center bg-white/5 backdrop-blur-sm rounded-xl p-3 min-w-[60px]">
                      <div className="text-2xl font-bold bg-gradient-to-br from-purple-400 to-pink-400 bg-clip-text text-transparent tabular-nums">
                        {String(value).padStart(2, '0')}
                      </div>
                      <div className="text-[10px] text-muted-foreground uppercase">{label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex gap-2 flex-1">
            {[
              { key: 'update', label: 'Обновления', icon: 'Zap', count: stats.update, gradient: 'from-yellow-500 to-orange-500' },
              { key: 'faq', label: 'FAQ', icon: 'HelpCircle', count: stats.faq, gradient: 'from-blue-500 to-cyan-500' }
            ].map(({ key, label, icon, count, gradient }) => (
              <Button
                key={key}
                variant={selectedType === key ? 'default' : 'outline'}
                onClick={() => setSelectedType(key)}
                className={`gap-2 ${
                  selectedType === key 
                    ? `bg-gradient-to-r ${gradient} text-white border-0 shadow-lg` 
                    : 'bg-white/5 border-white/10 hover:bg-white/10'
                }`}
              >
                <Icon name={icon} className="w-4 h-4" />
                {label}
                <Badge variant="secondary" className={selectedType === key ? 'bg-white/20 text-white' : ''}>
                  {count}
                </Badge>
              </Button>
            ))}
          </div>
          
          {userRole === 'director' && (
            <Button
              onClick={() => {
                setIsCreating(true);
                setEditingNews(null);
                setFormData({ title: '', content: '', type: 'update', priority: 0, is_active: true });
              }}
              className="gap-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 shadow-lg"
            >
              <Icon name="Plus" className="w-4 h-4" />
              Создать новость
            </Button>
          )}
        </div>

        {/* News Grid */}
        <div className="grid md:grid-cols-2 gap-4">
          {filteredNews.map((item) => {
            const config = getTypeConfig(item.type);
            return (
              <Card 
                key={item.id} 
                className="group relative overflow-hidden border-white/10 bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl hover:shadow-2xl hover:shadow-purple-500/20 transition-all duration-300 hover:-translate-y-1"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${config.color === 'text-yellow-400' ? 'from-yellow-500/5 to-orange-500/5' : 'from-blue-500/5 to-cyan-500/5'} opacity-0 group-hover:opacity-100 transition-opacity`} />
                
                <div className="relative p-6">
                  <div className="flex items-start gap-4 mb-4">
                    <div className={`p-3 rounded-2xl bg-gradient-to-br ${config.color === 'text-yellow-400' ? 'from-yellow-500/20 to-orange-500/20' : 'from-blue-500/20 to-cyan-500/20'} backdrop-blur-sm`}>
                      <Icon name={config.icon} className={`w-6 h-6 ${config.color}`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <h3 
                          className="text-xl font-bold text-white leading-tight cursor-pointer hover:text-purple-400 transition-colors"
                          onClick={() => userRole === 'director' ? startEdit(item) : null}
                        >
                          {item.title}
                        </h3>
                        {userRole === 'director' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteNews(item.id);
                            }}
                            className="opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/20 hover:text-red-400 shrink-0"
                          >
                            <Icon name="Trash2" className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                      <Badge variant="outline" className={`${config.color} border-current/30 bg-current/10 text-xs mb-3`}>
                        {config.label}
                      </Badge>
                    </div>
                  </div>
                  
                  <p className="text-muted-foreground leading-relaxed mb-4">{item.content}</p>
                  
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <Icon name="Clock" className="w-4 h-4" />
                      {new Date(item.updated_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </span>
                    {userRole === 'director' && (
                      <button
                        onClick={() => startEdit(item)}
                        className="flex items-center gap-1 text-purple-400 hover:text-purple-300 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Icon name="Edit" className="w-4 h-4" />
                        Редактировать
                      </button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {filteredNews.length === 0 && (
          <div className="text-center py-16">
            <div className="inline-flex p-6 rounded-full bg-white/5 backdrop-blur-sm mb-4">
              <Icon name="Inbox" className="w-12 h-12 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground text-lg">Новостей пока нет</p>
          </div>
        )}

        {/* Вакансии Section */}
        <div className="mt-12">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-green-600 via-emerald-500 to-teal-500 p-[2px] mb-6">
            <div className="bg-black/90 backdrop-blur-xl rounded-3xl p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-green-500/20 backdrop-blur-sm">
                    <Icon name="Briefcase" className="w-6 h-6 text-green-400" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                      Открытые вакансии
                    </h2>
                    <p className="text-muted-foreground text-sm">Присоединяйтесь к нашей команде</p>
                  </div>
                  <Badge variant="secondary" className="bg-green-500/20 text-green-400 border-green-500/30">
                    {jobs.length}
                  </Badge>
                </div>
                {userRole === 'director' && (
                  <Button
                    onClick={() => {
                      setIsCreatingJob(true);
                      setEditingJob(null);
                      setJobFormData({ position: '', schedule: '', workplace: '', duties: '', salary: '', contact: '', is_active: true });
                    }}
                    className="gap-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 shadow-lg"
                  >
                    <Icon name="Plus" className="w-4 h-4" />
                    Добавить вакансию
                  </Button>
                )}
              </div>
            </div>
          </div>

          <div className="grid gap-6">
            {jobs.map((job) => (
              <Card 
                key={job.id} 
                className="group relative overflow-hidden border-green-500/20 bg-gradient-to-br from-green-900/10 via-emerald-900/5 to-transparent backdrop-blur-xl hover:shadow-2xl hover:shadow-green-500/20 transition-all duration-300"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                
                <div className="relative p-8">
                  <div className="flex gap-6">
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 backdrop-blur-sm shrink-0 h-fit">
                      <Icon name="Briefcase" className="w-8 h-8 text-green-400" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-4">
                        <h3 className="text-2xl font-bold text-white">{job.position}</h3>
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
                      
                      <div className="grid md:grid-cols-2 gap-4 mb-6">
                        <div className="flex items-center gap-3 bg-white/5 rounded-xl p-3">
                          <Icon name="Calendar" className="w-5 h-5 text-green-400" />
                          <div>
                            <p className="text-xs text-muted-foreground">График</p>
                            <p className="text-white font-medium">{job.schedule}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 bg-white/5 rounded-xl p-3">
                          <Icon name="MapPin" className="w-5 h-5 text-green-400" />
                          <div>
                            <p className="text-xs text-muted-foreground">Место работы</p>
                            <p className="text-white font-medium">{job.workplace}</p>
                          </div>
                        </div>
                      </div>

                      <div className="mb-6">
                        <p className="text-sm text-muted-foreground mb-2 flex items-center gap-2">
                          <Icon name="ListChecks" className="w-4 h-4" />
                          Обязанности:
                        </p>
                        <p className="text-white leading-relaxed pl-6">{job.duties}</p>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-green-500/20">
                        <div className="flex items-center gap-3 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-xl px-4 py-2">
                          <Icon name="Wallet" className="w-5 h-5 text-green-400" />
                          <span className="text-xl font-bold text-green-400">{job.salary}</span>
                        </div>
                        <a
                          href={job.contact}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-auto"
                        >
                          <Button className="gap-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 shadow-lg">
                            <Icon name="Send" className="w-4 h-4" />
                            Откликнуться
                          </Button>
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
          
          {jobs.length === 0 && (
            <div className="text-center py-16">
              <div className="inline-flex p-6 rounded-full bg-green-500/10 backdrop-blur-sm mb-4">
                <Icon name="Briefcase" className="w-12 h-12 text-green-400 opacity-50" />
              </div>
              <p className="text-muted-foreground text-lg">Вакансий пока нет</p>
            </div>
          )}
        </div>

      </div>

      {/* Модальное окно редактирования новостей */}
      <Dialog open={isCreating || !!editingNews} onOpenChange={(open) => {
        if (!open) {
          setIsCreating(false);
          setEditingNews(null);
        }
      }}>
        <DialogContent className="max-w-2xl bg-gradient-to-br from-gray-900 to-black border-white/10">
          <DialogHeader>
            <DialogTitle className="text-2xl">{editingNews ? 'Редактировать новость' : 'Создать новость'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Заголовок"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="bg-white/5 border-white/10"
            />
            <Textarea
              placeholder="Содержание"
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              rows={6}
              className="bg-white/5 border-white/10"
            />
            <div className="grid grid-cols-2 gap-4">
              <Select value={formData.type} onValueChange={(value: any) => setFormData({ ...formData, type: value })}>
                <SelectTrigger className="bg-white/5 border-white/10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="update">Обновление</SelectItem>
                  <SelectItem value="faq">FAQ</SelectItem>
                </SelectContent>
              </Select>
              <Input
                type="number"
                placeholder="Приоритет (0-100)"
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })}
                className="bg-white/5 border-white/10"
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
              <Button onClick={editingNews ? handleUpdateNews : handleCreateNews} className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500">
                <Icon name="Save" className="w-4 h-4 mr-2" />
                {editingNews ? 'Сохранить' : 'Создать'}
              </Button>
              <Button variant="outline" onClick={() => {
                setIsCreating(false);
                setEditingNews(null);
              }} className="border-white/10">
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
        <DialogContent className="max-w-2xl bg-gradient-to-br from-gray-900 to-black border-white/10">
          <DialogHeader>
            <DialogTitle className="text-2xl">{editingJob ? 'Редактировать вакансию' : 'Создать вакансию'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Должность"
              value={jobFormData.position}
              onChange={(e) => setJobFormData({ ...jobFormData, position: e.target.value })}
              className="bg-white/5 border-white/10"
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                placeholder="График (например, 5/2)"
                value={jobFormData.schedule}
                onChange={(e) => setJobFormData({ ...jobFormData, schedule: e.target.value })}
                className="bg-white/5 border-white/10"
              />
              <Input
                placeholder="Место работы"
                value={jobFormData.workplace}
                onChange={(e) => setJobFormData({ ...jobFormData, workplace: e.target.value })}
                className="bg-white/5 border-white/10"
              />
            </div>
            <Textarea
              placeholder="Обязанности"
              value={jobFormData.duties}
              onChange={(e) => setJobFormData({ ...jobFormData, duties: e.target.value })}
              rows={4}
              className="bg-white/5 border-white/10"
            />
            <Input
              placeholder="Зарплата (например, 15000₽ в месяц)"
              value={jobFormData.salary}
              onChange={(e) => setJobFormData({ ...jobFormData, salary: e.target.value })}
              className="bg-white/5 border-white/10"
            />
            <Input
              placeholder="Контакт для отклика (например, https://t.me/username)"
              value={jobFormData.contact}
              onChange={(e) => setJobFormData({ ...jobFormData, contact: e.target.value })}
              className="bg-white/5 border-white/10"
            />
            <div className="flex items-center gap-2">
              <Switch
                checked={jobFormData.is_active}
                onCheckedChange={(checked) => setJobFormData({ ...jobFormData, is_active: checked })}
              />
              <span className="text-sm">Активна</span>
            </div>
            <div className="flex gap-2 pt-4">
              <Button onClick={handleSaveJob} className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500">
                <Icon name="Save" className="w-4 h-4 mr-2" />
                {editingJob ? 'Сохранить' : 'Создать'}
              </Button>
              <Button variant="outline" onClick={() => {
                setIsCreatingJob(false);
                setEditingJob(null);
              }} className="border-white/10">
                Отмена
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
