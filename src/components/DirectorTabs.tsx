import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CreateTicketForm from '@/components/CreateTicketForm';
import TicketManagement from '@/components/TicketManagement';
import UserManagement from '@/components/UserManagement';
import ReminderSetup from '@/components/ReminderSetup';
import TelegramBotSettings from '@/components/TelegramBotSettings';

import UserActivityMonitor from '@/components/UserActivityMonitor';
import HomePage from '@/components/HomePage';
import ReportsUploader from '@/components/ReportsUploader';
import SubmissionsManager from '@/components/SubmissionsManager';
import TaskAssignment from '@/components/TaskAssignment';
import TaskAnalyticsDashboard from '@/components/TaskAnalyticsDashboard';
import TicketAnalyticsDashboard from '@/components/TicketAnalyticsDashboard';
import { Task } from '@/components/useTasks';
import TasksTab from '@/components/TasksTab';

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
  tasks: Task[];
  onCreateTask: (task: any) => Promise<boolean>;
  onUpdateTaskStatus: (taskId: number, status: string) => Promise<boolean>;
  onDeleteTask: (taskId: number) => Promise<boolean>;
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
  tasks,
  onCreateTask,
  onUpdateTaskStatus,
  onDeleteTask,
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
    <Tabs defaultValue="tickets" className="w-full">
      <div className="w-full overflow-x-auto pb-2 scrollbar-hide">
        <TabsList className="grid w-full grid-cols-7 md:grid-cols-7 min-w-[700px] md:min-w-0">
          <TabsTrigger value="analytics" className="text-xs md:text-sm px-2 md:px-4">
            <span className="hidden md:inline">📊 Аналитика</span>
            <span className="md:hidden">📊</span>
          </TabsTrigger>
          <TabsTrigger value="tickets" className="text-xs md:text-sm px-2 md:px-4">
            <span className="hidden md:inline">🎫 Тикеты</span>
            <span className="md:hidden">🎫</span>
          </TabsTrigger>
          <TabsTrigger value="tasks" className="text-xs md:text-sm px-2 md:px-4">
            <span className="hidden md:inline">✅ Задачи</span>
            <span className="md:hidden">✅</span>
          </TabsTrigger>
          <TabsTrigger value="submissions" className="text-xs md:text-sm px-2 md:px-4">
            <span className="hidden md:inline">📋 Заявки</span>
            <span className="md:hidden">📋</span>
          </TabsTrigger>
          <TabsTrigger value="team" className="text-xs md:text-sm px-2 md:px-4">
            <span className="hidden md:inline">👥 Команда</span>
            <span className="md:hidden">👥</span>
          </TabsTrigger>
          <TabsTrigger value="reports" className="text-xs md:text-sm px-2 md:px-4">
            <span className="hidden md:inline">📁 Отчёты</span>
            <span className="md:hidden">📁</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="text-xs md:text-sm px-2 md:px-4">
            <span className="hidden md:inline">⚙️ Настройки</span>
            <span className="md:hidden">⚙️</span>
          </TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="tickets" className="space-y-4">
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

      <TabsContent value="submissions">
        <SubmissionsManager userId={user.id} />
      </TabsContent>

      <TabsContent value="tasks" className="space-y-4">
        <Tabs defaultValue="manager-tasks">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="manager-tasks">
              <span className="hidden md:inline">Задачи менеджеров</span>
              <span className="md:hidden">Задачи</span>
            </TabsTrigger>
            <TabsTrigger value="assignment">
              <span className="hidden md:inline">Назначение задач</span>
              <span className="md:hidden">Назначение</span>
            </TabsTrigger>
            <TabsTrigger value="create">
              <span className="hidden md:inline">Создать тикет</span>
              <span className="md:hidden">Создать</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="manager-tasks">
            <TasksTab
              tasks={tasks}
              tickets={tickets}
              managers={managers}
              onCreateTask={onCreateTask}
              onUpdateTaskStatus={onUpdateTaskStatus}
              onDeleteTask={onDeleteTask}
            />
          </TabsContent>

          <TabsContent value="assignment">
            <TaskAssignment
              tickets={tickets}
              managers={managers}
              onAssignTicket={onAssignTicket}
              onLoadTickets={onLoadTickets}
            />
          </TabsContent>

          <TabsContent value="create">
            <CreateTicketForm
              newTicket={newTicket}
              onTicketChange={onNewTicketChange}
              onCreateTicket={onCreateTicket}
              onLoadTickets={onLoadTickets}
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
        <Tabs defaultValue="reminders" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="reminders">Напоминания</TabsTrigger>
            <TabsTrigger value="telegram">Telegram бот</TabsTrigger>
          </TabsList>
          
          <TabsContent value="reminders">
            <ReminderSetup />
          </TabsContent>
          
          <TabsContent value="telegram">
            <TelegramBotSettings />
          </TabsContent>
        </Tabs>
      </TabsContent>
    </Tabs>
  );
}