import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import NewsCard from '@/components/NewsCard';
import JobCard from '@/components/JobCard';
import NewsDialog from '@/components/NewsDialog';
import JobDialog from '@/components/JobDialog';

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

  const startJobEdit = (job: Job) => {
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

  const filteredNews = news.filter(item => item.type === selectedType);
  const canManage = userRole === 'director' || userRole === 'manager';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-white/50">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <Card className="p-8 bg-gradient-to-br from-purple-900/50 to-pink-900/50 border-white/20">
        <h2 className="text-2xl font-bold mb-4 text-center">Отчетность</h2>
        <div className="grid grid-cols-4 gap-4 max-w-2xl mx-auto">
          {[
            { label: 'Дней', value: countdown.days },
            { label: 'Часов', value: countdown.hours },
            { label: 'Минут', value: countdown.minutes },
            { label: 'Секунд', value: countdown.seconds }
          ].map((item) => (
            <div key={item.label} className="text-center">
              <div className="text-4xl font-bold text-white mb-2">{item.value}</div>
              <div className="text-sm text-white/70">{item.label}</div>
            </div>
          ))}
        </div>
      </Card>

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex gap-2">
            <Button
              variant={selectedType === 'update' ? 'default' : 'outline'}
              onClick={() => setSelectedType('update')}
            >
              Обновления
            </Button>
            <Button
              variant={selectedType === 'faq' ? 'default' : 'outline'}
              onClick={() => setSelectedType('faq')}
            >
              FAQ
            </Button>
            <Button
              variant={selectedType === 'job' ? 'default' : 'outline'}
              onClick={() => setSelectedType('job')}
            >
              Вакансии
            </Button>
          </div>
          {canManage && (
            <div className="flex gap-2">
              {selectedType !== 'job' && (
                <Button onClick={() => setIsCreating(true)}>
                  <Icon name="Plus" className="w-4 h-4 mr-2" />
                  Создать новость
                </Button>
              )}
              {selectedType === 'job' && (
                <Button onClick={() => setIsCreatingJob(true)} variant="secondary">
                  <Icon name="Plus" className="w-4 h-4 mr-2" />
                  Создать вакансию
                </Button>
              )}
            </div>
          )}
        </div>

        <div className="space-y-4">
          {selectedType === 'job' ? (
            jobs.length === 0 ? (
              <Card className="p-8 text-center text-white/50 bg-white/5 border-white/10">
                Нет активных вакансий
              </Card>
            ) : (
              jobs.map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  userRole={userRole}
                  onEdit={startJobEdit}
                  onDelete={handleDeleteJob}
                />
              ))
            )
          ) : (
            filteredNews.length === 0 ? (
              <Card className="p-8 text-center text-white/50 bg-white/5 border-white/10">
                Нет новостей
              </Card>
            ) : (
              filteredNews.map((item) => (
                <NewsCard
                  key={item.id}
                  item={item}
                  userRole={userRole}
                  onEdit={startEdit}
                  onDelete={handleDeleteNews}
                />
              ))
            )
          )}
        </div>
      </div>

      <NewsDialog
        open={isCreating || !!editingNews}
        editingNews={editingNews}
        formData={formData}
        onOpenChange={(open) => {
          if (!open) {
            setIsCreating(false);
            setEditingNews(null);
          }
        }}
        onFormDataChange={setFormData}
        onSave={editingNews ? handleUpdateNews : handleCreateNews}
        onCancel={() => {
          setIsCreating(false);
          setEditingNews(null);
        }}
      />

      <JobDialog
        open={isCreatingJob || !!editingJob}
        editingJob={editingJob}
        jobFormData={jobFormData}
        onOpenChange={(open) => {
          if (!open) {
            setIsCreatingJob(false);
            setEditingJob(null);
          }
        }}
        onJobFormDataChange={setJobFormData}
        onSave={handleSaveJob}
        onCancel={() => {
          setIsCreatingJob(false);
          setEditingJob(null);
        }}
      />
    </div>
  );
}
