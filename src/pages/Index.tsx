import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { collectStatsIfNeeded } from '@/utils/statsScheduler';
import { logActivity } from '@/utils/activityLogger';
import LoginForm from '@/components/LoginForm';
import CreateTicketForm from '@/components/CreateTicketForm';
import StatsCards from '@/components/StatsCards';
import ArtistDashboard from '@/components/ArtistDashboard';
import TicketManagement from '@/components/TicketManagement';
import MyTickets from '@/components/MyTickets';
import DirectorTabs from '@/components/DirectorTabs';
import ArtistReports from '@/components/ArtistReports';

interface User {
  id: number;
  username: string;
  role: 'artist' | 'manager' | 'director';
  full_name: string;
  social_links_filled?: boolean;
  yandex_music_url?: string;
  vk_group_url?: string;
  tiktok_url?: string;
  is_blocked?: boolean;
  is_frozen?: boolean;
  frozen_until?: string;
  blocked_reason?: string;
  last_ip?: string;
  device_fingerprint?: string;
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
  const [newUser, setNewUser] = useState({ username: '', full_name: '', role: 'artist', revenue_share_percent: 50 });
  const { toast } = useToast();

  useEffect(() => {
    if (user && user.role === 'director') {
      collectStatsIfNeeded();
    }
  }, [user]);

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
        logActivity(data.user.id, 'login', `Пользователь ${data.user.full_name} вошёл в систему`);
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
        logActivity(user.id, 'create_ticket', `Создан тикет: ${newTicket.title}`, { priority: newTicket.priority });
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
      
      if (user) {
        logActivity(user.id, 'update_ticket_status', `Обновлён статус тикета #${ticketId} на ${status}`, { ticketId, status });
      }
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
      
      if (user) {
        logActivity(user.id, 'assign_ticket', `Назначен тикет #${ticketId}`, { ticketId, managerId, deadline });
      }
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

  if (!user) {
    return <LoginForm onLogin={login} />;
  }

  if (user.role === 'artist') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-900 via-yellow-800 to-black">
        <div className="container mx-auto p-4">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-yellow-100">👋 {user.full_name}</h1>
            <button 
              onClick={logout}
              className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
            >
              Выйти
            </button>
          </div>

          <Tabs defaultValue="stats" className="w-full">
            <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 bg-yellow-900/30 border border-yellow-700/30 p-1 gap-1">
              <TabsTrigger value="stats" className="data-[state=active]:bg-yellow-600 data-[state=active]:text-white">Статистика</TabsTrigger>
              <TabsTrigger value="reports" className="data-[state=active]:bg-yellow-600 data-[state=active]:text-white">Отчёты</TabsTrigger>
              <TabsTrigger value="create" className="data-[state=active]:bg-yellow-600 data-[state=active]:text-white">Создать тикет</TabsTrigger>
              <TabsTrigger value="my-tickets" className="data-[state=active]:bg-yellow-600 data-[state=active]:text-white">Мои тикеты</TabsTrigger>
            </TabsList>

            <TabsContent value="stats">
              <ArtistDashboard user={user} />
            </TabsContent>

            <TabsContent value="reports">
              <ArtistReports userId={user.id} userName={user.full_name} />
            </TabsContent>

            <TabsContent value="create">
              <CreateTicketForm
                newTicket={newTicket}
                onNewTicketChange={setNewTicket}
                onCreateTicket={createTicket}
              />
            </TabsContent>

            <TabsContent value="my-tickets">
              <MyTickets
                user={user}
                tickets={tickets}
                statusFilter={statusFilter}
                onStatusFilterChange={setStatusFilter}
                onLoadTickets={loadTickets}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    );
  }

  if (user.role === 'manager') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-900 via-yellow-800 to-black">
        <div className="container mx-auto p-4">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-yellow-100">👋 {user.full_name}</h1>
            <button 
              onClick={logout}
              className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
            >
              Выйти
            </button>
          </div>

          <TicketManagement
            user={user}
            tickets={tickets}
            managers={managers}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            onUpdateStatus={updateTicketStatus}
            onAssignTicket={assignTicket}
            onLoadTickets={loadTickets}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-900 via-yellow-800 to-black">
      <div className="container mx-auto p-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-yellow-100">👋 {user.full_name}</h1>
          <button 
            onClick={logout}
            className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
          >
            Выйти
          </button>
        </div>

        <DirectorTabs
          user={user}
          tickets={tickets}
          managers={managers}
          allUsers={allUsers}
          statusFilter={statusFilter}
          newTicket={newTicket}
          newUser={newUser}
          onStatusFilterChange={setStatusFilter}
          onNewTicketChange={setNewTicket}
          onCreateTicket={createTicket}
          onUpdateStatus={updateTicketStatus}
          onAssignTicket={assignTicket}
          onLoadTickets={loadTickets}
          onNewUserChange={setNewUser}
          onCreateUser={createUser}
          onLoadAllUsers={loadAllUsers}
        />
      </div>
    </div>
  );
}