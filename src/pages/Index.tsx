import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

interface User {
  id: number;
  username: string;
  role: 'artist' | 'manager';
  full_name: string;
}

interface Ticket {
  id: number;
  title: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  created_by: number;
  creator_name: string;
  created_at: string;
}

const API_URLS = {
  auth: 'https://functions.poehali.dev/d2601eec-1d55-4956-b655-187431987ed9',
  tickets: 'https://functions.poehali.dev/cdcd7646-5a98-477f-8464-d1aa48319296'
};

export default function Index() {
  const [user, setUser] = useState<User | null>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [newTicket, setNewTicket] = useState({ title: '', description: '', priority: 'medium' });
  const { toast } = useToast();

  const login = async () => {
    try {
      const response = await fetch(API_URLS.auth, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setUser(data.user);
        localStorage.setItem('user', JSON.stringify(data.user));
        toast({ title: '✅ Вход выполнен', description: `Добро пожаловать, ${data.user.full_name}` });
      } else {
        toast({ title: '❌ Ошибка', description: data.error, variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: '❌ Ошибка подключения', variant: 'destructive' });
    }
  };

  const loadTickets = async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (user?.role === 'artist') params.append('user_id', String(user.id));
      
      const response = await fetch(`${API_URLS.tickets}?${params}`);
      const data = await response.json();
      setTickets(data.tickets || []);
    } catch (error) {
      console.error('Failed to load tickets:', error);
    }
  };

  const createTicket = async () => {
    if (!newTicket.title || !newTicket.description || !user) return;
    
    try {
      const response = await fetch(API_URLS.tickets, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newTicket, created_by: user.id })
      });
      
      if (response.ok) {
        setNewTicket({ title: '', description: '', priority: 'medium' });
        toast({ title: '✅ Тикет создан' });
        loadTickets();
      }
    } catch (error) {
      toast({ title: '❌ Ошибка создания тикета', variant: 'destructive' });
    }
  };

  const updateTicketStatus = async (ticketId: number, status: string) => {
    try {
      await fetch(API_URLS.tickets, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: ticketId, status })
      });
      
      toast({ title: '✅ Статус обновлен' });
      loadTickets();
    } catch (error) {
      toast({ title: '❌ Ошибка обновления', variant: 'destructive' });
    }
  };

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  useEffect(() => {
    if (user) {
      loadTickets();
    }
  }, [user, statusFilter]);

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    toast({ title: 'Вы вышли из системы' });
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      low: 'bg-blue-500',
      medium: 'bg-yellow-500',
      high: 'bg-orange-500',
      urgent: 'bg-red-500'
    };
    return colors[priority as keyof typeof colors] || 'bg-gray-500';
  };

  const getStatusColor = (status: string) => {
    const colors = {
      open: 'bg-blue-600',
      in_progress: 'bg-yellow-600',
      resolved: 'bg-green-600',
      closed: 'bg-gray-600'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-600';
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-zinc-900 to-zinc-800 p-4">
        <Card className="w-full max-w-md border-primary/20 bg-card/95 backdrop-blur">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-24 h-24 rounded-full bg-gradient-to-br from-primary to-yellow-600 flex items-center justify-center">
              <span className="text-4xl font-bold text-black">420</span>
            </div>
            <CardTitle className="text-3xl font-bold text-primary">420 SMM</CardTitle>
            <CardDescription className="text-muted-foreground">Музыкальный лейбл • Техподдержка</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Логин</Label>
              <Input
                id="username"
                placeholder="Введите логин"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && login()}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Пароль</Label>
              <Input
                id="password"
                type="password"
                placeholder="Введите пароль"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && login()}
              />
            </div>
            <Button onClick={login} className="w-full bg-primary hover:bg-primary/90 text-black font-semibold">
              Войти
            </Button>
            <div className="text-xs text-center text-muted-foreground pt-2">
              Тестовые данные: manager/12345, artist1/12345
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-zinc-900 to-zinc-800">
      <header className="border-b border-primary/20 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-yellow-600 flex items-center justify-center">
              <span className="text-xl font-bold text-black">420</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-primary">420 SMM</h1>
              <p className="text-xs text-muted-foreground">Техподдержка лейбла</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium text-foreground">{user.full_name}</p>
              <p className="text-xs text-muted-foreground">
                {user.role === 'manager' ? '🎯 Руководитель' : '🎤 Артист'}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={logout} className="border-primary/30">
              <Icon name="LogOut" size={16} />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue={user.role === 'artist' ? 'create' : 'manage'} className="space-y-6">
          <TabsList className="bg-card/50 border border-primary/20">
            {user.role === 'artist' && (
              <TabsTrigger value="create" className="data-[state=active]:bg-primary data-[state=active]:text-black">
                <Icon name="Plus" size={16} className="mr-2" />
                Создать тикет
              </TabsTrigger>
            )}
            <TabsTrigger value="manage" className="data-[state=active]:bg-primary data-[state=active]:text-black">
              <Icon name="List" size={16} className="mr-2" />
              {user.role === 'manager' ? 'Управление' : 'Мои тикеты'}
            </TabsTrigger>
          </TabsList>

          {user.role === 'artist' && (
            <TabsContent value="create">
              <Card className="border-primary/20 bg-card/95">
                <CardHeader>
                  <CardTitle className="text-primary">Новый запрос в техподдержку</CardTitle>
                  <CardDescription>Опишите вашу проблему или запрос</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Тема запроса</Label>
                    <Input
                      id="title"
                      placeholder="Краткое описание проблемы"
                      value={newTicket.title}
                      onChange={(e) => setNewTicket({ ...newTicket, title: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Подробное описание</Label>
                    <Textarea
                      id="description"
                      placeholder="Опишите ситуацию подробно"
                      rows={5}
                      value={newTicket.description}
                      onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="priority">Приоритет</Label>
                    <Select value={newTicket.priority} onValueChange={(val) => setNewTicket({ ...newTicket, priority: val })}>
                      <SelectTrigger id="priority">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Низкий</SelectItem>
                        <SelectItem value="medium">Средний</SelectItem>
                        <SelectItem value="high">Высокий</SelectItem>
                        <SelectItem value="urgent">Срочно</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={createTicket} className="w-full bg-secondary hover:bg-secondary/90">
                    <Icon name="Send" size={16} className="mr-2" />
                    Отправить тикет
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          <TabsContent value="manage">
            <div className="space-y-4">
              <Card className="border-primary/20 bg-card/95">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-primary">Фильтры</CardTitle>
                    <Button variant="ghost" size="sm" onClick={loadTickets}>
                      <Icon name="RefreshCw" size={16} className="mr-2" />
                      Обновить
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Все статусы</SelectItem>
                      <SelectItem value="open">Открытые</SelectItem>
                      <SelectItem value="in_progress">В работе</SelectItem>
                      <SelectItem value="resolved">Решённые</SelectItem>
                      <SelectItem value="closed">Закрытые</SelectItem>
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>

              <div className="grid gap-4">
                {tickets.length === 0 ? (
                  <Card className="border-primary/20 bg-card/95">
                    <CardContent className="py-12 text-center text-muted-foreground">
                      <Icon name="Inbox" size={48} className="mx-auto mb-4 opacity-50" />
                      <p>Тикеты не найдены</p>
                    </CardContent>
                  </Card>
                ) : (
                  tickets.map((ticket) => (
                    <Card key={ticket.id} className="border-primary/20 bg-card/95 hover:border-primary/40 transition-all">
                      <CardHeader>
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <CardTitle className="text-lg text-foreground mb-2">{ticket.title}</CardTitle>
                            <CardDescription className="text-sm">{ticket.description}</CardDescription>
                          </div>
                          <div className="flex flex-col gap-2">
                            <Badge className={`${getPriorityColor(ticket.priority)} text-white`}>
                              {ticket.priority === 'low' && '⬇️ Низкий'}
                              {ticket.priority === 'medium' && '➡️ Средний'}
                              {ticket.priority === 'high' && '⬆️ Высокий'}
                              {ticket.priority === 'urgent' && '🔥 Срочно'}
                            </Badge>
                            <Badge className={`${getStatusColor(ticket.status)} text-white`}>
                              {ticket.status === 'open' && '🆕 Открыт'}
                              {ticket.status === 'in_progress' && '⚙️ В работе'}
                              {ticket.status === 'resolved' && '✅ Решён'}
                              {ticket.status === 'closed' && '🔒 Закрыт'}
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between">
                          <div className="text-sm text-muted-foreground">
                            <p>Создатель: {ticket.creator_name}</p>
                            <p>Дата: {new Date(ticket.created_at).toLocaleDateString('ru-RU')}</p>
                          </div>
                          {user.role === 'manager' && (
                            <div className="flex gap-2">
                              {ticket.status === 'open' && (
                                <Button size="sm" onClick={() => updateTicketStatus(ticket.id, 'in_progress')} className="bg-yellow-600 hover:bg-yellow-700">
                                  В работу
                                </Button>
                              )}
                              {ticket.status === 'in_progress' && (
                                <Button size="sm" onClick={() => updateTicketStatus(ticket.id, 'resolved')} className="bg-green-600 hover:bg-green-700">
                                  Решить
                                </Button>
                              )}
                              {ticket.status === 'resolved' && (
                                <Button size="sm" onClick={() => updateTicketStatus(ticket.id, 'closed')} variant="outline">
                                  Закрыть
                                </Button>
                              )}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}