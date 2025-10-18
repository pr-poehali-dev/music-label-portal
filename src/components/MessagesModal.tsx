import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

interface Message {
  id: number;
  sender_id: number;
  sender_name: string;
  sender_role: string;
  message: string;
  created_at: string;
  is_read: boolean;
}

interface MessagesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: number;
  userRole: 'boss' | 'manager' | 'artist';
}

const MESSAGES_API = 'https://functions.poehali.dev/7bcbbe5a-cae2-4cbe-94c1-ca6a0152ce3a';

export function MessagesModal({ open, onOpenChange, userId, userRole }: MessagesModalProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      loadMessages();
    }
  }, [open]);

  const loadMessages = async () => {
    setLoading(true);
    try {
      const url = userRole === 'boss' 
        ? MESSAGES_API 
        : `${MESSAGES_API}?user_id=${userId}`;
      
      const response = await fetch(url);
      if (!response.ok) throw new Error('Ошибка загрузки сообщений');
      
      const data = await response.json();
      setMessages(data);
      
      if (userRole === 'boss') {
        markAsRead(data.filter((m: Message) => !m.is_read).map((m: Message) => m.id));
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
    if (messageIds.length === 0) return;
    
    for (const messageId of messageIds) {
      try {
        await fetch(MESSAGES_API, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message_id: messageId, is_read: true }),
        });
      } catch (error) {
        console.error('Ошибка отметки сообщения как прочитанного:', error);
      }
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    
    setSending(true);
    try {
      const response = await fetch(MESSAGES_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender_id: userId,
          message: newMessage.trim(),
        }),
      });

      if (!response.ok) throw new Error('Ошибка отправки');

      toast({
        title: 'Успешно',
        description: 'Сообщение отправлено руководителю',
      });

      setNewMessage('');
      loadMessages();
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
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const isToday = date.toDateString() === today.toDateString();
    const isYesterday = date.toDateString() === yesterday.toDateString();

    const time = date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });

    if (isToday) return `Сегодня в ${time}`;
    if (isYesterday) return `Вчера в ${time}`;
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' }) + ` в ${time}`;
  };

  const unreadCount = messages.filter(m => !m.is_read).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon name="MessageSquare" size={24} />
            {userRole === 'boss' ? 'Сообщения от команды' : 'Сообщения руководителю'}
            {userRole === 'boss' && unreadCount > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                {unreadCount}
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          {userRole !== 'boss' && (
            <div className="flex flex-col gap-2">
              <Textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Введите ваше сообщение руководителю..."
                className="min-h-[100px]"
                disabled={sending}
              />
              <Button 
                onClick={sendMessage} 
                disabled={!newMessage.trim() || sending}
                className="self-end"
              >
                <Icon name="Send" size={16} className="mr-2" />
                {sending ? 'Отправка...' : 'Отправить'}
              </Button>
            </div>
          )}

          <div className="border-t pt-4">
            <h3 className="text-sm font-semibold mb-3">
              {userRole === 'boss' ? 'Все сообщения' : 'История сообщений'}
            </h3>
            
            <ScrollArea className="h-[400px] pr-4">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Icon name="Loader2" className="animate-spin" size={24} />
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Icon name="Inbox" size={48} className="mx-auto mb-2 opacity-50" />
                  <p>Сообщений пока нет</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`p-4 rounded-lg border ${
                        !msg.is_read && userRole === 'boss'
                          ? 'bg-blue-50 border-blue-200'
                          : 'bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            msg.sender_role === 'manager' 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-purple-100 text-purple-700'
                          }`}>
                            <Icon 
                              name={msg.sender_role === 'manager' ? 'UserCheck' : 'Music'} 
                              size={16} 
                            />
                          </div>
                          <div>
                            <p className="font-semibold text-sm">{msg.sender_name}</p>
                            <p className="text-xs text-muted-foreground">
                              {msg.sender_role === 'manager' ? 'Менеджер' : 'Артист'}
                            </p>
                          </div>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(msg.created_at)}
                        </span>
                      </div>
                      <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                      {!msg.is_read && userRole === 'boss' && (
                        <div className="mt-2 flex items-center gap-1 text-xs text-blue-600">
                          <Icon name="Mail" size={12} />
                          <span>Новое</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default MessagesModal;
