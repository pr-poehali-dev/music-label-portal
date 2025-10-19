import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';
import ReleaseManager from '@/components/ReleaseManager';
import CreateTicketForm from '@/components/CreateTicketForm';
import MyTickets from '@/components/MyTickets';
import MessagesModal from '@/components/MessagesModal';
import AppHeader from '@/components/AppHeader';
import UserProfile from '@/components/UserProfile';
import MobileNav from '@/components/MobileNav';
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

  const mobileNavItems = [
    { value: 'tracks', icon: 'Music', label: 'Релизы', badge: 0 },
    { value: 'support', icon: 'MessageSquare', label: 'Заявки', badge: unreadCounts.tickets },
    { value: 'reports', icon: 'FileText', label: 'Отчёты', badge: 0 }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-yellow-950/30 to-black bg-grid-pattern pb-20 md:pb-0">
      <div className="container mx-auto p-4 animate-fadeIn">
        <div className="sticky top-0 z-30">
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
          className="w-full">
          <div className="hidden md:block w-full overflow-x-auto pb-2 scrollbar-hide mt-4">
            <TabsList className="grid w-full grid-cols-3 min-w-[600px] md:min-w-0 bg-card/60 backdrop-blur-sm border border-border rounded-xl p-1">
              <TabsTrigger value="tracks" className="text-xs md:text-sm px-2 md:px-4 transition-all duration-200 hover:scale-105">
                <Icon name="Music" className="w-4 h-4 md:w-5 md:h-5 text-purple-500 animate-pulse" />
                <span className="hidden md:inline ml-2">Релизы</span>
              </TabsTrigger>
              <TabsTrigger value="support" className="text-xs md:text-sm px-2 md:px-4 transition-all duration-200 hover:scale-105">
                <Icon name="MessageSquare" className="w-4 h-4 md:w-5 md:h-5 text-blue-500 animate-pulse" />
                <span className="hidden md:inline ml-2">Обратиться</span>
                <Badge count={unreadCounts.tickets} />
              </TabsTrigger>
              <TabsTrigger value="reports" className="text-xs md:text-sm px-2 md:px-4 transition-all duration-200 hover:scale-105">
                <Icon name="FileText" className="w-4 h-4 md:w-5 md:h-5 text-orange-500 animate-pulse" />
                <span className="hidden md:inline ml-2">Отчёты</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="tracks">
            <ReleaseManager userId={user.id} userRole="artist" />
          </TabsContent>

          <TabsContent value="support">
            <Tabs defaultValue="create" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-card/60 backdrop-blur-sm border border-border rounded-xl p-1">
                <TabsTrigger value="create" className="text-xs md:text-sm px-2 md:px-4 transition-all duration-200 hover:scale-105">
                  <Icon name="Edit" className="w-4 h-4 md:w-5 md:h-5 text-green-500" />
                  <span className="ml-2">Создать тикет</span>
                </TabsTrigger>
                <TabsTrigger value="my-tickets" className="text-xs md:text-sm px-2 md:px-4 transition-all duration-200 hover:scale-105">
                  <Icon name="List" className="w-4 h-4 md:w-5 md:h-5 text-yellow-500" />
                  <span className="ml-2">Мои тикеты</span>
                  <Badge count={unreadCounts.tickets} />
                </TabsTrigger>
              </TabsList>

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
          </TabsContent>

          <TabsContent value="reports">
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center space-y-4">
                <div className="text-6xl">📊</div>
                <h2 className="text-2xl font-bold text-yellow-500">Скоро будет доступно</h2>
                <p className="text-gray-400">Работаем над этим разделом</p>
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
              />
            </div>
          </div>
        )}
      </div>

      <MobileNav 
        items={mobileNavItems}
        activeTab={activeTab}
        onTabChange={(value) => {
          console.log('Artist tab change:', value);
          setActiveTab(value);
          localStorage.setItem('artist_active_tab', value);
        }}
      />
    </div>
  );
}