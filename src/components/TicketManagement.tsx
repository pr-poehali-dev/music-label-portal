import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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

  const sortByDate = (a: Ticket, b: Ticket) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime();

  const openTickets = tickets.filter(t => t.status === 'open').sort(sortByDate);
  const inProgressTickets = tickets.filter(t => t.status === 'in_progress').sort(sortByDate);
  const resolvedTickets = tickets.filter(t => t.status === 'resolved' || t.status === 'closed').sort(sortByDate);
  const allTickets = [...openTickets, ...inProgressTickets, ...resolvedTickets];

  return (
    <Tabs defaultValue="open" className="w-full">
      <TabsList className="mb-4">
        <TabsTrigger value="open">Открыто ({openTickets.length})</TabsTrigger>
        <TabsTrigger value="in_progress">В работе ({inProgressTickets.length})</TabsTrigger>
        <TabsTrigger value="resolved">Выполнено ({resolvedTickets.length})</TabsTrigger>
      </TabsList>

      <TabsContent value="open" className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {openTickets.length === 0 ? (
            <div className="col-span-full text-center py-8 text-muted-foreground/50">
              <Icon name="Inbox" size={32} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">Нет открытых тикетов</p>
            </div>
          ) : (
            openTickets.map(ticket => (
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
            ))
          )}
        </div>
      </TabsContent>

      <TabsContent value="in_progress" className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {inProgressTickets.length === 0 ? (
            <div className="col-span-full text-center py-8 text-muted-foreground/50">
              <Icon name="Inbox" size={32} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">Нет тикетов в работе</p>
            </div>
          ) : (
            inProgressTickets.map(ticket => (
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
            ))
          )}
        </div>
      </TabsContent>

      <TabsContent value="resolved" className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {resolvedTickets.length === 0 ? (
            <div className="col-span-full text-center py-8 text-muted-foreground/50">
              <Icon name="Inbox" size={32} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">Нет выполненных тикетов</p>
            </div>
          ) : (
            resolvedTickets.map(ticket => (
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
            ))
          )}
        </div>
      </TabsContent>
    </Tabs>
  );
}