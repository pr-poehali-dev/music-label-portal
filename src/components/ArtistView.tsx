import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ArtistDashboard from '@/components/ArtistDashboard';
import ArtistReports from '@/components/ArtistReports';
import CreateTicketForm from '@/components/CreateTicketForm';
import MyTickets from '@/components/MyTickets';
import MessagesModal from '@/components/MessagesModal';
import AppHeader from '@/components/AppHeader';
import { User, Ticket, NewTicket } from '@/types';

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
  onLogout
}: ArtistViewProps) {
  const [unreadCounts, setUnreadCounts] = useState({
    tickets: 0,
    tasks: 0,
    messages: 0,
    submissions: 0
  });

  const loadUnreadCounts = async () => {
    try {
      const token = localStorage.getItem('auth_token') || 'artist-token';
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
          userRole="artist"
          userId={user.id}
        />

        <MessagesModal 
          open={messagesOpen} 
          onOpenChange={onMessagesOpenChange}
          userId={user.id}
          userRole="artist"
        />

        <Tabs defaultValue="stats" className="w-full">
          <div className="w-full overflow-x-auto pb-2">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="stats">📊 Статистика</TabsTrigger>
              <TabsTrigger value="reports">📁 Отчёты</TabsTrigger>
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
      </div>
    </div>
  );
}