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
}

interface TicketCardProps {
  ticket: Ticket;
  user: User;
  managers: User[];
  onUpdateStatus: (ticketId: number, status: string) => void;
  onAssignTicket: (ticketId: number, managerId: number | null, deadline?: string) => void;
  getPriorityColor: (priority: string) => string;
  getStatusColor: (status: string) => string;
}

export default function TicketCard({ 
  ticket, 
  user, 
  managers, 
  onUpdateStatus, 
  onAssignTicket,
  getPriorityColor,
  getStatusColor
}: TicketCardProps) {
  const isOverdue = ticket.deadline && new Date(ticket.deadline) < new Date() && ticket.status !== 'closed';

  return (
    <Card className={`border-primary/20 bg-card/95 hover:border-primary/40 transition-all ${isOverdue ? 'border-red-500/50' : ''}`}>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <CardTitle className="text-primary mb-2">{ticket.title}</CardTitle>
            <CardDescription className="text-foreground/80">{ticket.description}</CardDescription>
          </div>
          <div className="flex flex-col gap-2">
            <Badge className={`${getPriorityColor(ticket.priority)} text-white`}>
              {ticket.priority === 'urgent' ? '🔥 Срочно' : 
               ticket.priority === 'high' ? '⚠️ Высокий' :
               ticket.priority === 'medium' ? '📌 Средний' : '📋 Низкий'}
            </Badge>
            <Badge className={`${getStatusColor(ticket.status)} text-white`}>
              {ticket.status === 'open' ? 'Открыт' :
               ticket.status === 'in_progress' ? 'В работе' :
               ticket.status === 'resolved' ? 'Решён' : 'Закрыт'}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <span className="text-muted-foreground">Автор:</span>
            <p className="font-medium text-foreground">{ticket.creator_name}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Создан:</span>
            <p className="font-medium text-foreground">{new Date(ticket.created_at).toLocaleString('ru-RU')}</p>
          </div>
          {ticket.assigned_name && (
            <div>
              <span className="text-muted-foreground">Исполнитель:</span>
              <p className="font-medium text-foreground">{ticket.assigned_name}</p>
            </div>
          )}
          {ticket.deadline && (
            <div>
              <span className="text-muted-foreground">Дедлайн:</span>
              <p className={`font-medium ${isOverdue ? 'text-red-500' : 'text-foreground'}`}>
                {new Date(ticket.deadline).toLocaleString('ru-RU')}
                {isOverdue && ' ⚠️'}
              </p>
            </div>
          )}
        </div>

        {user.role === 'director' && ticket.status === 'open' && (
          <div className="flex gap-2">
            <Select
              onValueChange={(val) => {
                const managerId = val === 'unassign' ? null : Number(val);
                onAssignTicket(ticket.id, managerId);
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
                  onAssignTicket(ticket.id, ticket.assigned_to, e.target.value);
                }
              }}
              className="flex-1"
            />
          </div>
        )}

        {(user.role === 'manager' || user.role === 'director') && ticket.status !== 'closed' && (
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
