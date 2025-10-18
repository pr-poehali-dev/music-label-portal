import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

interface AppHeaderProps {
  onMessagesClick: () => void;
  onLogout: () => void;
  userRole: 'artist' | 'manager' | 'director';
  userId: number;
}

export default function AppHeader({ onMessagesClick, onLogout, userRole, userId }: AppHeaderProps) {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    loadUnreadCount();
    const interval = setInterval(loadUnreadCount, 5000);
    return () => clearInterval(interval);
  }, [userId]);

  const loadUnreadCount = async () => {
    try {
      const response = await fetch(`https://functions.poehali.dev/9e9a7f27-c25d-45a8-aa64-3dd7fef5ffb7?user_id=${userId}&list_dialogs=true`);
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
    if (userRole === 'artist') return 'Написать руководителю';
    if (userRole === 'manager') return 'Написать руководителю';
    return 'Сообщения от команды';
  };

  return (
    <div className="flex justify-between items-center mb-6 bg-card/60 backdrop-blur-sm border border-border rounded-xl p-4 animate-slideIn">
      <div className="flex items-center gap-4">
        <img 
          src="https://cdn.poehali.dev/files/89837016-5bd9-4196-8bef-fad51c37ba4e.jpg" 
          alt="420 Logo" 
          className="w-12 h-12 rounded-full shadow-lg shadow-primary/50 animate-glow"
        />
        <h1 className="text-3xl font-bold text-primary">420.рф</h1>
      </div>
      <div className="flex items-center gap-3">
        <Button
          onClick={onMessagesClick}
          variant="outline"
          className={`flex items-center gap-2 relative ${unreadCount > 0 ? 'animate-pulse border-red-500' : ''}`}
        >
          <Icon name="MessageSquare" size={18} />
          {getMessagesLabel()}
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center animate-bounce">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
        <button 
          onClick={onLogout}
          className="px-6 py-2 bg-gradient-to-r from-primary to-secondary text-primary-foreground font-semibold rounded-lg hover:shadow-lg hover:shadow-primary/50 transition-all"
        >
          Выйти
        </button>
      </div>
    </div>
  );
}