import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';
import ReleaseManager from '@/components/ReleaseManager';
import CreateTicketForm from '@/components/CreateTicketForm';
import MyTickets from '@/components/MyTickets';
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
  onRefreshData?: () => void;
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
  onLogout,
  onRefreshData
}: ArtistViewProps) {
  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem('artist_active_tab') || 'tracks';
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



  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-yellow-950/30 to-black bg-grid-pattern">
      <div className="container mx-auto px-0 md:p-4 animate-fadeIn">
        <div className="sticky top-0 z-30 mb-2 md:mb-0 px-2 md:px-0">
          <AppHeader 
            onMessagesClick={() => {}}
            onProfileClick={() => setShowProfile(true)}
            onLogout={onLogout}
            onRefreshData={onRefreshData}
            userRole="artist"
            userId={user.id}
          />
        </div>

        <Tabs 
          value={activeTab}
          onValueChange={(value) => {
            setActiveTab(value);
            localStorage.setItem('artist_active_tab', value);
          }}
          className="w-full mt-2 md:mt-4">
          <div className="w-full px-2 md:px-0">
            <TabsList className="grid w-full grid-cols-3 bg-card/60 backdrop-blur-sm border border-border rounded-xl p-0.5 md:p-1">
              <TabsTrigger value="tracks" className="text-[11px] md:text-sm px-1.5 md:px-4 transition-all duration-200 md:hover:scale-105 gap-1 md:gap-2">
                <Icon name="Music" className="w-3.5 h-3.5 md:w-5 md:h-5 text-purple-500 shrink-0" />
                <span className="truncate">Релизы</span>
              </TabsTrigger>
              <TabsTrigger value="support" className="text-[11px] md:text-sm px-1.5 md:px-4 transition-all duration-200 md:hover:scale-105 gap-1 md:gap-2">
                <Icon name="MessageSquare" className="w-3.5 h-3.5 md:w-5 md:h-5 text-blue-500 shrink-0" />
                <span className="truncate">Заявки</span>
                <Badge count={unreadCounts.tickets} />
              </TabsTrigger>
              <TabsTrigger value="reports" className="text-[11px] md:text-sm px-1.5 md:px-4 transition-all duration-200 md:hover:scale-105 gap-1 md:gap-2">
                <Icon name="FileText" className="w-3.5 h-3.5 md:w-5 md:h-5 text-orange-500 shrink-0" />
                <span className="truncate">Отчёты</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="tracks" className="mt-2 md:mt-6">
            <ReleaseManager userId={user.id} userRole="artist" />
          </TabsContent>

          <TabsContent value="support" className="mt-2 md:mt-6 px-2 md:px-0">
            <Tabs defaultValue="create" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-card/60 backdrop-blur-sm border border-border rounded-xl p-0.5 md:p-1">
                <TabsTrigger value="create" className="text-[11px] md:text-sm px-1.5 md:px-4 transition-all duration-200 hover:scale-105 gap-1 md:gap-2">
                  <Icon name="Edit" className="w-3.5 h-3.5 md:w-5 md:h-5 text-green-500 shrink-0" />
                  <span className="truncate">Создать</span>
                </TabsTrigger>
                <TabsTrigger value="my-tickets" className="text-[11px] md:text-sm px-1.5 md:px-4 transition-all duration-200 hover:scale-105 gap-1 md:gap-2">
                  <Icon name="List" className="w-3.5 h-3.5 md:w-5 md:h-5 text-yellow-500 shrink-0" />
                  <span className="truncate">Мои тикеты</span>
                  <Badge count={unreadCounts.tickets} />
                </TabsTrigger>
              </TabsList>

              <TabsContent value="create" className="mt-3 md:mt-4">
                <CreateTicketForm
                  newTicket={newTicket}
                  onTicketChange={onTicketChange}
                  onCreateTicket={onCreateTicket}
                  selectedFile={selectedTicketFile}
                  onFileChange={onFileChange}
                  uploading={uploadingTicket}
                />
              </TabsContent>

              <TabsContent value="my-tickets" className="mt-3 md:mt-4">
                <MyTickets
                  user={user}
                  tickets={tickets}
                  statusFilter={statusFilter}
                  onStatusFilterChange={onStatusFilterChange}
                  onLoadTickets={onLoadTickets}
                />
              </TabsContent>
            </Tabs>
          </TabsContent>

          <TabsContent value="reports" className="mt-2 md:mt-6 px-2 md:px-0">
            <div className="flex items-center justify-center min-h-[250px] md:min-h-[400px]">
              <div className="text-center space-y-2 md:space-y-4 p-4">
                <div className="text-4xl md:text-6xl">📊</div>
                <h2 className="text-base md:text-2xl font-bold text-yellow-500">Скоро будет доступно</h2>
                <p className="text-xs md:text-base text-gray-400">Работаем над этим разделом</p>
              </div>
            </div>
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