import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CreateTicketForm from '@/components/CreateTicketForm';
import TicketManagement from '@/components/TicketManagement';
import UserManagement from '@/components/UserManagement';
import ReminderSetup from '@/components/ReminderSetup';
import StatsCollector from '@/components/StatsCollector';
import UserActivityMonitor from '@/components/UserActivityMonitor';
import HomePage from '@/components/HomePage';
import ReportsUploader from '@/components/ReportsUploader';

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
  onDeleteTicket: (ticketId: number) => void;
  onUpdateUser: (userId: number, userData: Partial<User>) => void;
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
  onLoadAllUsers,
  onDeleteTicket,
  onUpdateUser
}: DirectorTabsProps) {
  return (
    <Tabs defaultValue="manage" className="w-full">
      <div className="w-full overflow-x-auto pb-2">
        <TabsList className="inline-flex h-auto min-w-max lg:grid lg:w-full lg:grid-cols-8 bg-black/40 backdrop-blur-sm border border-yellow-500/20 p-1 gap-1 rounded-xl">
          <TabsTrigger value="manage" className="flex items-center justify-center h-10 px-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-yellow-500 data-[state=active]:to-orange-500 data-[state=active]:text-black data-[state=active]:font-semibold rounded-lg whitespace-nowrap transition-all">Управление</TabsTrigger>
          <TabsTrigger value="create" className="flex items-center justify-center h-10 px-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-yellow-500 data-[state=active]:to-orange-500 data-[state=active]:text-black data-[state=active]:font-semibold rounded-lg whitespace-nowrap transition-all">Создать тикет</TabsTrigger>
          <TabsTrigger value="users" className="flex items-center justify-center h-10 px-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-yellow-500 data-[state=active]:to-orange-500 data-[state=active]:text-black data-[state=active]:font-semibold rounded-lg whitespace-nowrap transition-all">Пользователи</TabsTrigger>
          <TabsTrigger value="reminders" className="flex items-center justify-center h-10 px-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-yellow-500 data-[state=active]:to-orange-500 data-[state=active]:text-black data-[state=active]:font-semibold rounded-lg whitespace-nowrap transition-all">Напоминания</TabsTrigger>
          <TabsTrigger value="collector" className="flex items-center justify-center h-10 px-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-yellow-500 data-[state=active]:to-orange-500 data-[state=active]:text-black data-[state=active]:font-semibold rounded-lg whitespace-nowrap transition-all">Автосбор</TabsTrigger>
          <TabsTrigger value="monitoring" className="flex items-center justify-center h-10 px-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-yellow-500 data-[state=active]:to-orange-500 data-[state=active]:text-black data-[state=active]:font-semibold rounded-lg whitespace-nowrap transition-all">Мониторинг</TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center justify-center h-10 px-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-yellow-500 data-[state=active]:to-orange-500 data-[state=active]:text-black data-[state=active]:font-semibold rounded-lg whitespace-nowrap transition-all">Отчёты</TabsTrigger>
          <TabsTrigger value="home" className="flex items-center justify-center h-10 px-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-yellow-500 data-[state=active]:to-orange-500 data-[state=active]:text-black data-[state=active]:font-semibold rounded-lg whitespace-nowrap transition-all">Дом</TabsTrigger>
        </TabsList>
      </div>

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
          onDeleteTicket={onDeleteTicket}
        />
      </TabsContent>

      <TabsContent value="users">
        <UserManagement
          allUsers={allUsers}
          newUser={newUser}
          onNewUserChange={onNewUserChange}
          onCreateUser={onCreateUser}
          onUpdateUser={onUpdateUser}
        />
      </TabsContent>

      <TabsContent value="reminders">
        <ReminderSetup />
      </TabsContent>

      <TabsContent value="collector">
        <StatsCollector />
      </TabsContent>

      <TabsContent value="monitoring">
        <UserActivityMonitor users={allUsers} />
      </TabsContent>

      <TabsContent value="reports">
        <ReportsUploader userId={user.id} />
      </TabsContent>

      <TabsContent value="home">
        <HomePage />
      </TabsContent>
    </Tabs>
  );
}