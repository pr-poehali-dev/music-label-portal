import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ArtistDashboard from '@/components/ArtistDashboard';
import ArtistReports from '@/components/ArtistReports';
import ArtistTracks from '@/components/ArtistTracks';
import CreateTicketForm from '@/components/CreateTicketForm';
import MyTickets from '@/components/MyTickets';
import MessagesModal from '@/components/MessagesModal';
import AppHeader from '@/components/AppHeader';
import UserProfile from '@/components/UserProfile';
import { User, Ticket, NewTicket } from '@/types';
import { useNotifications } from '@/contexts/NotificationContext';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { useActivityTracking } from '@/hooks/useActivityTracking';

interface ArtistViewProps {
  user: User;
  tickets: Ticket[];
  statusFilter: string;
  newTicket: NewTicket;
  selectedTicketFile: File | null;
  uploadingTicket: boolean;
  messagesOpen: boolean;
  onStatusFilterChange: (filter: string) => void;
  onTicketChange: (ticket: NewTicket) => void;
  onCreateTicket: () => void;
  onFileChange: (file: File | null) => void;
  onLoadTickets: () => void;
  onMessagesOpenChange: (open: boolean) => void;
  onUpdateUser: (updates: Partial<User>) => void;
  onLogout: () => void;
}

export default function ArtistView({
  user,
  tickets,
  statusFilter,
  newTicket,
  selectedTicketFile,
  uploadingTicket,
  messagesOpen,
  onStatusFilterChange,
  onTicketChange,
  onCreateTicket,
  onFileChange,
  onLoadTickets,
  onMessagesOpenChange,
  onUpdateUser,
  onLogout
}: ArtistViewProps) {
  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem('artist_active_tab') || 'stats';
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
          userRole="artist"
          userId={user.id}
        />

        <MessagesModal 
          open={messagesOpen} 
          onOpenChange={onMessagesOpenChange}
          userId={user.id}
          userRole="artist"
        />

        <Tabs 
          value={activeTab}
          onValueChange={(value) => {
            setActiveTab(value);
            localStorage.setItem('artist_active_tab', value);
          }}
          className="w-full">
          <div className="w-full overflow-x-auto pb-2">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="stats">📊 Статистика</TabsTrigger>
              <TabsTrigger value="reports">📁 Отчёты</TabsTrigger>
              <TabsTrigger value="tracks">🎵 Мои треки</TabsTrigger>
              <TabsTrigger value="create">✉️ Создать тикет</TabsTrigger>
              <TabsTrigger value="my-tickets">🎫 Мои тикеты<Badge count={unreadCounts.tickets} /></TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="stats">
            <ArtistDashboard user={user} />
          </TabsContent>

          <TabsContent value="reports">
            <ArtistReports userId={user.id} userName={user.full_name} />
          </TabsContent>

          <TabsContent value="tracks">
            <ArtistTracks userId={user.id} />
          </TabsContent>

          <TabsContent value="create">
            <CreateTicketForm
              newTicket={newTicket}
              onTicketChange={onTicketChange}
              onCreateTicket={onCreateTicket}
              selectedFile={selectedTicketFile}
              onFileChange={onFileChange}
              uploading={uploadingTicket}
            />
          </TabsContent>

          <TabsContent value="my-tickets">
            <MyTickets
              user={user}
              tickets={tickets}
              statusFilter={statusFilter}
              onStatusFilterChange={onStatusFilterChange}
              onLoadTickets={onLoadTickets}
            />
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