import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import TicketManagement from '@/components/TicketManagement';
import SubmissionsManager from '@/components/SubmissionsManager';
import ManagerTasks from '@/components/ManagerTasks';
import ManagerStats from '@/components/ManagerStats';
import ManagerTasksView from '@/components/ManagerTasksView';
import ReleaseModerationPanel from '@/components/ReleaseModerationPanel';
import MessagesModal from '@/components/MessagesModal';
import AppHeader from '@/components/AppHeader';
import UserProfile from '@/components/UserProfile';
import { User, Ticket } from '@/types';
import { Task } from '@/components/useTasks';
import { useNotifications } from '@/contexts/NotificationContext';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { useActivityTracking } from '@/hooks/useActivityTracking';

interface ManagerViewProps {
  user: User;
  tickets: Ticket[];
  managers: User[];
  tasks: Task[];
  statusFilter: string;
  messagesOpen: boolean;
  onStatusFilterChange: (filter: string) => void;
  onUpdateStatus: (ticketId: number, status: string) => void;
  onAssignTicket: (ticketId: number, managerId: number | null, deadline?: string) => void;
  onLoadTickets: () => void;
  onDeleteTicket: (ticketId: number) => void;
  onUpdateTaskStatus: (taskId: number, status: string) => Promise<boolean>;
  onMessagesOpenChange: (open: boolean) => void;
  onUpdateUser: (updates: Partial<User>) => void;
  onLogout: () => void;
}

export default function ManagerView({
  user,
  tickets,
  managers,
  tasks,
  statusFilter,
  messagesOpen,
  onStatusFilterChange,
  onUpdateStatus,
  onAssignTicket,
  onLoadTickets,
  onDeleteTicket,
  onUpdateTaskStatus,
  onMessagesOpenChange,
  onUpdateUser,
  onLogout
}: ManagerViewProps) {
  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem('manager_active_tab') || 'tasks';
  });
  const [showProfile, setShowProfile] = useState(false);

  const { unreadCounts } = useNotifications();
  useOnlineStatus(user.id);
  useActivityTracking(user.id);

  const Badge = ({ count }: { count: number }) => {
    if (count === 0) return null;
    return (
      <span className="ml-1 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">
        {count > 99 ? '99+' : count}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-yellow-950/30 to-black bg-grid-pattern">
      <div className="container mx-auto p-4 animate-fadeIn">
        <AppHeader 
          onMessagesClick={() => onMessagesOpenChange(true)}
          onProfileClick={() => setShowProfile(true)}
          onLogout={onLogout}
          userRole="manager"
          userId={user.id}
        />

        <MessagesModal 
          open={messagesOpen} 
          onOpenChange={onMessagesOpenChange}
          userId={user.id}
          userRole="manager"
        />

        <ManagerStats userId={user.id} />

        <Tabs 
          value={activeTab}
          onValueChange={(value) => {
            setActiveTab(value);
            localStorage.setItem('manager_active_tab', value);
          }}
          className="w-full">
          <div className="w-full overflow-x-auto pb-2">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="tasks">✅ Мои задачи<Badge count={unreadCounts.tasks} /></TabsTrigger>
              <TabsTrigger value="old-tasks">📋 Старые задачи</TabsTrigger>
              <TabsTrigger value="releases">🎵 Модерация релизов</TabsTrigger>
              <TabsTrigger value="tickets">🎫 Тикеты<Badge count={unreadCounts.tickets} /></TabsTrigger>
              <TabsTrigger value="submissions">📋 Заявки</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="tasks">
            <ManagerTasksView 
              tasks={tasks}
              onUpdateTaskStatus={onUpdateTaskStatus}
            />
          </TabsContent>

          <TabsContent value="old-tasks">
            <ManagerTasks userId={user.id} />
          </TabsContent>

          <TabsContent value="releases">
            <ReleaseModerationPanel userId={user.id} userRole="manager" />
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

          <TabsContent value="submissions">
            <SubmissionsManager userId={user.id} userRole="manager" />
          </TabsContent>
        </Tabs>

        {showProfile && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowProfile(false)}>
            <div className="w-full max-w-5xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <UserProfile 
                user={{
                  ...user,
                  login: user.username,
                  fullName: user.full_name,
                  email: user.email || '',
                  isBlocked: user.is_blocked || false,
                  isFrozen: user.is_frozen || false,
                  freezeUntil: user.frozen_until || ''
                }}
                onUpdateProfile={onUpdateUser}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}