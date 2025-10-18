import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import TicketManagement from '@/components/TicketManagement';
import SubmissionsManager from '@/components/SubmissionsManager';
import ManagerTasks from '@/components/ManagerTasks';
import ManagerStats from '@/components/ManagerStats';
import ManagerTasksView from '@/components/ManagerTasksView';
import MessagesModal from '@/components/MessagesModal';
import AppHeader from '@/components/AppHeader';
import { User, Ticket } from '@/types';
import { Task } from '@/components/useTasks';

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
  onLogout
}: ManagerViewProps) {
  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem('manager_active_tab') || 'tasks';
  });

  const [unreadCounts, setUnreadCounts] = useState({
    tickets: 0,
    tasks: 0,
    messages: 0,
    submissions: 0
  });

  const loadUnreadCounts = async () => {
    try {
      const token = localStorage.getItem('auth_token') || 'manager-token';
      const userId = localStorage.getItem('user_id') || user.id.toString();

      const response = await fetch('https://functions.poehali.dev/87d13cda-05ed-4e45-9232-344fe2c026d7', {
        headers: {
          'X-User-Id': userId,
          'X-Auth-Token': token
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUnreadCounts(data);
      }
    } catch (error) {
      console.error('Failed to load unread counts:', error);
    }
  };

  useEffect(() => {
    loadUnreadCounts();
    const interval = setInterval(loadUnreadCounts, 30000);
    return () => clearInterval(interval);
  }, []);

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
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="tasks">✅ Мои задачи<Badge count={unreadCounts.tasks} /></TabsTrigger>
              <TabsTrigger value="old-tasks">📋 Старые задачи</TabsTrigger>
              <TabsTrigger value="tickets">🎫 Тикеты<Badge count={unreadCounts.tickets} /></TabsTrigger>
              <TabsTrigger value="submissions">🎵 Послушайте мой трек</TabsTrigger>
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
            <SubmissionsManager userId={user.id} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}