import { useState } from 'react';
import DirectorTabs, { DirectorMobileNav } from '@/components/DirectorTabs';
import MessagesModal from '@/components/MessagesModal';
import AppHeader from '@/components/AppHeader';
import UserProfile from '@/components/UserProfile';
import { User, Ticket, NewTicket, NewUser } from '@/types';
import { Task } from '@/components/useTasks';

interface DirectorViewProps {
  user: User;
  tickets: Ticket[];
  managers: User[];
  allUsers: User[];
  tasks: Task[];
  statusFilter: string;
  newTicket: NewTicket;
  newUser: NewUser;
  messagesOpen: boolean;
  onStatusFilterChange: (filter: string) => void;
  onNewTicketChange: (ticket: NewTicket) => void;
  onCreateTicket: () => void;
  onUpdateStatus: (ticketId: number, status: string) => void;
  onAssignTicket: (ticketId: number, managerId: number | null, deadline?: string) => void;
  onLoadTickets: () => void;
  onNewUserChange: (user: NewUser) => void;
  onCreateUser: () => void;
  onLoadAllUsers: () => void;
  onDeleteTicket: (ticketId: number) => void;
  onUpdateUser: (userId: number, userData: Partial<User>) => void;
  onCreateTask: (task: any) => Promise<boolean>;
  onUpdateTaskStatus: (taskId: number, status: string, completionReport?: string, completionFile?: File) => Promise<boolean>;
  onDeleteTask: (taskId: number) => Promise<boolean>;
  onMessagesOpenChange: (open: boolean) => void;
  onLogout: () => void;
  onRefreshData?: () => void;
}

export default function DirectorView({
  user,
  tickets,
  managers,
  allUsers,
  tasks,
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
  onCreateTask,
  onUpdateTaskStatus,
  onDeleteTask,
  onMessagesOpenChange,
  onLogout,
  onRefreshData
}: DirectorViewProps) {
  const [showProfile, setShowProfile] = useState(false);
  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem('director_active_tab') || 'analytics';
  });

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    localStorage.setItem('director_active_tab', value);
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-yellow-950/30 to-black bg-grid-pattern">
      <div className="container mx-auto p-2 md:p-4 animate-fadeIn">
        <MessagesModal 
          open={messagesOpen} 
          onOpenChange={onMessagesOpenChange}
          userId={user.id}
          userRole="boss"
        />

        <div className="sticky top-0 z-30">
          <AppHeader 
            onMessagesClick={() => onMessagesOpenChange(true)}
            onProfileClick={() => setShowProfile(true)}
            onLogout={onLogout}
            onRefreshData={onRefreshData}
            userRole="director"
            userId={user.id}
          />
        </div>

        <DirectorTabs
          user={user}
          tickets={tickets}
          managers={managers}
          allUsers={allUsers}
          tasks={tasks}
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
          onCreateTask={onCreateTask}
          onUpdateTaskStatus={onUpdateTaskStatus}
          onDeleteTask={onDeleteTask}
          activeTab={activeTab}
          onTabChange={handleTabChange}
        />

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
                onUpdateProfile={(updates) => onUpdateUser(user.id, updates)}
              />
            </div>
          </div>
        )}
      </div>

      <DirectorMobileNav activeTab={activeTab} onTabChange={handleTabChange} />
    </div>
  );
}