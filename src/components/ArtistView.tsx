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
              <TabsTrigger value="my-tickets">🎫 Мои тикеты</TabsTrigger>
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