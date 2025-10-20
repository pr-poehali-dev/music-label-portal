import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

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

interface NewsViewProps {
  userRole: 'artist' | 'manager' | 'director';
  userId: number;
}

export default function NewsView({ userRole, userId }: NewsViewProps) {
  const [news, setNews] = useState<News[]>([]);
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
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
      new Date(new Date().getFullYear(), 3, 30), // 30 апреля
      new Date(new Date().getFullYear(), 5, 30), // 30 июня
      new Date(new Date().getFullYear(), 9, 30), // 30 октября
      new Date(new Date().getFullYear() + 1, 1, 28) // 28 февраля следующего года
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

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'update': return 'Megaphone';
      case 'faq': return 'HelpCircle';
      case 'job': return 'Briefcase';
      default: return 'Info';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'update': return 'Обновление';
      case 'faq': return 'FAQ';
      case 'job': return 'Вакансия';
      default: return type;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Icon name="Loader2" className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 px-2 md:px-0">
      {/* Счетчик до отчета */}
      <Card className="p-6 bg-gradient-to-br from-purple-900/20 to-blue-900/20 border-purple-500/30">
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-2">
            <Icon name="Clock" className="w-6 h-6 text-purple-400" />
            <h2 className="text-2xl font-bold text-white">До следующего отчета</h2>
          </div>
          <div className="grid grid-cols-4 gap-4 max-w-md mx-auto">
            {[
              { label: 'Дней', value: countdown.days },
              { label: 'Часов', value: countdown.hours },
              { label: 'Минут', value: countdown.minutes },
              { label: 'Секунд', value: countdown.seconds }
            ].map(({ label, value }) => (
              <div key={label} className="bg-black/30 rounded-lg p-4">
                <div className="text-3xl font-bold text-purple-400">{value}</div>
                <div className="text-sm text-muted-foreground">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {userRole === 'director' && (
        <Card className="p-4 bg-card/60 backdrop-blur-sm border-border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Icon name="Settings" className="w-5 h-5 text-primary" />
              Управление новостями
            </h3>
            <Button onClick={() => {
              setIsCreating(true);
              setEditingNews(null);
              setFormData({ title: '', content: '', type: 'update', priority: 0, is_active: true });
            }}>
              <Icon name="Plus" className="w-4 h-4 mr-2" />
              Создать новость
            </Button>
          </div>

          {(isCreating || editingNews) && (
            <div className="space-y-4 p-4 bg-black/20 rounded-lg">
              <Input
                placeholder="Заголовок"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
              <Textarea
                placeholder="Содержание"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                rows={5}
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
                  placeholder="Приоритет"
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
              <div className="flex gap-2">
                <Button onClick={editingNews ? handleUpdateNews : handleCreateNews}>
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
          )}
        </Card>
      )}

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-card/60 backdrop-blur-sm">
          <TabsTrigger value="all">Все</TabsTrigger>
          <TabsTrigger value="update">Обновления</TabsTrigger>
          <TabsTrigger value="faq">FAQ</TabsTrigger>
          <TabsTrigger value="job">Вакансии</TabsTrigger>
        </TabsList>

        {['all', 'update', 'faq', 'job'].map((tab) => (
          <TabsContent key={tab} value={tab} className="space-y-4">
            {news
              .filter(item => tab === 'all' || item.type === tab)
              .map((item) => (
                <Card key={item.id} className="p-6 bg-card/60 backdrop-blur-sm border-border hover:border-primary/50 transition-all">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Icon name={getTypeIcon(item.type)} className="w-6 h-6 text-primary" />
                      <div>
                        <h3 className="text-xl font-semibold">{item.title}</h3>
                        <p className="text-sm text-muted-foreground">{getTypeLabel(item.type)}</p>
                      </div>
                    </div>
                    {userRole === 'director' && (
                      <Button variant="ghost" size="sm" onClick={() => startEdit(item)}>
                        <Icon name="Edit" className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                  <p className="text-muted-foreground whitespace-pre-wrap">{item.content}</p>
                  <div className="mt-4 text-xs text-muted-foreground">
                    Обновлено: {new Date(item.updated_at).toLocaleDateString('ru-RU')}
                  </div>
                </Card>
              ))}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
