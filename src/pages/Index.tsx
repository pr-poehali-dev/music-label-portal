import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import LoginForm from '@/components/LoginForm';
import TicketCard from '@/components/TicketCard';
import CreateTicketForm from '@/components/CreateTicketForm';
import StatsCards from '@/components/StatsCards';
import UserManagement from '@/components/UserManagement';
import ReminderSetup from '@/components/ReminderSetup';

interface User {
  id: number;
  username: string;
  role: 'artist' | 'manager' | 'director';
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
  assigned_to?: number | null;
  assigned_name?: string | null;
  deadline?: string | null;
}

const API_URLS = {
  auth: 'https://functions.poehali.dev/d2601eec-1d55-4956-b655-187431987ed9',
  tickets: 'https://functions.poehali.dev/cdcd7646-5a98-477f-8464-d1aa48319296',
  users: 'https://functions.poehali.dev/cf5d45c1-d64b-4400-af77-a51c7588d942'
};

export default function Index() {
  const [user, setUser] = useState<User | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [newTicket, setNewTicket] = useState({ title: '', description: '', priority: 'medium' });
  const [managers, setManagers] = useState<User[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [newUser, setNewUser] = useState({ username: '', full_name: '', role: 'artist' });
  const { toast } = useToast();

  const login = async (username: string, password: string) => {
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

  const assignTicket = async (ticketId: number, managerId: number | null, deadline?: string) => {
    try {
      await fetch(API_URLS.tickets, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: ticketId, assigned_to: managerId, deadline })
      });
      
      toast({ title: '✅ Тикет назначен' });
      loadTickets();
    } catch (error) {
      toast({ title: '❌ Ошибка назначения', variant: 'destructive' });
    }
  };

  const loadManagers = async () => {
    try {
      const response = await fetch(`${API_URLS.users}?role=manager`);
      const data = await response.json();
      setManagers(data.users || []);
    } catch (error) {
      console.error('Failed to load managers:', error);
    }
  };

  const loadAllUsers = async () => {
    try {
      const response = await fetch(API_URLS.users);
      const data = await response.json();
      setAllUsers(data.users || []);
    } catch (error) {
      console.error('Failed to load users:', error);
    }
  };

  const createUser = async () => {
    if (!newUser.username || !newUser.full_name) {
      toast({ title: '❌ Заполните все поля', variant: 'destructive' });
      return;
    }
    
    try {
      const response = await fetch(API_URLS.users, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser)
      });
      
      if (response.ok) {
        setNewUser({ username: '', full_name: '', role: 'artist' });
        toast({ title: '✅ Пользователь создан', description: 'Пароль по умолчанию: 12345' });
        loadAllUsers();
      } else {
        const data = await response.json();
        toast({ title: '❌ Ошибка', description: data.error, variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: '❌ Ошибка создания', variant: 'destructive' });
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
      if (user.role === 'director') {
        loadManagers();
        loadAllUsers();
      }
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
    return <LoginForm onLogin={login} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-zinc-900 to-zinc-800">
      <header className="border-b border-primary/20 bg-card/50 backdrop-blur">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-yellow-600 flex items-center justify-center">
              <span className="text-xl font-bold text-black">420</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-primary">420 SMM Техподдержка</h1>
              <p className="text-sm text-muted-foreground">
                {user.full_name} • {user.role === 'director' ? '👑 Руководитель' : user.role === 'manager' ? '🎯 Менеджер' : '🎤 Артист'}
              </p>
            </div>
          </div>
          <Button onClick={logout} variant="outline">
            <Icon name="LogOut" size={16} className="mr-2" />
            Выйти
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue={user.role === 'artist' ? 'create' : 'manage'} className="w-full">
          <TabsList className={`grid w-full ${user.role === 'director' ? 'grid-cols-4' : user.role === 'artist' ? 'grid-cols-2' : 'grid-cols-1'} mb-8`}>
            {user.role === 'artist' && (
              <TabsTrigger value="create">
                <Icon name="Plus" size={16} className="mr-2" />
                Создать тикет
              </TabsTrigger>
            )}
            <TabsTrigger value="manage">
              <Icon name="List" size={16} className="mr-2" />
              {user.role === 'artist' ? 'Мои тикеты' : 'Управление тикетами'}
            </TabsTrigger>
            {user.role === 'director' && (
              <>
                <TabsTrigger value="users">
                  <Icon name="Users" size={16} className="mr-2" />
                  Пользователи
                </TabsTrigger>
                <TabsTrigger value="reminders">
                  <Icon name="Bell" size={16} className="mr-2" />
                  Напоминания
                </TabsTrigger>
              </>
            )}
          </TabsList>

          {user.role === 'artist' && (
            <TabsContent value="create">
              <CreateTicketForm
                newTicket={newTicket}
                onTicketChange={setNewTicket}
                onCreateTicket={createTicket}
              />
            </TabsContent>
          )}

          <TabsContent value="manage">
            <div className="space-y-4">
              {user.role === 'director' && <StatsCards tickets={tickets} />}

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
                    <TicketCard
                      key={ticket.id}
                      ticket={ticket}
                      user={user}
                      managers={managers}
                      onUpdateStatus={updateTicketStatus}
                      onAssignTicket={assignTicket}
                      getPriorityColor={getPriorityColor}
                      getStatusColor={getStatusColor}
                    />
                  ))
                )}
              </div>
            </div>
          </TabsContent>

          {user.role === 'director' && (
            <>
              <TabsContent value="users">
                <UserManagement
                  allUsers={allUsers}
                  newUser={newUser}
                  onNewUserChange={setNewUser}
                  onCreateUser={createUser}
                />
              </TabsContent>

              <TabsContent value="reminders">
                <ReminderSetup />
              </TabsContent>
            </>
          )}
        </Tabs>
      </main>
    </div>
  );
}