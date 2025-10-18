import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';

interface User {
  id: number;
  username: string;
  role: 'artist' | 'manager' | 'director';
  full_name: string;
}

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
  deadline?: string | null;
  attachment_url?: string;
  attachment_name?: string;
  attachment_size?: number;
  completed_at?: string | null;
}

interface TicketCardProps {
  ticket: Ticket;
  user?: User;
  userRole?: 'artist' | 'manager' | 'director';
  managers: User[];
  onUpdateStatus: (ticketId: number, status: string) => void;
  onAssign?: (ticketId: number, managerId: number | null, deadline?: string) => void;
  onDelete?: (ticketId: number) => void;
  getPriorityColor: (priority: string) => string;
  getStatusColor: (status: string) => string;
}

export default function TicketCard({ 
  ticket, 
  user, 
  userRole,
  managers, 
  onUpdateStatus, 
  onAssign,
  onDelete,
  getPriorityColor,
  getStatusColor
}: TicketCardProps) {
  const effectiveRole = userRole || user?.role;
  const isOverdue = ticket.deadline && new Date(ticket.deadline) < new Date() && ticket.status !== 'closed';
  
  const getTimeSpent = () => {
    if (!ticket.completed_at || !ticket.created_at) return null;
    
    const start = new Date(ticket.created_at);
    const end = new Date(ticket.completed_at);
    const diffMs = end.getTime() - start.getTime();
    
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) return `${days}д ${hours}ч ${minutes}м`;
    if (hours > 0) return `${hours}ч ${minutes}м`;
    return `${minutes}м`;
  };

  return (
    <Card className={`border-primary/20 bg-card/95 hover:border-primary/40 transition-all ${isOverdue ? 'border-red-500/50' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <CardTitle className="text-primary text-base truncate">{ticket.title}</CardTitle>
              <div className="flex items-center gap-1 shrink-0">
                {effectiveRole === 'director' && onDelete && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDelete(ticket.id)}
                    className="h-6 w-6 text-red-500 hover:text-red-700 hover:bg-red-500/10"
                  >
                    <Icon name="Trash2" size={14} />
                  </Button>
                )}
                <div className="flex gap-1">
                <Badge variant="outline" className={`${getPriorityColor(ticket.priority)} text-white text-xs px-1.5 py-0`}>
                  {ticket.priority === 'urgent' ? '🔥' : 
                   ticket.priority === 'high' ? '⚠️' :
                   ticket.priority === 'medium' ? '📌' : '📋'}
                </Badge>
                <Badge variant="outline" className={`${getStatusColor(ticket.status)} text-white text-xs px-1.5 py-0`}>
                  {ticket.status === 'open' ? 'Открыт' :
                   ticket.status === 'in_progress' ? 'В работе' :
                   ticket.status === 'resolved' ? 'Решён' : 'Закрыт'}
                </Badge>
                </div>
              </div>
            </div>
            <CardDescription className="text-foreground/70 text-sm line-clamp-2">{ticket.description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 pt-0">
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Icon name="User" size={12} />
            <span>{ticket.creator_name}</span>
          </div>
          <div className="flex items-center gap-1">
            <Icon name="Clock" size={12} />
            <span>{new Date(ticket.created_at).toLocaleDateString('ru-RU')}</span>
          </div>
          {ticket.assigned_name && (
            <div className="flex items-center gap-1">
              <Icon name="UserCheck" size={12} />
              <span>{ticket.assigned_name}</span>
            </div>
          )}
          {ticket.tasks_total !== undefined && ticket.tasks_total > 0 && (
            <div className="flex items-center gap-1 text-primary font-medium">
              <Icon name="CheckSquare" size={12} />
              <span>Задачи: {ticket.tasks_completed}/{ticket.tasks_total}</span>
            </div>
          )}
          {ticket.deadline && (
            <div className={`flex items-center gap-1 ${isOverdue ? 'text-red-500 font-medium' : ''}`}>
              <Icon name="Calendar" size={12} />
              <span>{new Date(ticket.deadline).toLocaleDateString('ru-RU')}{isOverdue && ' ⚠️'}</span>
            </div>
          )}
          {ticket.attachment_url && (
            <div className="flex items-center gap-1">
              <Icon name="Paperclip" size={12} />
              <a 
                href={ticket.attachment_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                {ticket.attachment_name}
              </a>
            </div>
          )}
          {ticket.status === 'closed' && getTimeSpent() && (
            <div className="flex items-center gap-1 text-green-600 font-medium">
              <Icon name="Timer" size={12} />
              <span>Выполнено за: {getTimeSpent()}</span>
            </div>
          )}
        </div>

        {effectiveRole === 'director' && ticket.status === 'open' && onAssign && (
          <div className="flex gap-2">
            <Select
              onValueChange={(val) => {
                const managerId = val === 'unassign' ? null : Number(val);
                onAssign(ticket.id, managerId);
              }}
            >
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Назначить менеджера" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unassign">Снять назначение</SelectItem>
                {managers.map((manager) => (
                  <SelectItem key={manager.id} value={String(manager.id)}>
                    {manager.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              type="datetime-local"
              onChange={(e) => {
                if (e.target.value && ticket.assigned_to) {
                  onAssign(ticket.id, ticket.assigned_to, e.target.value);
                }
              }}
              className="flex-1"
            />
          </div>
        )}

        {(effectiveRole === 'manager' || effectiveRole === 'director') && ticket.status !== 'closed' && (
          <div className="flex gap-2">
            {ticket.status === 'open' && (
              <Button 
                onClick={() => onUpdateStatus(ticket.id, 'in_progress')} 
                variant="outline" 
                size="sm"
                className="flex-1"
              >
                <Icon name="Play" size={14} className="mr-1" />
                Взять в работу
              </Button>
            )}
            {ticket.status === 'in_progress' && (
              <Button 
                onClick={() => onUpdateStatus(ticket.id, 'resolved')} 
                variant="outline" 
                size="sm"
                className="flex-1"
              >
                <Icon name="Check" size={14} className="mr-1" />
                Решить
              </Button>
            )}
            {ticket.status === 'resolved' && (
              <Button 
                onClick={() => onUpdateStatus(ticket.id, 'closed')} 
                variant="outline" 
                size="sm"
                className="flex-1"
              >
                <Icon name="X" size={14} className="mr-1" />
                Закрыть
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}