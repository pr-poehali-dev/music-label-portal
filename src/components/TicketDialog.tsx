import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { API_URLS } from '@/types';
import { useToast } from '@/hooks/use-toast';

interface Ticket {
  id: number;
  title: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  created_by: number;
  creator_name: string;
  created_at: string;
  assigned_to?: number | null;
  assigned_name?: string | null;
  attachment_url?: string;
  attachment_name?: string;
}

interface Comment {
  id: number;
  ticket_id: number;
  user_id: number;
  user_name: string;
  user_role: string;
  comment: string;
  created_at: string;
}

interface TicketDialogProps {
  ticket: Ticket | null;
  open: boolean;
  onClose: () => void;
  currentUserId: number;
  currentUserRole: string;
}

export default function TicketDialog({ ticket, open, onClose, currentUserId, currentUserRole }: TicketDialogProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (ticket && open) {
      loadComments();
    }
  }, [ticket, open]);

  useEffect(() => {
    scrollToBottom();
  }, [comments]);

  const loadComments = async () => {
    if (!ticket) return;
    
    setLoading(true);
    try {
      const response = await fetch(`${API_URLS.ticketComments}?ticket_id=${ticket.id}`);
      const data = await response.json();
      setComments(data.comments || []);
    } catch (error) {
      console.error('Failed to load comments:', error);
      toast({ title: '❌ Ошибка загрузки комментариев', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const sendComment = async () => {
    if (!ticket || !newComment.trim()) return;
    
    setSending(true);
    try {
      const response = await fetch(API_URLS.ticketComments, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticket_id: ticket.id,
          user_id: currentUserId,
          comment: newComment.trim()
        })
      });

      if (response.ok) {
        setNewComment('');
        await loadComments();
      } else {
        toast({ title: '❌ Ошибка отправки', variant: 'destructive' });
      }
    } catch (error) {
      console.error('Failed to send comment:', error);
      toast({ title: '❌ Ошибка отправки', variant: 'destructive' });
    } finally {
      setSending(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-blue-500';
      case 'in_progress': return 'bg-purple-500';
      case 'resolved': return 'bg-green-500';
      case 'closed': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'только что';
    if (minutes < 60) return `${minutes}м назад`;
    if (hours < 24) return `${hours}ч назад`;
    if (days < 7) return `${days}д назад`;
    
    return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit' });
  };

  if (!ticket) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl h-[80vh] flex flex-col p-0">
        <DialogHeader className="p-4 md:p-6 border-b">
          <div className="flex items-start gap-3">
            <Badge className={`${getPriorityColor(ticket.priority)} text-white shrink-0`}>
              {ticket.priority === 'urgent' ? '🔥' : 
               ticket.priority === 'high' ? '⚠️' :
               ticket.priority === 'medium' ? '📌' : '📋'}
            </Badge>
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-lg md:text-xl">{ticket.title}</DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">{ticket.description}</p>
            </div>
            <Badge className={`${getStatusColor(ticket.status)} text-white shrink-0`}>
              {ticket.status}
            </Badge>
          </div>
          
          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground mt-3">
            <div className="flex items-center gap-1">
              <Icon name="User" size={12} />
              <span>{ticket.creator_name}</span>
            </div>
            {ticket.assigned_name && (
              <div className="flex items-center gap-1 text-primary">
                <Icon name="UserCheck" size={12} />
                <span>{ticket.assigned_name}</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <Icon name="Calendar" size={12} />
              <span>{new Date(ticket.created_at).toLocaleDateString('ru-RU')}</span>
            </div>
          </div>

          {ticket.attachment_url && (
            <div className="mt-2">
              <a 
                href={ticket.attachment_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-xs text-primary hover:underline"
              >
                <Icon name="Paperclip" size={12} />
                {ticket.attachment_name}
              </a>
            </div>
          )}
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-3">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Icon name="Loader2" size={24} className="animate-spin text-primary" />
            </div>
          ) : comments.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
              <Icon name="MessageSquare" size={48} className="mb-2 opacity-20" />
              <p className="text-sm">Пока нет сообщений</p>
              <p className="text-xs mt-1">Начните диалог ниже</p>
            </div>
          ) : (
            comments.map((comment) => {
              const isOwnMessage = comment.user_id === currentUserId;
              return (
                <div key={comment.id} className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] rounded-lg p-3 ${
                    isOwnMessage 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-muted'
                  }`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold">{comment.user_name}</span>
                      <Badge variant="outline" className="text-[10px] px-1 py-0">
                        {comment.user_role === 'artist' ? '🎵' : comment.user_role === 'manager' ? '👤' : '👔'}
                      </Badge>
                    </div>
                    <p className="text-sm whitespace-pre-wrap">{comment.comment}</p>
                    <p className="text-[10px] opacity-70 mt-1">{formatDate(comment.created_at)}</p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="border-t p-4 md:p-6">
          <div className="flex gap-2">
            <Textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Напишите сообщение..."
              className="min-h-[80px] resize-none"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendComment();
                }
              }}
            />
            <Button 
              onClick={sendComment} 
              disabled={!newComment.trim() || sending}
              className="shrink-0"
            >
              <Icon name={sending ? "Loader2" : "Send"} size={16} className={sending ? 'animate-spin' : ''} />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Нажмите Enter для отправки, Shift+Enter для новой строки
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
