import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { logActivity } from '@/utils/activityLogger';
import { User, Ticket, NewTicket, API_URLS } from '@/types';
import { createNotification } from '@/hooks/useNotifications';

export const useTickets = (user: User | null, statusFilter: string) => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const { toast } = useToast();

  const loadTickets = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (user?.role === 'artist') params.append('user_id', String(user.id));
      
      const response = await fetch(`${API_URLS.tickets}?${params}`);
      const data = await response.json();
      setTickets(data.tickets || []);
    } catch (error) {
      console.error('Failed to load tickets:', error);
    }
  }, [user, statusFilter]);

  const createTicket = useCallback(async (
    newTicket: NewTicket,
    selectedFile: File | null,
    setUploadingTicket: (uploading: boolean) => void
  ) => {
    if (!newTicket.title || !newTicket.description || !user) return false;
    
    setUploadingTicket(true);
    try {
      let attachmentUrl = null;
      let attachmentName = null;
      let attachmentSize = null;

      if (selectedFile) {
        const formData = new FormData();
        formData.append('file', selectedFile);

        const uploadResponse = await fetch(API_URLS.uploadFile, {
          method: 'POST',
          body: formData
        });

        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json();
          attachmentUrl = uploadData.url;
          attachmentName = selectedFile.name;
          attachmentSize = selectedFile.size;
        }
      }

      const requestBody = { 
        ...newTicket, 
        created_by: user.id,
        attachment_url: attachmentUrl,
        attachment_name: attachmentName,
        attachment_size: attachmentSize
      };
      
      console.log('Creating ticket:', requestBody);

      const response = await fetch(API_URLS.tickets, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });
      
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error creating ticket:', errorData);
        toast({ title: '❌ ' + (errorData.error || 'Ошибка создания тикета'), variant: 'destructive' });
        return false;
      }
      
      logActivity(user.id, 'create_ticket', `Создан тикет: ${newTicket.title}`, { priority: newTicket.priority });
      toast({ title: '✅ Тикет создан' });
      
      // Notify directors about urgent tickets
      if (newTicket.priority === 'urgent' || newTicket.priority === 'high') {
        try {
          const priorityLabel = newTicket.priority === 'urgent' ? 'срочный' : 'высокоприоритетный';
          await createNotification({
            title: `🚨 ${priorityLabel.toUpperCase()} тикет`,
            message: `${user.full_name} создал ${priorityLabel} тикет: "${newTicket.title}"`,
            type: 'urgent_ticket',
            related_entity_type: 'ticket',
            related_entity_id: user.id
          });
        } catch (notifError) {
          console.error('Failed to create notification:', notifError);
        }
      }
      
      loadTickets();
      return true;
    } catch (error) {
      console.error('Exception creating ticket:', error);
      toast({ title: '❌ Ошибка создания тикета', variant: 'destructive' });
    } finally {
      setUploadingTicket(false);
    }
    return false;
  }, [user, toast, loadTickets]);

  const updateTicketStatus = useCallback(async (ticketId: number, status: string) => {
    try {
      await fetch(API_URLS.tickets, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: ticketId, status })
      });
      
      if (user) {
        logActivity(user.id, 'update_ticket_status', `Обновлён статус тикета #${ticketId} на ${status}`, { ticketId, status });
      }
      toast({ title: '✅ Статус обновлен' });
      loadTickets();
    } catch (error) {
      toast({ title: '❌ Ошибка обновления', variant: 'destructive' });
    }
  }, [user, toast, loadTickets]);

  const assignTicket = useCallback(async (ticketId: number, managerId: number | null, deadline?: string) => {
    try {
      const response = await fetch(API_URLS.tickets, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: ticketId, assigned_to: managerId, deadline })
      });
      
      if (user) {
        logActivity(user.id, 'assign_ticket', `Назначен тикет #${ticketId}`, { ticketId, managerId, deadline });
      }
      
      // Send notification to assigned manager
      if (managerId && response.ok) {
        try {
          const ticketData = await response.json();
          const { createNotification } = await import('@/hooks/useNotifications');
          await createNotification({
            title: '📋 Вам назначен тикет',
            message: `Тикет #${ticketId}${deadline ? '. Дедлайн: ' + new Date(deadline).toLocaleString('ru-RU') : ''}`,
            type: 'ticket_assigned',
            related_entity_type: 'ticket',
            related_entity_id: ticketId,
            user_ids: [managerId],
            notify_directors: true
          });
        } catch (notifError) {
          console.error('Failed to create notification:', notifError);
        }
      }
      
      toast({ title: '✅ Тикет назначен' });
      loadTickets();
    } catch (error) {
      toast({ title: '❌ Ошибка назначения', variant: 'destructive' });
    }
  }, [user, toast, loadTickets]);

  const deleteTicket = useCallback(async (ticketId: number) => {
    if (!confirm('Вы уверены, что хотите удалить этот тикет?')) return;
    
    try {
      const response = await fetch(API_URLS.tickets, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: ticketId })
      });
      
      if (response.ok) {
        if (user) {
          logActivity(user.id, 'delete_ticket', `Удалён тикет #${ticketId}`, { ticketId });
        }
        toast({ title: '✅ Тикет удалён' });
        loadTickets();
      } else {
        toast({ title: '❌ Ошибка удаления', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: '❌ Ошибка удаления', variant: 'destructive' });
    }
  }, [user, toast, loadTickets]);

  useEffect(() => {
    if (user) {
      loadTickets();
    }
  }, [user, loadTickets]);

  return {
    tickets,
    loadTickets,
    createTicket,
    updateTicketStatus,
    assignTicket,
    deleteTicket
  };
};