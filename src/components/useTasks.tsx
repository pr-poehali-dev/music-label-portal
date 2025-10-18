import { useState, useEffect } from 'react';
import { toast } from 'sonner';

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

  const loadTasks = async () => {
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
  };

  const createTask = async (taskData: CreateTaskData) => {
    if (!user?.token) return false;

    try {
      const response = await fetch(`${API_URL}/13e06494-4f4d-4854-b126-bbc191bf0890`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': user.id.toString(),
          'X-Auth-Token': user.token,
        },
        body: JSON.stringify({
          ...taskData,
          created_by: user.id,
        }),
      });

      if (!response.ok) throw new Error('Ошибка создания задачи');

      toast.success('Задача создана');
      await loadTasks();
      return true;
    } catch (error) {
      console.error('Error creating task:', error);
      toast.error('Не удалось создать задачу');
      return false;
    }
  };

  const updateTaskStatus = async (taskId: number, status: string) => {
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
  };

  const deleteTask = async (taskId: number) => {
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
  };

  useEffect(() => {
    if (user?.token) {
      loadTasks();
    }
  }, [user, ticketId]);

  return {
    tasks,
    loading,
    loadTasks,
    createTask,
    updateTaskStatus,
    deleteTask,
  };
};