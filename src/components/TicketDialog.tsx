import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { API_URLS } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { createNotification } from '@/hooks/useNotifications';

interface Ticket {
  id: number;
  title: string;
  description: string;
  status: 'open' | 'in_progress' | 'closed';
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
  onUpdateStatus?: (ticketId: number, status: string) => void;
  onReload?: () => void;
}

export default function TicketDialog({ ticket, open, onClose, currentUserId, currentUserRole, onUpdateStatus, onReload }: TicketDialogProps) {
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
        if (onReload) onReload();
        
        // Notify assigned manager about new comment
        if (ticket.assigned_to && currentUserRole === 'artist') {
          try {
            await createNotification({
              title: `💬 Новый комментарий к тикету #${ticket.id}`,
              message: `${ticket.creator_name}: "${newComment.trim().slice(0, 100)}${newComment.length > 100 ? '...' : ''}"`,
              type: 'ticket_comment',
              related_entity_type: 'ticket',
              related_entity_id: ticket.id,
              user_ids: [ticket.assigned_to],
              notify_directors: false
            });
          } catch (notifError) {
            // Silently fail notification
          }
        }
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
      case 'closed': return 'Решён';
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-blue-500';
      case 'in_progress': return 'bg-purple-500';
      case 'closed': return 'bg-green-500';
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
      <DialogContent className="max-w-3xl h-[90vh] md:h-[85vh] max-h-screen flex flex-col p-0 gap-0">
        <DialogHeader className="p-3 md:p-6 border-b shrink-0">
          <DialogTitle className="text-base md:text-xl">Тикет #{ticket.id}</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-3 md:p-6 space-y-3 md:space-y-4">
          <div className="bg-muted/50 rounded-lg p-3 md:p-4 border-l-4 border-primary">
            <div className="flex items-start justify-between gap-2 md:gap-3 mb-2 md:mb-3">
              <h3 className="font-bold text-sm md:text-lg leading-tight">{ticket.title}</h3>
              <div className="flex gap-1 md:gap-2 shrink-0">
                <Badge className={`${getPriorityColor(ticket.priority)} text-white text-[10px] md:text-xs px-1.5 md:px-2`}>
                  {ticket.priority === 'urgent' ? '🔥' : 
                   ticket.priority === 'high' ? '⚠️' :
                   ticket.priority === 'medium' ? '📌' : '📋'} {getPriorityLabel(ticket.priority)}
                </Badge>
                <Badge className={`${getStatusColor(ticket.status)} text-white text-[10px] md:text-xs px-1.5 md:px-2`}>
                  {getStatusLabel(ticket.status)}
                </Badge>
              </div>
            </div>
            
            <p className="text-xs md:text-sm text-foreground/80 mb-2 md:mb-3 whitespace-pre-wrap leading-snug">{ticket.description}</p>
            
            <div className="flex flex-wrap gap-2 md:gap-3 text-[10px] md:text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Icon name="User" size={12} className="md:size-3.5" />
                <span className="font-medium">Создатель:</span>
                <span className="truncate">{ticket.creator_name}</span>
              </div>
              {ticket.assigned_name && (
                <div className="flex items-center gap-1 text-primary">
                  <Icon name="UserCheck" size={12} className="md:size-3.5" />
                  <span className="font-medium">Назначен:</span>
                  <span className="truncate">{ticket.assigned_name}</span>
                </div>
              )}
              <div className="flex items-center gap-1">
                <Icon name="Calendar" size={12} className="md:size-3.5" />
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
              <div className="mt-2 md:mt-3 pt-2 md:pt-3 border-t border-border">
                <p className="text-[10px] md:text-xs font-semibold mb-1.5 md:mb-2 flex items-center gap-1">
                  <Icon name="Paperclip" size={12} className="md:size-3.5" />
                  Прикреплённый файл:
                </p>
                <a 
                  href={ticket.attachment_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 md:gap-2 text-xs md:text-sm text-primary hover:underline bg-background px-2 md:px-3 py-1.5 md:py-2 rounded border truncate max-w-full"
                >
                  <Icon name="Download" size={14} className="md:size-4 shrink-0" />
                  <span className="truncate">{ticket.attachment_name}</span>
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
                  <div className={`max-w-[85%] md:max-w-[75%] rounded-lg p-2.5 md:p-3 ${
                    isOwnMessage 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-muted'
                  }`}>
                    <div className="flex items-center gap-1.5 md:gap-2 mb-1">
                      <span className="text-[11px] md:text-xs font-semibold">{comment.user_name}</span>
                      <Badge variant="outline" className="text-[9px] md:text-[10px] px-1 py-0">
                        {comment.user_role === 'artist' ? '🎵' : comment.user_role === 'manager' ? '👤' : '👔'}
                      </Badge>
                    </div>
                    <p className="text-xs md:text-sm whitespace-pre-wrap leading-snug">{comment.comment}</p>
                    {comment.attachment_url && (
                      <a 
                        href={comment.attachment_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] md:text-xs mt-1.5 md:mt-2 opacity-90 hover:opacity-100 hover:underline truncate max-w-full"
                      >
                        <Icon name="Paperclip" size={10} className="md:size-3 shrink-0" />
                        <span className="truncate">{comment.attachment_name}</span>
                      </a>
                    )}
                    <p className="text-[9px] md:text-[10px] opacity-70 mt-0.5 md:mt-1">{formatDate(comment.created_at)}</p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="border-t p-2 md:p-4 shrink-0">
          {currentUserRole === 'director' && (
            <div className="mb-2 md:mb-3 flex gap-2">
              {ticket.status === 'closed' && (
                <Button 
                  onClick={async () => {
                    if (onUpdateStatus) {
                      await onUpdateStatus(ticket.id, 'in_progress');
                      if (onReload) onReload();
                    }
                  }}
                  variant="outline"
                  className="flex-1"
                  size="sm"
                >
                  <Icon name="RotateCcw" size={16} className="mr-2" />
                  Вернуть в работу
                </Button>
              )}
              {ticket.status === 'in_progress' && (
                <Button 
                  onClick={async () => {
                    if (onUpdateStatus) {
                      await onUpdateStatus(ticket.id, 'closed');
                      if (onReload) onReload();
                      onClose();
                    }
                  }}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  size="sm"
                >
                  <Icon name="Check" size={16} className="mr-2" />
                  Решить тикет
                </Button>
              )}
            </div>
          )}
          {currentUserRole === 'manager' && ticket.status === 'in_progress' && (
            <div className="mb-2 md:mb-3">
              <Button 
                onClick={async () => {
                  if (onUpdateStatus) {
                    await onUpdateStatus(ticket.id, 'closed');
                    if (onReload) onReload();
                    onClose();
                  }
                }}
                className="w-full bg-green-600 hover:bg-green-700"
                size="sm"
              >
                <Icon name="Check" size={16} className="mr-2" />
                Решить тикет
              </Button>
            </div>
          )}
          {selectedFile && (
            <div className="mb-1.5 md:mb-2 flex items-center gap-1.5 md:gap-2 bg-muted p-1.5 md:p-2 rounded text-xs md:text-sm">
              <Icon name="Paperclip" size={12} className="text-primary md:size-3.5 shrink-0" />
              <span className="flex-1 truncate text-[11px] md:text-sm">{selectedFile.name}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedFile(null);
                  if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                  }
                }}
                className="h-5 w-5 md:h-6 md:w-6 p-0"
              >
                <Icon name="X" size={12} className="md:size-3.5" />
              </Button>
            </div>
          )}
          {ticket.status === 'closed' && currentUserRole !== 'director' ? (
            <div className="bg-muted/50 rounded-lg p-3 md:p-4 text-center">
              <Icon name="Lock" size={24} className="mx-auto mb-2 text-muted-foreground/50" />
              <p className="text-xs md:text-sm text-muted-foreground">
                Тикет закрыт. Только руководитель может вернуть его в работу.
              </p>
            </div>
          ) : (
            <>
              <div className="flex gap-1.5 md:gap-2">
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
                  className="h-[60px] w-[40px] md:h-[80px] md:w-[50px] shrink-0"
                >
                  <Icon name="Paperclip" size={18} className="md:size-5" />
                </Button>
                <Textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Сообщение..."
                  className="min-h-[60px] md:min-h-[80px] resize-none text-sm"
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
                  className="shrink-0 h-[60px] w-[40px] md:h-[80px] md:w-[50px]"
                  size="icon"
                >
                  <Icon name={sending || uploading ? "Loader2" : "Send"} size={18} className={`md:size-5 ${sending || uploading ? 'animate-spin' : ''}`} />
                </Button>
              </div>
              <p className="text-[10px] md:text-xs text-muted-foreground mt-1 md:mt-2">
                {uploading ? 'Загрузка файла...' : 'Enter — отправить, Shift+Enter — новая строка'}
              </p>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}