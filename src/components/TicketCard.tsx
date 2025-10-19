import React from 'react';
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
  onOpenDialog?: (ticket: Ticket) => void;
  getPriorityColor: (priority: string) => string;
  getStatusColor: (status: string) => string;
}

const TicketCard = React.memo(function TicketCard({ 
  ticket, 
  user, 
  userRole,
  managers, 
  onUpdateStatus, 
  onAssign,
  onDelete,
  onOpenDialog,
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
    <Card 
      className={`border-primary/20 bg-card/95 hover:shadow-lg transition-all cursor-pointer ${isOverdue ? 'border-red-500/50' : ''}`}
      onClick={() => onOpenDialog?.(ticket)}
    >
      <CardHeader className="pb-2 space-y-2 p-3 md:p-6">
        <div className="flex items-start justify-between gap-2">
          <Badge variant="outline" className={`${getPriorityColor(ticket.priority)} text-white text-[10px] md:text-xs px-1.5 md:px-2 py-0.5 shrink-0`}>
            {ticket.priority === 'urgent' ? '🔥' : 
             ticket.priority === 'high' ? '⚠️' :
             ticket.priority === 'medium' ? '📌' : '📋'}
          </Badge>
          {effectiveRole === 'director' && onDelete && (
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(ticket.id);
              }}
              className="h-6 w-6 md:h-8 md:w-8 text-red-500 hover:text-red-700 hover:bg-red-500/10 shrink-0"
            >
              <Icon name="Trash2" size={12} className="md:size-4" />
            </Button>
          )}
        </div>
        <CardTitle className="text-primary text-xs md:text-sm font-semibold line-clamp-2 leading-tight">{ticket.title}</CardTitle>
        <CardDescription className="text-foreground/60 text-[10px] md:text-xs line-clamp-2 leading-snug">{ticket.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2 pt-0 pb-3 px-3 md:px-6">
        <div className="space-y-1.5 text-[10px] md:text-xs text-muted-foreground">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 truncate">
              <Icon name="User" size={11} />
              <span className="truncate">{ticket.creator_name}</span>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <Icon name="Clock" size={11} />
              <span>{new Date(ticket.created_at).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' })}</span>
            </div>
          </div>
          {ticket.assigned_name && (
            <div className="flex items-center gap-1 truncate text-primary/80">
              <Icon name="UserCheck" size={11} />
              <span className="truncate">{ticket.assigned_name}</span>
            </div>
          )}
          {ticket.tasks_total !== undefined && ticket.tasks_total > 0 && (
            <div className="flex items-center gap-1 text-primary font-medium">
              <Icon name="CheckSquare" size={11} />
              <span>{ticket.tasks_completed}/{ticket.tasks_total}</span>
            </div>
          )}
          {ticket.deadline && (
            <div className={`flex items-center gap-1 ${isOverdue ? 'text-red-500 font-medium' : ''}`}>
              <Icon name="Calendar" size={11} />
              <span>{new Date(ticket.deadline).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' })}{isOverdue && ' ⚠️'}</span>
            </div>
          )}
          {ticket.attachment_url && (
            <div className="flex items-center gap-1 truncate">
              <Icon name="Paperclip" size={11} />
              <a 
                href={ticket.attachment_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline truncate"
              >
                {ticket.attachment_name}
              </a>
            </div>
          )}
          {ticket.status === 'closed' && getTimeSpent() && (
            <div className="flex items-center gap-1 text-green-600 font-medium">
              <Icon name="Timer" size={11} />
              <span>{getTimeSpent()}</span>
            </div>
          )}
        </div>

        {effectiveRole === 'director' && ticket.status === 'open' && onAssign && (
          <div className="space-y-1.5" onClick={(e) => e.stopPropagation()}>
            <Select
              onValueChange={(val) => {
                const managerId = val === 'unassign' ? null : Number(val);
                onAssign(ticket.id, managerId);
              }}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Назначить" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unassign">Снять</SelectItem>
                {managers.map((manager) => (
                  <SelectItem key={manager.id} value={String(manager.id)}>
                    {manager.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              type="date"
              onChange={(e) => {
                if (e.target.value && ticket.assigned_to) {
                  onAssign(ticket.id, ticket.assigned_to, e.target.value);
                }
              }}
              className="h-8 text-xs"
              placeholder="Дедлайн"
            />
          </div>
        )}

        {(effectiveRole === 'manager' || effectiveRole === 'director') && ticket.status !== 'closed' && (
          <div className="flex gap-1.5" onClick={(e) => e.stopPropagation()}>
            {ticket.status === 'open' && (
              <Button 
                onClick={() => onUpdateStatus(ticket.id, 'in_progress')} 
                variant="outline" 
                size="sm"
                className="flex-1 h-8 text-xs"
              >
                <Icon name="Play" size={12} className="mr-1" />
                В работу
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
});

export default TicketCard;