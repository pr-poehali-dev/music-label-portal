import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Icon from '@/components/ui/icon';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import TicketCard from '@/components/TicketCard';
import TicketDialog from '@/components/TicketDialog';
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
  const [activeTab, setActiveTab] = useState<'open' | 'in_progress' | 'closed'>('open');
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleOpenDialog = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedTicket(null);
  };

  useEffect(() => {
    onLoadTickets();
  }, []);

  const sortByDate = useCallback((a: Ticket, b: Ticket) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    []
  );

  const { openTickets, inProgressTickets, closedTickets } = useMemo(() => ({
    openTickets: tickets.filter(t => t.status === 'open').sort(sortByDate),
    inProgressTickets: tickets.filter(t => t.status === 'in_progress').sort(sortByDate),
    closedTickets: tickets.filter(t => t.status === 'closed').sort(sortByDate)
  }), [tickets, sortByDate]);

  return (
    <>
      <TicketDialog
        ticket={selectedTicket}
        open={dialogOpen}
        onClose={handleCloseDialog}
        currentUserId={user.id}
        currentUserRole={user.role}
        onUpdateStatus={onUpdateStatus}
        onReload={onLoadTickets}
      />
    <div className="space-y-4 md:space-y-6 p-3 md:p-6">
      <div className="flex items-center gap-2 md:gap-3">
        <Icon name="Ticket" size={24} className="text-primary md:hidden" />
        <Icon name="Ticket" size={32} className="text-primary hidden md:block" />
        <h1 className="text-xl md:text-3xl font-bold">Заявки</h1>
      </div>

      <Tabs defaultValue="open" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-card/60 backdrop-blur-sm border border-border rounded-xl p-1">
          <TabsTrigger value="open" className="flex items-center gap-1 md:gap-2 text-xs md:text-sm">
            <Icon name="Inbox" className="w-3 h-3 md:w-4 md:h-4 text-blue-500" />
            <span>Открыто</span>
            <span className="ml-1 text-xs">({openTickets.length})</span>
          </TabsTrigger>
          <TabsTrigger value="in_progress" className="flex items-center gap-1 md:gap-2 text-xs md:text-sm">
            <Icon name="Loader" className="w-3 h-3 md:w-4 md:h-4 text-yellow-500 animate-spin-slow" />
            <span>В работе</span>
            <span className="ml-1 text-xs">({inProgressTickets.length})</span>
          </TabsTrigger>
          <TabsTrigger value="closed" className="flex items-center gap-1 md:gap-2 text-xs md:text-sm">
            <Icon name="CheckCircle" className="w-3 h-3 md:w-4 md:h-4 text-green-500" />
            <span>Решённые</span>
            <span className="ml-1 text-xs">({closedTickets.length})</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="open" className="mt-4">
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
                  onOpenDialog={handleOpenDialog}
                  getPriorityColor={getPriorityColor}
                  getStatusColor={getStatusColor}
                />
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="in_progress" className="mt-4">
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
                  onOpenDialog={handleOpenDialog}
                  getPriorityColor={getPriorityColor}
                  getStatusColor={getStatusColor}
                />
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="closed" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {closedTickets.length === 0 ? (
              <div className="col-span-full text-center py-8 text-muted-foreground/50">
                <Icon name="Inbox" size={32} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">Нет выполненных тикетов</p>
              </div>
            ) : (
              closedTickets.map(ticket => (
                <TicketCard
                  key={ticket.id}
                  ticket={ticket}
                  user={user}
                  managers={managers}
                  onUpdateStatus={onUpdateStatus}
                  onAssign={onAssignTicket}
                  onDelete={onDeleteTicket}
                  onOpenDialog={handleOpenDialog}
                  getPriorityColor={getPriorityColor}
                  getStatusColor={getStatusColor}
                />
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
    </>
  );
});

export default TicketManagement;