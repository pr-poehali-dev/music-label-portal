import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';
import TicketManagement from '@/components/TicketManagement';
import SubmissionsManager from '@/components/SubmissionsManager';
import ManagerStats from '@/components/ManagerStats';
import ManagerTasksView from '@/components/ManagerTasksView';
import ReleaseModerationPanel from '@/components/ReleaseModerationPanel';
import MessagesModal from '@/components/MessagesModal';
import AppHeader from '@/components/AppHeader';
import UserProfile from '@/components/UserProfile';
import NewsView from '@/components/NewsView';
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
  onUpdateTaskStatus: (taskId: number, status: string, completionReport?: string, completionFile?: File) => Promise<boolean>;
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
    return localStorage.getItem('manager_active_tab') || 'news';
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

        <Tabs 
          value={activeTab}
          onValueChange={(value) => {
            setActiveTab(value);
            localStorage.setItem('manager_active_tab', value);
          }}
          className="w-full mt-4">
          <div className="w-full overflow-x-auto scrollbar-hide">
            <TabsList className="inline-flex min-w-full bg-card/60 backdrop-blur-sm border border-border rounded-xl p-1.5 gap-1">
              <TabsTrigger value="news" className="flex items-center gap-2 px-4 py-2.5 whitespace-nowrap">
                <Icon name="Newspaper" className="w-4 h-4 text-yellow-500" />
                <span>Новости</span>
              </TabsTrigger>
              <TabsTrigger value="tasks" className="flex items-center gap-2 px-4 py-2.5 whitespace-nowrap">
                <Icon name="CheckSquare" className="w-4 h-4 text-green-500" />
                <span>Задачи</span>
                {unreadCounts.tasks > 0 && <Badge count={unreadCounts.tasks} />}
              </TabsTrigger>
              <TabsTrigger value="tickets" className="flex items-center gap-2 px-4 py-2.5 whitespace-nowrap">
                <Icon name="Ticket" className="w-4 h-4 text-yellow-500" />
                <span>Тикеты</span>
                {unreadCounts.tickets > 0 && <Badge count={unreadCounts.tickets} />}
              </TabsTrigger>
              <TabsTrigger value="releases" className="flex items-center gap-2 px-4 py-2.5 whitespace-nowrap">
                <Icon name="Music" className="w-4 h-4 text-purple-500" />
                <span>Релизы</span>
              </TabsTrigger>
              <TabsTrigger value="submissions" className="flex items-center gap-2 px-4 py-2.5 whitespace-nowrap">
                <Icon name="ClipboardList" className="w-4 h-4 text-blue-500" />
                <span>Питчинг</span>
              </TabsTrigger>
              <TabsTrigger value="kpi" className="flex items-center gap-2 px-4 py-2.5 whitespace-nowrap">
                <Icon name="BarChart3" className="w-4 h-4 text-orange-500" />
                <span>КПД</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="news">
            <NewsView userRole="manager" userId={user.id} />
          </TabsContent>

          <TabsContent value="tasks">
            <ManagerTasksView 
              tasks={tasks}
              onUpdateTaskStatus={onUpdateTaskStatus}
            />
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

          <TabsContent value="kpi">
            <ManagerStats userId={user.id} />
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
                onClose={() => setShowProfile(false)}
              />
            </div>
          </div>
        )}
      </div>


    </div>
  );
}