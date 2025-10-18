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
  onDeleteTicket?: (ticketId: number) => void;
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
  onLoadTickets,
  onDeleteTicket
}: TicketManagementProps) {
  const { toast } = useToast();

  useEffect(() => {
    onLoadTickets();
  }, []);

  const getTicketStats = () => {
    return {
      total: tickets.length,
      open: tickets.filter(t => t.status === 'open').length,
      inProgress: tickets.filter(t => t.status === 'in_progress').length,
      resolved: tickets.filter(t => t.status === 'resolved').length
    };
  };

  const stats = getTicketStats();

  const openTickets = tickets.filter(t => t.status === 'open');
  const inProgressTickets = tickets.filter(t => t.status === 'in_progress');
  const resolvedTickets = tickets.filter(t => t.status === 'resolved' || t.status === 'closed');

  return (
    <div className="space-y-5">
        <div className="space-y-3">
          <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-3 border border-blue-200 dark:border-blue-700">
            <h3 className="font-semibold text-blue-900 dark:text-blue-100 flex items-center gap-2">
              <Icon name="Circle" size={16} />
              Открыто
            </h3>
          </div>
          {openTickets.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground/50">
              <Icon name="Inbox" size={32} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">Нет открытых тикетов</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {openTickets.map(ticket => (
                <TicketCard
                  key={ticket.id}
                  ticket={ticket}
                  user={user}
                  managers={managers}
                  onUpdateStatus={onUpdateStatus}
                  onAssign={onAssignTicket}
                  onDelete={onDeleteTicket}
                  getPriorityColor={getPriorityColor}
                  getStatusColor={getStatusColor}
                />
              ))}
            </div>
          )}
        </div>

        <div className="space-y-3">
          <div className="bg-yellow-50 dark:bg-yellow-900/30 rounded-lg p-3 border border-yellow-200 dark:border-yellow-700">
            <h3 className="font-semibold text-yellow-900 dark:text-yellow-100 flex items-center gap-2">
              <Icon name="Clock" size={16} />
              В работе
            </h3>
          </div>
          {inProgressTickets.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground/50">
              <Icon name="Inbox" size={32} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">Нет тикетов в работе</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {inProgressTickets.map(ticket => (
                <TicketCard
                  key={ticket.id}
                  ticket={ticket}
                  user={user}
                  managers={managers}
                  onUpdateStatus={onUpdateStatus}
                  onAssign={onAssignTicket}
                  onDelete={onDeleteTicket}
                  getPriorityColor={getPriorityColor}
                  getStatusColor={getStatusColor}
                />
              ))}
            </div>
          )}
        </div>

        <div className="space-y-3">
          <div className="bg-green-50 dark:bg-green-900/30 rounded-lg p-3 border border-green-200 dark:border-green-700">
            <h3 className="font-semibold text-green-900 dark:text-green-100 flex items-center gap-2">
              <Icon name="CheckCircle" size={16} />
              Решено
            </h3>
          </div>
          {resolvedTickets.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground/50">
              <Icon name="Inbox" size={32} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">Нет решённых тикетов</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {resolvedTickets.map(ticket => (
                <TicketCard
                  key={ticket.id}
                  ticket={ticket}
                  user={user}
                  managers={managers}
                  onUpdateStatus={onUpdateStatus}
                  onAssign={onAssignTicket}
                  onDelete={onDeleteTicket}
                  getPriorityColor={getPriorityColor}
                  getStatusColor={getStatusColor}
                />
              ))}
            </div>
          )}
        </div>
    </div>
  );
}