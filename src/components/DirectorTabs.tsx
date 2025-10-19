import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CreateTicketForm from '@/components/CreateTicketForm';
import TicketManagement from '@/components/TicketManagement';
import UserManagement from '@/components/UserManagement';
import ReminderSetup from '@/components/ReminderSetup';
import TelegramBotSettings from '@/components/TelegramBotSettings';

import UserActivityMonitor from '@/components/UserActivityMonitor';
import UserActivityStats from '@/components/UserActivityStats';
import HomePage from '@/components/HomePage';
import ReportsUploader from '@/components/ReportsUploader';
import SubmissionsManager from '@/components/SubmissionsManager';
import TaskAssignment from '@/components/TaskAssignment';
import AnalyticsView from '@/components/AnalyticsView';
import WeeklyReport from '@/components/WeeklyReport';
import ReleaseModerationPanel from '@/components/ReleaseModerationPanel';
import { Task } from '@/components/useTasks';
import TasksTab from '@/components/TasksTab';
import { useNotifications } from '@/contexts/NotificationContext';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { useActivityTracking } from '@/hooks/useActivityTracking';

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
  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem('director_active_tab') || 'home';
  });

  const { unreadCounts, refreshCounts } = useNotifications();
  const { isUserOnline, getUserLastSeen } = useOnlineStatus(user.id);
  useActivityTracking(user.id);

  const Badge = ({ count }: { count: number }) => {
    if (count === 0) return null;
    return (
      <span className="ml-1 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full animate-pulse">
        {count > 99 ? '99+' : count}
      </span>
    );
  };

  // Обёртки для обновления счётчиков после действий
  const handleUpdateStatus = async (ticketId: number, status: string) => {
    await onUpdateStatus(ticketId, status);
    refreshCounts();
  };

  const handleAssignTicket = async (ticketId: number, managerId: number | null, deadline?: string) => {
    await onAssignTicket(ticketId, managerId, deadline);
    refreshCounts();
  };

  const handleDeleteTicket = async (ticketId: number) => {
    await onDeleteTicket(ticketId);
    refreshCounts();
  };

  return (
    <Tabs 
      value={activeTab} 
      onValueChange={(value) => {
        setActiveTab(value);
        localStorage.setItem('director_active_tab', value);
      }} 
      className="w-full">
      <div className="w-full overflow-x-auto pb-2 scrollbar-hide">
        <TabsList className="grid w-full grid-cols-8 md:grid-cols-8 min-w-[800px] md:min-w-0">
          <TabsTrigger value="analytics" className="text-xs md:text-sm px-2 md:px-4 transition-all duration-200 hover:scale-105">
            <span className="hidden md:inline">📊 Аналитика</span>
            <span className="md:hidden">📊</span>
          </TabsTrigger>
          <TabsTrigger value="tickets" className="text-xs md:text-sm px-2 md:px-4 transition-all duration-200 hover:scale-105">
            <span className="hidden md:inline">🎫 Тикеты<Badge count={unreadCounts.tickets} /></span>
            <span className="md:hidden">🎫<Badge count={unreadCounts.tickets} /></span>
          </TabsTrigger>
          <TabsTrigger value="tasks" className="text-xs md:text-sm px-2 md:px-4 transition-all duration-200 hover:scale-105">
            <span className="hidden md:inline">✅ Задачи<Badge count={unreadCounts.tasks} /></span>
            <span className="md:hidden">✅<Badge count={unreadCounts.tasks} /></span>
          </TabsTrigger>
          <TabsTrigger value="releases" className="text-xs md:text-sm px-2 md:px-4 transition-all duration-200 hover:scale-105">
            <span className="hidden md:inline">🎵 Релизы</span>
            <span className="md:hidden">🎵</span>
          </TabsTrigger>
          <TabsTrigger value="submissions" className="text-xs md:text-sm px-2 md:px-4 transition-all duration-200 hover:scale-105">
            <span className="hidden md:inline">📋 Заявки<Badge count={unreadCounts.submissions} /></span>
            <span className="md:hidden">📋<Badge count={unreadCounts.submissions} /></span>
          </TabsTrigger>

          <TabsTrigger value="reports" className="text-xs md:text-sm px-2 md:px-4 transition-all duration-200 hover:scale-105">
            <span className="hidden md:inline">📁 Отчёты</span>
            <span className="md:hidden">📁</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="text-xs md:text-sm px-2 md:px-4 transition-all duration-200 hover:scale-105">
            <span className="hidden md:inline">⚙️ Настройки</span>
            <span className="md:hidden">⚙️</span>
          </TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="tickets" className="space-y-4 animate-fadeIn">
        <TicketManagement
          user={user}
          tickets={tickets}
          managers={managers}
          statusFilter={statusFilter}
          onStatusFilterChange={onStatusFilterChange}
          onUpdateStatus={handleUpdateStatus}
          onAssignTicket={handleAssignTicket}
          onLoadTickets={onLoadTickets}
          onDeleteTicket={handleDeleteTicket}
        />
      </TabsContent>

      <TabsContent value="releases" className="animate-fadeIn">
        <ReleaseModerationPanel userId={user.id} userRole="director" />
      </TabsContent>

      <TabsContent value="submissions" className="animate-fadeIn">
        <SubmissionsManager userId={user.id} userRole="director" />
      </TabsContent>

      <TabsContent value="tasks" className="space-y-4 animate-fadeIn">
        <TaskAssignment
          tickets={tickets}
          managers={managers}
          onAssignTicket={onAssignTicket}
          onLoadTickets={onLoadTickets}
        />
      </TabsContent>

      <TabsContent value="analytics" className="animate-fadeIn">
        <AnalyticsView />
      </TabsContent>



      <TabsContent value="reports" className="animate-fadeIn">
        <Tabs defaultValue="weekly" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="weekly" className="transition-all duration-200 hover:scale-105">Еженедельный отчёт</TabsTrigger>
            <TabsTrigger value="upload" className="transition-all duration-200 hover:scale-105">Загрузить отчёт</TabsTrigger>
          </TabsList>
          <TabsContent value="weekly" className="animate-fadeIn">
            <WeeklyReport />
          </TabsContent>
          <TabsContent value="upload" className="animate-fadeIn">
            <ReportsUploader userId={user.id} />
          </TabsContent>
        </Tabs>
      </TabsContent>

      <TabsContent value="settings" className="animate-fadeIn">
        <Tabs defaultValue="team" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="team" className="transition-all duration-200 hover:scale-105">Команда</TabsTrigger>
            <TabsTrigger value="reminders" className="transition-all duration-200 hover:scale-105">Напоминания</TabsTrigger>
            <TabsTrigger value="telegram" className="transition-all duration-200 hover:scale-105">Telegram бот</TabsTrigger>
          </TabsList>
          
          <TabsContent value="team" className="animate-fadeIn">
            <Tabs defaultValue="users" className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="users" className="transition-all duration-200 hover:scale-105">Пользователи</TabsTrigger>
                <TabsTrigger value="activity" className="transition-all duration-200 hover:scale-105">Статистика активности</TabsTrigger>
                <TabsTrigger value="monitoring" className="transition-all duration-200 hover:scale-105">Мониторинг активности</TabsTrigger>
              </TabsList>
              
              <TabsContent value="users" className="animate-fadeIn">
                <UserManagement
                  allUsers={allUsers}
                  newUser={newUser}
                  onNewUserChange={onNewUserChange}
                  onCreateUser={onCreateUser}
                  onUpdateUser={onUpdateUser}
                  isUserOnline={isUserOnline}
                  getUserLastSeen={getUserLastSeen}
                />
              </TabsContent>
              
              <TabsContent value="activity" className="animate-fadeIn">
                <UserActivityStats 
                  users={allUsers}
                  isUserOnline={isUserOnline}
                  getUserLastSeen={getUserLastSeen}
                />
              </TabsContent>
              
              <TabsContent value="monitoring" className="animate-fadeIn">
                <UserActivityMonitor users={allUsers} />
              </TabsContent>
            </Tabs>
          </TabsContent>
          
          <TabsContent value="reminders" className="animate-fadeIn">
            <ReminderSetup />
          </TabsContent>
          
          <TabsContent value="telegram" className="animate-fadeIn">
            <TelegramBotSettings />
          </TabsContent>
        </Tabs>
      </TabsContent>
    </Tabs>
  );
}