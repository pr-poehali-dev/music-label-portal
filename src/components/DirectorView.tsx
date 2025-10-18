import DirectorTabs from '@/components/DirectorTabs';
import MessagesModal from '@/components/MessagesModal';
import AppHeader from '@/components/AppHeader';
import { User } from './useAuth';
import { Ticket } from './useTickets';

interface DirectorViewProps {
  user: User;
  tickets: Ticket[];
  managers: User[];
  allUsers: User[];
  statusFilter: string;
  newTicket: { title: string; description: string; priority: string };
  newUser: { username: string; full_name: string; role: string };
  messagesOpen: boolean;
  onStatusFilterChange: (filter: string) => void;
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
  onMessagesOpenChange: (open: boolean) => void;
  onLogout: () => void;
}

export default function DirectorView({
  user,
  tickets,
  managers,
  allUsers,
  statusFilter,
  newTicket,
  newUser,
  messagesOpen,
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
  onUpdateUser,
  onMessagesOpenChange,
  onLogout
}: DirectorViewProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-yellow-950/30 to-black bg-grid-pattern">
      <div className="container mx-auto p-4 animate-fadeIn">
        <AppHeader 
          onMessagesClick={() => onMessagesOpenChange(true)}
          onLogout={onLogout}
          userRole="director"
        />

        <MessagesModal 
          open={messagesOpen} 
          onOpenChange={onMessagesOpenChange}
          userId={user.id}
          userRole="boss"
        />

        <DirectorTabs
          user={user}
          tickets={tickets}
          managers={managers}
          allUsers={allUsers}
          statusFilter={statusFilter}
          newTicket={newTicket}
          newUser={newUser}
          onStatusFilterChange={onStatusFilterChange}
          onNewTicketChange={onNewTicketChange}
          onCreateTicket={onCreateTicket}
          onUpdateStatus={onUpdateStatus}
          onAssignTicket={onAssignTicket}
          onLoadTickets={onLoadTickets}
          onNewUserChange={onNewUserChange}
          onCreateUser={onCreateUser}
          onLoadAllUsers={onLoadAllUsers}
          onDeleteTicket={onDeleteTicket}
          onUpdateUser={onUpdateUser}
        />
      </div>
    </div>
  );
}
