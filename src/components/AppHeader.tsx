import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import NotificationBell from '@/components/NotificationBell';
import { API_ENDPOINTS } from '@/config/api';

interface AppHeaderProps {
  onMessagesClick: () => void;
  onProfileClick: () => void;
  onLogout: () => void;
  onRefreshData?: () => void;
  userRole: 'artist' | 'manager' | 'director';
  userId: number;
}

export default function AppHeader({ onMessagesClick, onProfileClick, onLogout, onRefreshData, userRole, userId }: AppHeaderProps) {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    loadUnreadCount();
    const interval = setInterval(loadUnreadCount, 5000);
    return () => clearInterval(interval);
  }, [userId]);

  const loadUnreadCount = async () => {
    try {
      const response = await fetch(`${API_ENDPOINTS.MESSAGES}?user_id=${userId}&list_dialogs=true`);
      if (response.ok) {
        const dialogs = await response.json();
        const total = Array.isArray(dialogs) 
          ? dialogs.reduce((sum: number, dialog: any) => sum + (dialog.unread_count || 0), 0) 
          : 0;
        setUnreadCount(total);
      }
    } catch (error) {
      console.error('Failed to load unread count:', error);
    }
  };

  const getMessagesLabel = () => {
    if (userRole === 'manager') return 'Написать руководителю';
    return 'Сообщения от команды';
  };

  return (
    <div className="flex justify-between items-center bg-card/60 backdrop-blur-sm border border-border rounded-xl p-3 md:p-4 animate-slideIn">
      <div className="flex items-center gap-2 md:gap-4 group cursor-pointer">
        <div className="relative">
          <img 
            src="https://cdn.poehali.dev/files/89837016-5bd9-4196-8bef-fad51c37ba4e.jpg" 
            alt="420 Logo" 
            className="w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-2xl shadow-2xl shadow-primary/50 group-hover:scale-110 transition-transform duration-300 border-2 border-primary/30"
          />
          <div className="hidden md:block absolute -inset-1 bg-gradient-to-r from-primary to-secondary rounded-2xl blur opacity-0 group-hover:opacity-75 transition-opacity duration-300 -z-10" />
        </div>
        <div>
          <h1 className="text-2xl md:text-4xl font-black animate-shimmer">420</h1>
          <p className="text-xs text-primary/60 tracking-wider">Музыкальный лейбл</p>
        </div>
      </div>
      
      {/* Desktop menu */}
      <div className="hidden md:flex items-center gap-2 md:gap-3">
        <NotificationBell userId={userId} />
        {userRole !== 'artist' && (
          <Button
            onClick={onMessagesClick}
            variant="outline"
            size="sm"
            className={`flex items-center gap-1 md:gap-2 relative text-xs md:text-sm px-2 md:px-4 ${unreadCount > 0 ? 'animate-pulse border-red-500' : ''}`}
          >
            <Icon name="MessageSquare" size={16} className="md:w-[18px] md:h-[18px]" />
            <span className="hidden md:inline">{getMessagesLabel()}</span>
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center animate-bounce">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Button>
        )}
        {onRefreshData && (
          <Button
            onClick={onRefreshData}
            variant="outline"
            size="sm"
            className="flex items-center gap-1 md:gap-2 text-xs md:text-sm px-2 md:px-4"
            title="Обновить данные профиля"
          >
            <Icon name="RefreshCw" size={16} className="md:w-[18px] md:h-[18px]" />
            <span className="hidden lg:inline">Обновить</span>
          </Button>
        )}
        <Button
          onClick={onProfileClick}
          variant="outline"
          size="sm"
          className="flex items-center gap-1 md:gap-2 text-xs md:text-sm px-2 md:px-4"
        >
          <Icon name="User" size={16} className="md:w-[18px] md:h-[18px]" />
          <span className="hidden md:inline">Профиль</span>
        </Button>
        <button 
          onClick={onLogout}
          className="px-3 py-2 md:px-6 md:py-2 bg-gradient-to-r from-primary to-secondary text-primary-foreground font-semibold rounded-lg hover:shadow-lg hover:shadow-primary/50 transition-all text-xs md:text-sm"
        >
          Выйти
        </button>
      </div>

      {/* Mobile menu */}
      <div className="flex md:hidden items-center gap-2">
        <NotificationBell userId={userId} />
        {userRole !== 'artist' && (
          <Button
            onClick={onMessagesClick}
            variant="outline"
            size="sm"
            className={`relative p-2 ${unreadCount > 0 ? 'animate-pulse border-red-500' : ''}`}
          >
            <Icon name="MessageSquare" size={16} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center animate-bounce">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Button>
        )}
        {onRefreshData && (
          <Button
            onClick={onRefreshData}
            variant="outline"
            size="sm"
            className="p-2"
            title="Обновить данные профиля"
          >
            <Icon name="RefreshCw" size={16} />
          </Button>
        )}
        <Button
          onClick={onProfileClick}
          variant="outline"
          size="sm"
          className="p-2"
        >
          <Icon name="User" size={16} />
        </Button>
        <button 
          onClick={onLogout}
          className="px-3 py-2 bg-gradient-to-r from-primary to-secondary text-primary-foreground font-semibold rounded-lg hover:shadow-lg hover:shadow-primary/50 transition-all text-xs"
        >
          <Icon name="LogOut" size={16} />
        </button>
      </div>
    </div>
  );
}