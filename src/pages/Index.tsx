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
import SubmissionsManager from '@/components/SubmissionsManager';
import ManagerTasks from '@/components/ManagerTasks';

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
  attachment_url?: string;
  attachment_name?: string;
  attachment_size?: number;
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
  const [selectedTicketFile, setSelectedTicketFile] = useState<File | null>(null);
  const [uploadingTicket, setUploadingTicket] = useState(false);
  const [managers, setManagers] = useState<User[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [newUser, setNewUser] = useState({ username: '', full_name: '', role: 'artist', revenue_share_percent: 50 });
  const { toast } = useToast();

  // Отключили автосбор статистики - теперь только вручную через кнопку
  // useEffect(() => {
  //   if (user && user.role === 'director') {
  //     collectStatsIfNeeded();
  //   }
  // }, [user]);

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
    
    setUploadingTicket(true);
    try {
      let attachmentUrl = null;
      let attachmentName = null;
      let attachmentSize = null;

      // Загрузка файла если выбран
      if (selectedTicketFile) {
        const formData = new FormData();
        formData.append('file', selectedTicketFile);

        const uploadResponse = await fetch('https://functions.poehali.dev/f7d3af63-4868-4f2e-a1bd-73dad1c7c7d5', {
          method: 'POST',
          body: formData
        });

        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json();
          attachmentUrl = uploadData.url;
          attachmentName = selectedTicketFile.name;
          attachmentSize = selectedTicketFile.size;
        }
      }

      const response = await fetch(API_URLS.tickets, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          ...newTicket, 
          created_by: user.id,
          attachment_url: attachmentUrl,
          attachment_name: attachmentName,
          attachment_size: attachmentSize
        })
      });
      
      if (response.ok) {
        logActivity(user.id, 'create_ticket', `Создан тикет: ${newTicket.title}`, { priority: newTicket.priority });
        setNewTicket({ title: '', description: '', priority: 'medium' });
        setSelectedTicketFile(null);
        toast({ title: '✅ Тикет создан' });
        loadTickets();
      }
    } catch (error) {
      toast({ title: '❌ Ошибка создания тикета', variant: 'destructive' });
    } finally {
      setUploadingTicket(false);
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

  const deleteTicket = async (ticketId: number) => {
    if (!confirm('Вы уверены, что хотите удалить этот тикет?')) return;
    
    try {
      const response = await fetch(API_URLS.tickets, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: ticketId })
      });
      
      if (response.ok) {
        if (user) {
          logActivity(user.id, 'delete_ticket', `Удалён тикет #${ticketId}`, { ticketId });
        }
        toast({ title: '✅ Тикет удалён' });
        loadTickets();
      } else {
        toast({ title: '❌ Ошибка удаления', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: '❌ Ошибка удаления', variant: 'destructive' });
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

  const updateUser = async (userId: number, userData: Partial<User>) => {
    try {
      const response = await fetch(API_URLS.users, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: userId, ...userData })
      });
      
      if (response.ok) {
        toast({ title: '✅ Данные обновлены' });
        loadAllUsers();
      } else {
        const data = await response.json();
        toast({ title: '❌ Ошибка', description: data.error, variant: 'destructive' });
      }
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
      <div className="min-h-screen bg-gradient-to-br from-black via-yellow-950/30 to-black bg-grid-pattern">
        <div className="container mx-auto p-4 animate-fadeIn">
          <div className="flex justify-between items-center mb-6 bg-card/60 backdrop-blur-sm border border-border rounded-xl p-4 animate-slideIn">
            <div className="flex items-center gap-4">
              <img 
                src="https://cdn.poehali.dev/files/89837016-5bd9-4196-8bef-fad51c37ba4e.jpg" 
                alt="420 Logo" 
                className="w-12 h-12 rounded-full shadow-lg shadow-primary/50 animate-glow"
              />
              <h1 className="text-3xl font-bold text-primary">420.рф</h1>
            </div>
            <button 
              onClick={logout}
              className="px-6 py-2 bg-gradient-to-r from-primary to-secondary text-primary-foreground font-semibold rounded-lg hover:shadow-lg hover:shadow-primary/50 transition-all"
            >
              Выйти
            </button>
          </div>

          <Tabs defaultValue="stats" className="w-full">
            <div className="w-full overflow-x-auto pb-2">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="stats">📊 Статистика</TabsTrigger>
                <TabsTrigger value="reports">📁 Отчёты</TabsTrigger>
                <TabsTrigger value="create">✉️ Создать тикет</TabsTrigger>
                <TabsTrigger value="my-tickets">🎫 Мои тикеты</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="stats">
              <ArtistDashboard user={user} />
            </TabsContent>

            <TabsContent value="reports">
              <ArtistReports userId={user.id} userName={user.full_name} />
            </TabsContent>

            <TabsContent value="create">
              <CreateTicketForm
                newTicket={newTicket}
                onTicketChange={setNewTicket}
                onCreateTicket={createTicket}
                selectedFile={selectedTicketFile}
                onFileChange={setSelectedTicketFile}
                uploading={uploadingTicket}
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
      <div className="min-h-screen bg-gradient-to-br from-black via-yellow-950/30 to-black bg-grid-pattern">
        <div className="container mx-auto p-4 animate-fadeIn">
          <div className="flex justify-between items-center mb-6 bg-card/60 backdrop-blur-sm border border-border rounded-xl p-4 animate-slideIn">
            <div className="flex items-center gap-4">
              <img 
                src="https://cdn.poehali.dev/files/89837016-5bd9-4196-8bef-fad51c37ba4e.jpg" 
                alt="420 Logo" 
                className="w-12 h-12 rounded-full shadow-lg shadow-primary/50 animate-glow"
              />
              <h1 className="text-3xl font-bold text-primary">420.рф</h1>
            </div>
            <button 
              onClick={logout}
              className="px-6 py-2 bg-gradient-to-r from-primary to-secondary text-primary-foreground font-semibold rounded-lg hover:shadow-lg hover:shadow-primary/50 transition-all"
            >
              Выйти
            </button>
          </div>

          <Tabs defaultValue="tasks" className="w-full">
            <div className="w-full overflow-x-auto pb-2">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="tasks">✅ Мои задачи</TabsTrigger>
                <TabsTrigger value="submissions">📋 Заявки</TabsTrigger>
                <TabsTrigger value="tickets">🎫 Тикеты</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="tasks">
              <ManagerTasks userId={user.id} />
            </TabsContent>

            <TabsContent value="submissions">
              <SubmissionsManager userId={user.id} />
            </TabsContent>

            <TabsContent value="tickets">
              <TicketManagement
                user={user}
                tickets={tickets}
                managers={managers}
                statusFilter={statusFilter}
                onStatusFilterChange={setStatusFilter}
                onUpdateStatus={updateTicketStatus}
                onAssignTicket={assignTicket}
                onLoadTickets={loadTickets}
                onDeleteTicket={deleteTicket}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-yellow-950/30 to-black bg-grid-pattern">
      <div className="container mx-auto p-4 animate-fadeIn">
        <div className="flex justify-between items-center mb-6 bg-card/60 backdrop-blur-sm border border-border rounded-xl p-4 animate-slideIn">
          <div className="flex items-center gap-4">
            <img 
              src="https://cdn.poehali.dev/files/89837016-5bd9-4196-8bef-fad51c37ba4e.jpg" 
              alt="420 Logo" 
              className="w-12 h-12 rounded-full shadow-lg shadow-primary/50 animate-glow"
            />
            <h1 className="text-3xl font-bold text-primary">420.рф</h1>
          </div>
          <button 
            onClick={logout}
            className="px-6 py-2 bg-gradient-to-r from-primary to-secondary text-primary-foreground font-semibold rounded-lg hover:shadow-lg hover:shadow-primary/50 transition-all"
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
          onDeleteTicket={deleteTicket}
          onUpdateUser={updateUser}
        />
      </div>
    </div>
  );
}