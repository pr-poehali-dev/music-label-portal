import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CreateTicketForm from '@/components/CreateTicketForm';
import TicketManagement from '@/components/TicketManagement';
import UserManagement from '@/components/UserManagement';
import ReminderSetup from '@/components/ReminderSetup';

import UserActivityMonitor from '@/components/UserActivityMonitor';
import HomePage from '@/components/HomePage';
import ReportsUploader from '@/components/ReportsUploader';
import SubmissionsManager from '@/components/SubmissionsManager';
import TaskAssignment from '@/components/TaskAssignment';
import TaskAnalyticsDashboard from '@/components/TaskAnalyticsDashboard';
import TicketAnalyticsDashboard from '@/components/TicketAnalyticsDashboard';

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
    <Tabs defaultValue="analytics" className="w-full">
      <div className="w-full overflow-x-auto pb-2">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="analytics">📊 Аналитика</TabsTrigger>
          <TabsTrigger value="tasks">✅ Задачи</TabsTrigger>
          <TabsTrigger value="submissions">📋 Заявки</TabsTrigger>
          <TabsTrigger value="team">👥 Команда</TabsTrigger>
          <TabsTrigger value="reports">📁 Отчёты</TabsTrigger>
          <TabsTrigger value="settings">⚙️ Настройки</TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="submissions">
        <SubmissionsManager userId={user.id} />
      </TabsContent>

      <TabsContent value="tasks">
        <Tabs defaultValue="assignment" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="assignment">Назначение задач</TabsTrigger>
            <TabsTrigger value="tickets">Заявки техподдержки</TabsTrigger>
            <TabsTrigger value="create">Создать тикет</TabsTrigger>
          </TabsList>
          
          <TabsContent value="assignment">
            <TaskAssignment managers={managers} directorId={user.id} />
          </TabsContent>
          
          <TabsContent value="tickets">
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
          
          <TabsContent value="create">
            <CreateTicketForm
              newTicket={newTicket}
              onNewTicketChange={onNewTicketChange}
              onCreateTicket={onCreateTicket}
            />
          </TabsContent>
        </Tabs>
      </TabsContent>

      <TabsContent value="analytics">
        <Tabs defaultValue="tasks" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="tasks">Аналитика задач</TabsTrigger>
            <TabsTrigger value="tickets">Аналитика заявок</TabsTrigger>
          </TabsList>
          
          <TabsContent value="tasks">
            <TaskAnalyticsDashboard />
          </TabsContent>
          
          <TabsContent value="tickets">
            <TicketAnalyticsDashboard />
          </TabsContent>
        </Tabs>
      </TabsContent>

      <TabsContent value="team">
        <Tabs defaultValue="users" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="users">Пользователи</TabsTrigger>
            <TabsTrigger value="monitoring">Мониторинг активности</TabsTrigger>
          </TabsList>
          
          <TabsContent value="users">
            <UserManagement
              allUsers={allUsers}
              newUser={newUser}
              onNewUserChange={onNewUserChange}
              onCreateUser={onCreateUser}
              onUpdateUser={onUpdateUser}
            />
          </TabsContent>
          
          <TabsContent value="monitoring">
            <UserActivityMonitor users={allUsers} />
          </TabsContent>
        </Tabs>
      </TabsContent>

      <TabsContent value="reports">
        <ReportsUploader userId={user.id} />
      </TabsContent>

      <TabsContent value="settings">
        <ReminderSetup />
      </TabsContent>
    </Tabs>
  );
}