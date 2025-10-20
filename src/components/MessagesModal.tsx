import { useState, useEffect, useRef, useCallback } from 'react';
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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      loadDialogsList();
    }
  }, [open, userId]);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
      }, 100);
    }
  }, [messages]);

  const loadDialogsList = useCallback(async () => {
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
  }, [userId, toast]);

  const loadDialog = useCallback(async (withUserId?: number) => {
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
  }, [userId, selectedUser, toast]);

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
    if (isYesterday) return `Вчера, ${time}`;
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
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
        <DialogContent className="max-w-2xl h-[80vh] flex flex-col bg-card border-primary/20">
          <DialogHeader className="border-b border-border/50 pb-4">
            <DialogTitle className="flex items-center gap-2 text-primary">
              <Icon name="MessageSquare" size={24} />
              {userRole === 'director' ? 'Сообщения от команды' : 'Мои диалоги'}
              {totalUnread > 0 && (
                <span className="ml-auto px-2.5 py-0.5 bg-red-500 text-white text-xs rounded-full font-semibold">
                  {totalUnread}
                </span>
              )}
            </DialogTitle>
          </DialogHeader>

          <ScrollArea className="flex-1 pr-4">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Icon name="Loader2" className="animate-spin text-primary" size={32} />
              </div>
            ) : dialogUsers.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <Icon name="Inbox" size={56} className="mx-auto mb-4 opacity-30" />
                <p className="text-lg font-medium">Нет диалогов</p>
                <p className="text-sm mt-2">Выберите пользователя для начала общения</p>
              </div>
            ) : (
              <div className="space-y-2 py-2">
                {dialogUsers.map((user) => (
                  <button
                    key={user.user_id}
                    onClick={() => handleUserSelect(user)}
                    className={`w-full p-4 rounded-lg border transition-all text-left hover:scale-[1.02] ${
                      user.unread_count > 0
                        ? 'border-primary bg-primary/10 shadow-lg shadow-primary/20'
                        : 'border-border/50 bg-card/50 hover:bg-card hover:border-primary/30'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg ${
                        user.role === 'director' 
                          ? 'bg-gradient-to-br from-red-500 to-red-600' 
                          : user.role === 'manager' 
                          ? 'bg-gradient-to-br from-green-500 to-green-600' 
                          : 'bg-gradient-to-br from-purple-500 to-purple-600'
                      }`}>
                        <Icon 
                          name={user.role === 'director' ? 'Crown' : user.role === 'manager' ? 'UserCheck' : 'Music'} 
                          size={20}
                          className="text-white"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-semibold text-base truncate">{user.name}</p>
                          {user.last_message_time && (
                            <span className="text-xs text-muted-foreground ml-2 flex-shrink-0">
                              {formatDate(user.last_message_time)}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mb-1">
                          {user.role === 'director' ? 'Руководитель' : user.role === 'manager' ? 'Менеджер' : 'Артист'}
                        </p>
                        {user.last_message && (
                          <p className="text-sm text-muted-foreground truncate">{user.last_message}</p>
                        )}
                      </div>
                      {user.unread_count > 0 && (
                        <div className="flex-shrink-0">
                          <span className="inline-flex items-center justify-center min-w-[24px] h-6 px-2 bg-red-500 text-white text-xs font-semibold rounded-full">
                            {user.unread_count > 99 ? '99+' : user.unread_count}
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
      <DialogContent className="max-w-2xl h-[80vh] flex flex-col p-0 bg-card border-primary/20">
        <DialogHeader className="px-6 py-4 border-b border-border/50 flex-shrink-0">
          <DialogTitle className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              className="p-2 hover:bg-primary/20 -ml-2"
            >
              <Icon name="ArrowLeft" size={20} />
            </Button>
            <div className={`w-11 h-11 rounded-full flex items-center justify-center shadow-lg ${
              selectedUser.role === 'director'
                ? 'bg-gradient-to-br from-red-500 to-red-600'
                : selectedUser.role === 'manager' 
                ? 'bg-gradient-to-br from-green-500 to-green-600' 
                : 'bg-gradient-to-br from-purple-500 to-purple-600'
            }`}>
              <Icon 
                name={selectedUser.role === 'director' ? 'Crown' : selectedUser.role === 'manager' ? 'UserCheck' : 'Music'} 
                size={20}
                className="text-white"
              />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-base">{selectedUser.name}</p>
              <p className="text-xs text-muted-foreground font-normal">
                {selectedUser.role === 'director' ? 'Руководитель' : selectedUser.role === 'manager' ? 'Менеджер' : 'Артист'}
              </p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col">
          <ScrollArea className="flex-1 px-6">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Icon name="Loader2" className="animate-spin text-primary" size={36} />
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <Icon name="MessageCircle" size={56} className="mx-auto mb-4 opacity-30" />
                <p className="text-lg font-medium">Начните диалог</p>
                <p className="text-sm mt-2">Напишите первое сообщение</p>
              </div>
            ) : (
              <div className="space-y-4 py-4">
                {messages.map((msg) => {
                  const isMyMessage = msg.sender_id === userId;
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isMyMessage ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[75%]`}>
                        <div
                          className={`rounded-2xl px-4 py-3 shadow-md ${
                            isMyMessage
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted'
                          }`}
                        >
                          <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                            {msg.message}
                          </p>
                        </div>
                        <div className={`mt-1.5 px-2 flex items-center gap-1.5 ${isMyMessage ? 'justify-end' : 'justify-start'}`}>
                          <span className="text-xs text-muted-foreground">
                            {formatDate(msg.created_at)}
                          </span>
                          {isMyMessage && msg.is_read && (
                            <Icon name="CheckCheck" size={14} className="text-primary" />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            )}
          </ScrollArea>
        </div>

        <div className="px-6 py-4 border-t border-border/50 flex-shrink-0">
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage();
            }}
            className="flex items-end gap-3"
          >
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Написать сообщение..."
              className="flex-1 bg-background border-border/50 focus:border-primary"
              disabled={sending}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
            />
            <Button 
              onClick={sendMessage}
              disabled={!newMessage.trim() || sending}
              className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg"
            >
              {sending ? (
                <Icon name="Loader2" className="animate-spin" size={18} />
              ) : (
                <Icon name="Send" size={18} />
              )}
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default MessagesModal;