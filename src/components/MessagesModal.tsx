import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { API_ENDPOINTS } from '@/config/api';

interface Message {
  id: number;
  sender_id: number;
  receiver_id?: number;
  sender_name: string;
  sender_role: string;
  message: string;
  created_at: string;
  is_read: boolean;
  is_from_boss: boolean;
}

interface DialogUser {
  user_id: number;
  name: string;
  role: string;
  unread_count: number;
  last_message: string;
  last_message_time: string;
}

interface MessagesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: number;
  userRole: 'director' | 'manager' | 'head';
  userName?: string;
}

const MESSAGES_API = API_ENDPOINTS.MESSAGES;

export function MessagesModal({ open, onOpenChange, userId, userRole, userName }: MessagesModalProps) {
  const [dialogUsers, setDialogUsers] = useState<DialogUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<DialogUser | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      loadDialogsList();
    }
  }, [open]);

  const loadDialogsList = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${MESSAGES_API}?list_dialogs=true&user_id=${userId}`);
      if (!response.ok) throw new Error('Ошибка загрузки диалогов');
      
      const data = await response.json();
      setDialogUsers(data);
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить список диалогов',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadDialog = async (withUserId?: number) => {
    setLoading(true);
    try {
      const targetUserId = withUserId || selectedUser?.user_id;
      if (!targetUserId) {
        setLoading(false);
        return;
      }
      
      const url = `${MESSAGES_API}?user_id=${userId}&dialog_with=${targetUserId}`;
      
      const response = await fetch(url);
      if (!response.ok) throw new Error('Ошибка загрузки сообщений');
      
      const data = await response.json();
      setMessages(data);
      
      const unreadIds = data.filter((m: Message) => m.receiver_id === userId && !m.is_read).map((m: Message) => m.id);
      if (unreadIds.length > 0) {
        markAsRead(unreadIds);
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить сообщения',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (messageIds: number[]) => {
    for (const messageId of messageIds) {
      try {
        await fetch(MESSAGES_API, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message_id: messageId, is_read: true }),
        });
      } catch (error) {
        console.error('Ошибка отметки сообщения:', error);
      }
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedUser) return;
    
    setSending(true);
    try {
      const response = await fetch(MESSAGES_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender_id: userId,
          receiver_id: selectedUser.user_id,
          message: newMessage.trim(),
        }),
      });

      if (!response.ok) throw new Error('Ошибка отправки');

      setNewMessage('');
      loadDialog(selectedUser.user_id);
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось отправить сообщение',
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const isToday = date.toDateString() === today.toDateString();
    const isYesterday = date.toDateString() === yesterday.toDateString();

    const time = date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });

    if (isToday) return time;
    if (isYesterday) return `Вчера`;
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
  };

  const handleUserSelect = (user: DialogUser) => {
    setSelectedUser(user);
    loadDialog(user.user_id);
  };

  const handleBack = () => {
    setSelectedUser(null);
    setMessages([]);
    loadDialogsList();
  };

  const totalUnread = dialogUsers.reduce((sum, u) => sum + u.unread_count, 0);

  if (!selectedUser) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md max-h-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Icon name="MessageSquare" size={24} />
              {userRole === 'director' ? 'Сообщения от команды' : 'Мои диалоги'}
              {totalUnread > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                  {totalUnread}
                </span>
              )}
            </DialogTitle>
          </DialogHeader>

          <ScrollArea className="h-[500px]">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Icon name="Loader2" className="animate-spin" size={24} />
              </div>
            ) : dialogUsers.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Icon name="Inbox" size={48} className="mx-auto mb-3 opacity-30" />
                <p className="text-lg">Нет сообщений</p>
              </div>
            ) : (
              <div className="space-y-2">
                {dialogUsers.map((user) => (
                  <button
                    key={user.user_id}
                    onClick={() => handleUserSelect(user)}
                    className={`w-full p-4 rounded-lg border transition-all text-left ${
                      user.unread_count > 0
                        ? 'border-primary bg-primary/10 hover:bg-primary/20 shadow-lg shadow-primary/20'
                        : 'border-gray-700 bg-gray-800 hover:bg-gray-700'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                        user.role === 'director' 
                          ? 'bg-red-600 text-white'
                          : user.role === 'manager' 
                          ? 'bg-green-600 text-white' 
                          : 'bg-purple-600 text-white'
                      }`}>
                        <Icon 
                          name={user.role === 'director' ? 'Crown' : user.role === 'manager' ? 'UserCheck' : 'Music'} 
                          size={20} 
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-semibold text-base truncate text-white">{user.name}</p>
                          {user.last_message_time && (
                            <span className="text-xs text-gray-400 ml-2 flex-shrink-0">
                              {formatDate(user.last_message_time)}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 mb-1">
                          {user.role === 'director' ? 'Руководитель' : user.role === 'manager' ? 'Менеджер' : 'Артист'}
                        </p>
                        {user.last_message && (
                          <p className="text-sm text-gray-300 truncate">{user.last_message}</p>
                        )}
                      </div>
                      {user.unread_count > 0 && (
                        <div className="flex-shrink-0">
                          <span className="inline-block px-2 py-1 bg-red-500 text-white text-xs rounded-full">
                            {user.unread_count}
                          </span>
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[700px] flex flex-col p-0 bg-gray-900 text-white border-gray-700">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-gray-700 bg-gray-800">
          <DialogTitle className="flex items-center gap-2">
            {userRole === 'boss' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                className="mr-2"
              >
                <Icon name="ArrowLeft" size={20} />
              </Button>
            )}
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              userRole === 'boss' 
                ? selectedUser?.role === 'manager' 
                  ? 'bg-green-600 text-white' 
                  : 'bg-purple-600 text-white'
                : 'bg-yellow-600 text-white'
            }`}>
              <Icon 
                name={
                  userRole === 'boss' 
                    ? selectedUser?.role === 'manager' ? 'UserCheck' : 'Music'
                    : 'Crown'
                } 
                size={20} 
              />
            </div>
            <div>
              <p className="font-semibold text-white">
                {userRole === 'boss' ? selectedUser?.name : 'Руководитель'}
              </p>
              <p className="text-xs text-gray-400 font-normal">
                {userRole === 'boss' 
                  ? selectedUser?.role === 'manager' ? 'Менеджер' : 'Артист'
                  : 'Онлайн'}
              </p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 px-6 py-4 h-[400px] bg-gray-900">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Icon name="Loader2" className="animate-spin" size={32} />
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Icon name="MessageCircle" size={48} className="mx-auto mb-3 opacity-30" />
              <p className="text-lg">Начните диалог</p>
              <p className="text-sm">Напишите первое сообщение</p>
            </div>
          ) : (
            <div className="space-y-3">
              {messages.map((msg) => {
                const isMyMessage = msg.sender_id === userId;
                return (
                  <div
                    key={msg.id}
                    className={`flex ${isMyMessage ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[70%] ${isMyMessage ? 'order-2' : 'order-1'}`}>
                      <div
                        className={`rounded-2xl px-4 py-3 ${
                          isMyMessage
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-700 text-white'
                        }`}
                      >
                        <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                          {msg.message}
                        </p>
                      </div>
                      <div className={`mt-1 px-2 flex items-center gap-1 ${isMyMessage ? 'justify-end' : 'justify-start'}`}>
                        <span className="text-xs text-gray-400">
                          {formatDate(msg.created_at)}
                        </span>
                        {isMyMessage && msg.is_read && (
                          <Icon name="CheckCheck" size={14} className="text-blue-500" />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>

        <div className="px-6 py-4 border-t border-gray-700 bg-gray-800">
          <div className="flex items-end gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              placeholder="Введите сообщение..."
              className="flex-1 bg-gray-700 border-gray-600 text-white placeholder:text-gray-400"
              disabled={sending}
            />
            <Button 
              onClick={sendMessage} 
              disabled={!newMessage.trim() || sending}
              size="icon"
              className="h-10 w-10"
            >
              {sending ? (
                <Icon name="Loader2" className="animate-spin" size={20} />
              ) : (
                <Icon name="Send" size={20} />
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default MessagesModal;