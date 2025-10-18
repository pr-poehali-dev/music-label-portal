import React, { useState, useEffect, useMemo, useCallback } from 'react';
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

const TicketManagement = React.memo(function TicketManagement({ 
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
  const [activeTab, setActiveTab] = useState<'open' | 'in_progress' | 'resolved'>('open');

  useEffect(() => {
    onLoadTickets();
  }, []);

  const sortByDate = useCallback((a: Ticket, b: Ticket) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    []
  );

  const { openTickets, inProgressTickets, resolvedTickets } = useMemo(() => ({
    openTickets: tickets.filter(t => t.status === 'open').sort(sortByDate),
    inProgressTickets: tickets.filter(t => t.status === 'in_progress').sort(sortByDate),
    resolvedTickets: tickets.filter(t => t.status === 'resolved' || t.status === 'closed').sort(sortByDate)
  }), [tickets, sortByDate]);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-3">
        <Icon name="Ticket" size={32} className="text-primary" />
        <h1 className="text-3xl font-bold">Заявки</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        <button
          onClick={() => setActiveTab('open')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'open'
              ? 'border-b-2 border-primary text-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Открыто ({openTickets.length})
        </button>
        <button
          onClick={() => setActiveTab('in_progress')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'in_progress'
              ? 'border-b-2 border-primary text-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          В работе ({inProgressTickets.length})
        </button>
        <button
          onClick={() => setActiveTab('resolved')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'resolved'
              ? 'border-b-2 border-primary text-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Выполнено ({resolvedTickets.length})
        </button>
      </div>

      {/* Open Tab */}
      {activeTab === 'open' && (
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
      )}

      {/* In Progress Tab */}
      {activeTab === 'in_progress' && (
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
      )}

      {/* Resolved Tab */}
      {activeTab === 'resolved' && (
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
      )}
    </div>
  );
});

export default TicketManagement;