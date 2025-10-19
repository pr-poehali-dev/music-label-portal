import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Icon from '@/components/ui/icon';
import TicketCard from '@/components/TicketCard';
import TicketDialog from '@/components/TicketDialog';

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
}

interface MyTicketsProps {
  user: User;
  tickets: Ticket[];
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
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

const MyTickets = React.memo(function MyTickets({ 
  user, 
  tickets, 
  statusFilter, 
  onStatusFilterChange,
  onLoadTickets
}: MyTicketsProps) {
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    onLoadTickets();
  }, [statusFilter]);

  const handleOpenDialog = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedTicket(null);
  };

  return (
    <>
      <TicketDialog
        ticket={selectedTicket}
        open={dialogOpen}
        onClose={handleCloseDialog}
        currentUserId={user.id}
        currentUserRole={user.role}
      />
    <Card>
      <CardHeader className="p-4 md:p-6">
        <CardTitle className="text-lg md:text-2xl">Мои тикеты</CardTitle>
        <CardDescription className="text-xs md:text-sm">Тикеты, которые вы создали</CardDescription>
      </CardHeader>
      <CardContent className="p-4 md:p-6">
        <div className="mb-4">
          <Select value={statusFilter} onValueChange={onStatusFilterChange}>
            <SelectTrigger className="w-full">
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {tickets.length === 0 ? (
            <div className="col-span-full text-center py-8 text-gray-500">
              <Icon name="Inbox" size={48} className="mx-auto mb-2 opacity-50" />
              <p>У вас пока нет тикетов</p>
            </div>
          ) : (
            tickets.map(ticket => (
              <TicketCard
                key={ticket.id}
                ticket={ticket}
                user={user}
                managers={[]}
                onUpdateStatus={() => {}}
                onOpenDialog={handleOpenDialog}
                getPriorityColor={getPriorityColor}
                getStatusColor={getStatusColor}
              />
            ))
          )}
        </div>
      </CardContent>
    </Card>
    </>
  );
});

export default MyTickets;