import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';
import TicketManagement from '@/components/TicketManagement';
import SubmissionsManager from '@/components/SubmissionsManager';
import ManagerTasks from '@/components/ManagerTasks';
import ManagerStats from '@/components/ManagerStats';
import ManagerTasksView from '@/components/ManagerTasksView';
import ReleaseModerationPanel from '@/components/ReleaseModerationPanel';
import MessagesModal from '@/components/MessagesModal';
import AppHeader from '@/components/AppHeader';
import UserProfile from '@/components/UserProfile';
import MobileNav from '@/components/MobileNav';
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
  onRefreshData?: () => void;
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
  onLogout,
  onRefreshData
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
      <span className="ml-1 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full animate-pulse">
        {count > 99 ? '99+' : count}
      </span>
    );
  };

  const mobileNavItems = [
    { value: 'tasks', icon: 'CheckSquare', label: 'Задачи', badge: unreadCounts.tasks },
    { value: 'releases', icon: 'Music', label: 'Релизы', badge: 0 },
    { value: 'tickets', icon: 'Ticket', label: 'Тикеты', badge: unreadCounts.tickets },
    { value: 'submissions', icon: 'FileText', label: 'Заявки', badge: 0 },
    { value: 'old-tasks', icon: 'Archive', label: 'Архив', badge: 0 }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-yellow-950/30 to-black bg-grid-pattern pb-20 md:pb-0">
      <div className="container mx-auto p-4 animate-fadeIn">
        <div className="sticky top-0 z-30">
          <AppHeader 
            onMessagesClick={() => onMessagesOpenChange(true)}
            onProfileClick={() => setShowProfile(true)}
            onLogout={onLogout}
            onRefreshData={onRefreshData}
            userRole="manager"
            userId={user.id}
          />
        </div>

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
          <div className="hidden md:block w-full overflow-x-auto pb-2 scrollbar-hide mt-4">
            <TabsList className="grid w-full grid-cols-5 min-w-[800px] md:min-w-0 bg-card/60 backdrop-blur-sm border border-border rounded-xl p-1">
              <TabsTrigger value="tasks" className="text-xs md:text-sm px-2 md:px-4 transition-all duration-200 hover:scale-105">
                <Icon name="CheckSquare" className="w-4 h-4 md:w-5 md:h-5 text-green-500 animate-pulse" />
                <span className="hidden md:inline ml-2">Мои задачи</span>
                <Badge count={unreadCounts.tasks} />
              </TabsTrigger>
              <TabsTrigger value="old-tasks" className="text-xs md:text-sm px-2 md:px-4 transition-all duration-200 hover:scale-105">
                <Icon name="Archive" className="w-4 h-4 md:w-5 md:h-5 text-gray-500 animate-pulse" />
                <span className="hidden md:inline ml-2">Архив задач</span>
              </TabsTrigger>
              <TabsTrigger value="releases" className="text-xs md:text-sm px-2 md:px-4 transition-all duration-200 hover:scale-105">
                <Icon name="Music" className="w-4 h-4 md:w-5 md:h-5 text-purple-500 animate-pulse" />
                <span className="hidden md:inline ml-2">Релизы</span>
              </TabsTrigger>
              <TabsTrigger value="tickets" className="text-xs md:text-sm px-2 md:px-4 transition-all duration-200 hover:scale-105">
                <Icon name="Ticket" className="w-4 h-4 md:w-5 md:h-5 text-yellow-500 animate-pulse" />
                <span className="hidden md:inline ml-2">Тикеты</span>
                <Badge count={unreadCounts.tickets} />
              </TabsTrigger>
              <TabsTrigger value="submissions" className="text-xs md:text-sm px-2 md:px-4 transition-all duration-200 hover:scale-105">
                <Icon name="ClipboardList" className="w-4 h-4 md:w-5 md:h-5 text-blue-500 animate-pulse" />
                <span className="hidden md:inline ml-2">Заявки</span>
              </TabsTrigger>
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

      <MobileNav 
        items={mobileNavItems}
        activeTab={activeTab}
        onTabChange={(value) => {
          console.log('Manager tab change:', value);
          setActiveTab(value);
          localStorage.setItem('manager_active_tab', value);
        }}
      />
    </div>
  );
}