import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { createNotification } from '@/hooks/useNotifications';

const API_URL = 'https://functions.poehali.dev';

export interface Task {
  id: number;
  title: string;
  description: string;
  priority: string;
  status: string;
  created_by: number;
  assigned_to: number | null;
  deadline: string;
  ticket_id: number | null;
  created_at: string;
  completed_at: string | null;
  assignee_name?: string;
  creator_name?: string;
  ticket_title?: string;
}

export interface CreateTaskData {
  title: string;
  description: string;
  priority: string;
  assigned_to: number | null;
  deadline: string;
  ticket_id: number | null;
}

export const useTasks = (user: any, ticketId?: number) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);

  const loadTasks = useCallback(async () => {
    if (!user?.token) return;

    setLoading(true);
    try {
      const url = ticketId 
        ? `${API_URL}/13e06494-4f4d-4854-b126-bbc191bf0890?ticket_id=${ticketId}`
        : `${API_URL}/13e06494-4f4d-4854-b126-bbc191bf0890`;

      const response = await fetch(url, {
        headers: {
          'X-User-Id': user.id.toString(),
          'X-Auth-Token': user.token,
        },
      });

      if (!response.ok) throw new Error('Ошибка загрузки задач');

      const data = await response.json();
      setTasks(data.tasks || []);
    } catch (error) {
      console.error('Error loading tasks:', error);
      toast.error('Не удалось загрузить задачи');
    } finally {
      setLoading(false);
    }
  }, [user?.token, user?.id, ticketId]);

  const createTask = useCallback(async (taskData: CreateTaskData) => {
    if (!user?.token) {
      console.error('No user token available');
      return false;
    }

    try {
      const requestBody = {
        ...taskData,
        created_by: user.id,
      };
      
      console.log('Creating task:', requestBody);

      const response = await fetch(`${API_URL}/13e06494-4f4d-4854-b126-bbc191bf0890`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': user.id.toString(),
          'X-Auth-Token': user.token,
        },
        body: JSON.stringify(requestBody),
      });

      console.log('Task creation response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error creating task:', errorData);
        toast.error(errorData.error || 'Не удалось создать задачу');
        return false;
      }

      toast.success('Задача создана');
      
      // Notify directors about new task assigned to manager
      if (taskData.assigned_to) {
        try {
          const priorityEmoji = taskData.priority === 'urgent' ? '🚨' : taskData.priority === 'high' ? '⚡' : '📋';
          await createNotification({
            title: `${priorityEmoji} Новая задача назначена`,
            message: `Задача "${taskData.title}" назначена менеджеру. Дедлайн: ${taskData.deadline}`,
            type: 'task_assigned',
            related_entity_type: 'task',
            related_entity_id: taskData.assigned_to
          });
        } catch (notifError) {
          console.error('Failed to create notification:', notifError);
        }
      }
      
      await loadTasks();
      return true;
    } catch (error) {
      console.error('Exception creating task:', error);
      toast.error('Не удалось создать задачу');
      return false;
    }
  }, [user, loadTasks]);

  const updateTaskStatus = useCallback(async (taskId: number, status: string) => {
    if (!user?.token) return false;

    try {
      const response = await fetch(`${API_URL}/13e06494-4f4d-4854-b126-bbc191bf0890`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': user.id.toString(),
          'X-Auth-Token': user.token,
        },
        body: JSON.stringify({
          task_id: taskId,
          status,
        }),
      });

      if (!response.ok) throw new Error('Ошибка обновления статуса');

      toast.success('Статус задачи обновлен');
      await loadTasks();
      return true;
    } catch (error) {
      console.error('Error updating task status:', error);
      toast.error('Не удалось обновить статус');
      return false;
    }
  }, [user, loadTasks]);

  const deleteTask = useCallback(async (taskId: number) => {
    if (!user?.token) return false;

    try {
      const response = await fetch(`${API_URL}/13e06494-4f4d-4854-b126-bbc191bf0890?task_id=${taskId}`, {
        method: 'DELETE',
        headers: {
          'X-User-Id': user.id.toString(),
          'X-Auth-Token': user.token,
        },
      });

      if (!response.ok) throw new Error('Ошибка удаления задачи');

      toast.success('Задача удалена');
      await loadTasks();
      return true;
    } catch (error) {
      console.error('Error deleting task:', error);
      toast.error('Не удалось удалить задачу');
      return false;
    }
  }, [user, loadTasks]);

  useEffect(() => {
    if (user?.token) {
      loadTasks();
    }
  }, [user?.token, loadTasks]);

  return {
    tasks,
    loading,
    loadTasks,
    createTask,
    updateTaskStatus,
    deleteTask,
  };
};