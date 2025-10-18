import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import TicketCard from '@/components/TicketCard';
import { useToast } from '@/hooks/use-toast';

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

interface TicketManagementProps {
  user: User;
  tickets: Ticket[];
  managers: User[];
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
  onUpdateStatus: (ticketId: number, status: string) => void;
  onAssignTicket: (ticketId: number, managerId: number | null, deadline?: string) => void;
  onLoadTickets: () => void;
}

const getPriorityColor = (priority: string) => {
  const colors = {
    low: 'bg-blue-500',
    medium: 'bg-yellow-500',
    high: 'bg-orange-500',
    urgent: 'bg-red-500'
  };
  return colors[priority as keyof typeof colors] || 'bg-gray-500';
};

const getStatusColor = (status: string) => {
  const colors = {
    open: 'bg-blue-500',
    in_progress: 'bg-yellow-500',
    resolved: 'bg-green-500',
    closed: 'bg-gray-500'
  };
  return colors[status as keyof typeof colors] || 'bg-gray-500';
};

export default function TicketManagement({ 
  user, 
  tickets, 
  managers, 
  statusFilter, 
  onStatusFilterChange, 
  onUpdateStatus, 
  onAssignTicket,
  onLoadTickets
}: TicketManagementProps) {
  const { toast } = useToast();

  useEffect(() => {
    onLoadTickets();
  }, [statusFilter]);

  const getTicketStats = () => {
    return {
      total: tickets.length,
      open: tickets.filter(t => t.status === 'open').length,
      inProgress: tickets.filter(t => t.status === 'in_progress').length,
      resolved: tickets.filter(t => t.status === 'resolved').length
    };
  };

  const stats = getTicketStats();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Всего тикетов</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Открыто</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-500">{stats.open}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">В работе</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-500">{stats.inProgress}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Решено</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{stats.resolved}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Управление тикетами</CardTitle>
          <CardDescription>Просмотр и управление всеми тикетами</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Select value={statusFilter} onValueChange={onStatusFilterChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все тикеты</SelectItem>
                <SelectItem value="open">Открытые</SelectItem>
                <SelectItem value="in_progress">В работе</SelectItem>
                <SelectItem value="resolved">Решённые</SelectItem>
                <SelectItem value="closed">Закрытые</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4">
            {tickets.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Icon name="Inbox" size={48} className="mx-auto mb-2 opacity-50" />
                <p>Тикетов не найдено</p>
              </div>
            ) : (
              tickets.map(ticket => (
                <TicketCard
                  key={ticket.id}
                  ticket={ticket}
                  managers={managers}
                  onUpdateStatus={onUpdateStatus}
                  onAssign={onAssignTicket}
                  getPriorityColor={getPriorityColor}
                  getStatusColor={getStatusColor}
                  userRole={user.role}
                />
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
