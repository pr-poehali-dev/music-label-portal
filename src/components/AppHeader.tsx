import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

interface AppHeaderProps {
  onMessagesClick: () => void;
  onLogout: () => void;
  userRole: 'artist' | 'manager' | 'director';
}

export default function AppHeader({ onMessagesClick, onLogout, userRole }: AppHeaderProps) {
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
          className="flex items-center gap-2"
        >
          <Icon name="MessageSquare" size={18} />
          {getMessagesLabel()}
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
