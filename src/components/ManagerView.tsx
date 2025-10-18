import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import TicketManagement from '@/components/TicketManagement';
import SubmissionsManager from '@/components/SubmissionsManager';
import ManagerTasks from '@/components/ManagerTasks';
import ManagerStats from '@/components/ManagerStats';
import MessagesModal from '@/components/MessagesModal';
import AppHeader from '@/components/AppHeader';
import { User, Ticket } from '@/types';

interface ManagerViewProps {
  user: User;
  tickets: Ticket[];
  managers: User[];
  statusFilter: string;
  messagesOpen: boolean;
  onStatusFilterChange: (filter: string) => void;
  onUpdateStatus: (ticketId: number, status: string) => void;
  onAssignTicket: (ticketId: number, managerId: number | null, deadline?: string) => void;
  onLoadTickets: () => void;
  onDeleteTicket: (ticketId: number) => void;
  onMessagesOpenChange: (open: boolean) => void;
  onLogout: () => void;
}

export default function ManagerView({
  user,
  tickets,
  managers,
  statusFilter,
  messagesOpen,
  onStatusFilterChange,
  onUpdateStatus,
  onAssignTicket,
  onLoadTickets,
  onDeleteTicket,
  onMessagesOpenChange,
  onLogout
}: ManagerViewProps) {
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

        <Tabs defaultValue="tasks" className="w-full">
          <div className="w-full overflow-x-auto pb-2">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="tasks">✅ Мои задачи</TabsTrigger>
              <TabsTrigger value="tickets">🎫 Тикеты</TabsTrigger>
              <TabsTrigger value="submissions">🎵 Послушайте мой трек</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="tasks">
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