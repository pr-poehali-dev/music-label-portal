import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import StatsCards from '@/components/StatsCards';
import CreateTicketForm from '@/components/CreateTicketForm';
import TicketManagement from '@/components/TicketManagement';
import UserManagement from '@/components/UserManagement';
import UserBlockingPanel from '@/components/UserBlockingPanel';
import ReminderSetup from '@/components/ReminderSetup';
import StatsCollector from '@/components/StatsCollector';
import UserActivityMonitor from '@/components/UserActivityMonitor';
import HomePage from '@/components/HomePage';

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

interface DirectorTabsProps {
  user: User;
  tickets: Ticket[];
  managers: User[];
  allUsers: User[];
  statusFilter: string;
  newTicket: { title: string; description: string; priority: string };
  newUser: { username: string; full_name: string; role: string };
  onStatusFilterChange: (status: string) => void;
  onNewTicketChange: (ticket: { title: string; description: string; priority: string }) => void;
  onCreateTicket: () => void;
  onUpdateStatus: (ticketId: number, status: string) => void;
  onAssignTicket: (ticketId: number, managerId: number | null, deadline?: string) => void;
  onLoadTickets: () => void;
  onNewUserChange: (user: { username: string; full_name: string; role: string }) => void;
  onCreateUser: () => void;
  onLoadAllUsers: () => void;
}

export default function DirectorTabs({
  user,
  tickets,
  managers,
  allUsers,
  statusFilter,
  newTicket,
  newUser,
  onStatusFilterChange,
  onNewTicketChange,
  onCreateTicket,
  onUpdateStatus,
  onAssignTicket,
  onLoadTickets,
  onNewUserChange,
  onCreateUser,
  onLoadAllUsers
}: DirectorTabsProps) {
  return (
    <Tabs defaultValue="stats" className="w-full">
      <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8">
        <TabsTrigger value="stats">Статистика</TabsTrigger>
        <TabsTrigger value="create">Создать тикет</TabsTrigger>
        <TabsTrigger value="manage">Управление тикетами</TabsTrigger>
        <TabsTrigger value="users">Пользователи</TabsTrigger>
        <TabsTrigger value="blocking">Блокировки</TabsTrigger>
        <TabsTrigger value="reminders">Напоминания</TabsTrigger>
        <TabsTrigger value="collector">Автосбор</TabsTrigger>
        <TabsTrigger value="monitoring">Мониторинг</TabsTrigger>
        <TabsTrigger value="home">Дом</TabsTrigger>
      </TabsList>

      <TabsContent value="stats">
        <StatsCards tickets={tickets} />
      </TabsContent>

      <TabsContent value="create">
        <CreateTicketForm
          newTicket={newTicket}
          onNewTicketChange={onNewTicketChange}
          onCreateTicket={onCreateTicket}
        />
      </TabsContent>

      <TabsContent value="manage">
        <TicketManagement
          user={user}
          tickets={tickets}
          managers={managers}
          statusFilter={statusFilter}
          onStatusFilterChange={onStatusFilterChange}
          onUpdateStatus={onUpdateStatus}
          onAssignTicket={onAssignTicket}
          onLoadTickets={onLoadTickets}
        />
      </TabsContent>

      <TabsContent value="users">
        <UserManagement
          allUsers={allUsers}
          newUser={newUser}
          onNewUserChange={onNewUserChange}
          onCreateUser={onCreateUser}
          onLoadAllUsers={onLoadAllUsers}
        />
      </TabsContent>

      <TabsContent value="blocking">
        <UserBlockingPanel />
      </TabsContent>

      <TabsContent value="reminders">
        <ReminderSetup />
      </TabsContent>

      <TabsContent value="collector">
        <StatsCollector />
      </TabsContent>

      <TabsContent value="monitoring">
        <UserActivityMonitor />
      </TabsContent>

      <TabsContent value="home">
        <HomePage />
      </TabsContent>
    </Tabs>
  );
}