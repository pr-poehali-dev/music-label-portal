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
  attachment_url?: string;
  attachment_name?: string;
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
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
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

  const uploadFile = async (file: File): Promise<{ url: string; name: string } | null> => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(API_URLS.uploadFile, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        return { url: data.file_url, name: file.name };
      }
      return null;
    } catch (error) {
      console.error('Upload failed:', error);
      return null;
    }
  };

  const sendComment = async () => {
    if (!ticket || !newComment.trim()) return;
    
    setSending(true);
    setUploading(true);
    
    try {
      let attachmentUrl = null;
      let attachmentName = null;

      if (selectedFile) {
        const uploadResult = await uploadFile(selectedFile);
        if (uploadResult) {
          attachmentUrl = uploadResult.url;
          attachmentName = uploadResult.name;
        } else {
          toast({ title: '❌ Ошибка загрузки файла', variant: 'destructive' });
          return;
        }
      }

      const response = await fetch(API_URLS.ticketComments, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticket_id: ticket.id,
          user_id: currentUserId,
          comment: newComment.trim(),
          attachment_url: attachmentUrl,
          attachment_name: attachmentName
        })
      });

      if (response.ok) {
        setNewComment('');
        setSelectedFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        await loadComments();
      } else {
        toast({ title: '❌ Ошибка отправки', variant: 'destructive' });
      }
    } catch (error) {
      console.error('Failed to send comment:', error);
      toast({ title: '❌ Ошибка отправки', variant: 'destructive' });
    } finally {
      setSending(false);
      setUploading(false);
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

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'Критичный';
      case 'high': return 'Высокий';
      case 'medium': return 'Средний';
      case 'low': return 'Низкий';
      default: return priority;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'open': return 'Открыт';
      case 'in_progress': return 'В работе';
      case 'resolved': return 'Решён';
      case 'closed': return 'Закрыт';
      default: return status;
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
      <DialogContent className="max-w-3xl h-[85vh] flex flex-col p-0">
        <DialogHeader className="p-4 md:p-6 border-b shrink-0">
          <DialogTitle className="text-lg md:text-xl mb-2">Тикет #{ticket.id}</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
          <div className="bg-muted/50 rounded-lg p-4 border-l-4 border-primary">
            <div className="flex items-start justify-between gap-3 mb-3">
              <h3 className="font-bold text-base md:text-lg">{ticket.title}</h3>
              <div className="flex gap-2 shrink-0">
                <Badge className={`${getPriorityColor(ticket.priority)} text-white text-xs`}>
                  {ticket.priority === 'urgent' ? '🔥' : 
                   ticket.priority === 'high' ? '⚠️' :
                   ticket.priority === 'medium' ? '📌' : '📋'} {getPriorityLabel(ticket.priority)}
                </Badge>
                <Badge className={`${getStatusColor(ticket.status)} text-white text-xs`}>
                  {getStatusLabel(ticket.status)}
                </Badge>
              </div>
            </div>
            
            <p className="text-sm text-foreground/80 mb-3 whitespace-pre-wrap">{ticket.description}</p>
            
            <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Icon name="User" size={14} />
                <span className="font-medium">Создатель:</span>
                <span>{ticket.creator_name}</span>
              </div>
              {ticket.assigned_name && (
                <div className="flex items-center gap-1 text-primary">
                  <Icon name="UserCheck" size={14} />
                  <span className="font-medium">Назначен:</span>
                  <span>{ticket.assigned_name}</span>
                </div>
              )}
              <div className="flex items-center gap-1">
                <Icon name="Calendar" size={14} />
                <span>{new Date(ticket.created_at).toLocaleDateString('ru-RU', { 
                  day: '2-digit', 
                  month: 'long', 
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}</span>
              </div>
            </div>

            {ticket.attachment_url && (
              <div className="mt-3 pt-3 border-t border-border">
                <p className="text-xs font-semibold mb-2 flex items-center gap-1">
                  <Icon name="Paperclip" size={14} />
                  Прикреплённый файл:
                </p>
                <a 
                  href={ticket.attachment_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-primary hover:underline bg-background px-3 py-2 rounded border"
                >
                  <Icon name="Download" size={16} />
                  {ticket.attachment_name}
                </a>
              </div>
            )}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Icon name="Loader2" size={24} className="animate-spin text-primary" />
            </div>
          ) : comments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
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
                    {comment.attachment_url && (
                      <a 
                        href={comment.attachment_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs mt-2 opacity-90 hover:opacity-100 hover:underline"
                      >
                        <Icon name="Paperclip" size={12} />
                        {comment.attachment_name}
                      </a>
                    )}
                    <p className="text-[10px] opacity-70 mt-1">{formatDate(comment.created_at)}</p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="border-t p-4 md:p-6 shrink-0">
          {selectedFile && (
            <div className="mb-2 flex items-center gap-2 bg-muted p-2 rounded text-sm">
              <Icon name="Paperclip" size={14} className="text-primary" />
              <span className="flex-1 truncate">{selectedFile.name}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedFile(null);
                  if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                  }
                }}
                className="h-6 w-6 p-0"
              >
                <Icon name="X" size={14} />
              </Button>
            </div>
          )}
          <div className="flex gap-2">
            <input
              ref={fileInputRef}
              type="file"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setSelectedFile(file);
                }
              }}
              className="hidden"
              id="comment-file-upload"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
              disabled={sending || uploading}
              className="h-[80px] w-[50px] shrink-0"
            >
              <Icon name="Paperclip" size={20} />
            </Button>
            <Textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Напишите сообщение..."
              className="min-h-[80px] resize-none"
              disabled={sending || uploading}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendComment();
                }
              }}
            />
            <Button 
              onClick={sendComment} 
              disabled={!newComment.trim() || sending || uploading}
              className="shrink-0 h-[80px] w-[50px]"
              size="icon"
            >
              <Icon name={sending || uploading ? "Loader2" : "Send"} size={20} className={sending || uploading ? 'animate-spin' : ''} />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {uploading ? 'Загрузка файла...' : 'Нажмите Enter для отправки, Shift+Enter для новой строки'}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}