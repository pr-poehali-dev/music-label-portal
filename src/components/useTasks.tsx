import { useState, useEffect, useCallback, useMemo } from 'react';
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
  attachment_url?: string;
  attachment_name?: string;
  attachment_size?: number;
  completion_report?: string;
  completion_attachment_url?: string;
  completion_attachment_name?: string;
  completion_attachment_size?: number;
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
  const [showDeleted, setShowDeleted] = useState(false);

  const loadTasks = useCallback(async () => {
    if (!user?.id) {
      return;
    }

    setLoading(true);
    try {
      let url = ticketId 
        ? `${API_URL}/13e06494-4f4d-4854-b126-bbc191bf0890?ticket_id=${ticketId}`
        : `${API_URL}/13e06494-4f4d-4854-b126-bbc191bf0890`;
      
      if (showDeleted) {
        url += ticketId ? '&show_deleted=true' : '?show_deleted=true';
      }

      const response = await fetch(url, {
        headers: {
          'X-User-Id': user.id.toString(),
        },
      });

      if (!response.ok) {
        const errorText = await response.text();

        throw new Error('Ошибка загрузки задач');
      }

      const data = await response.json();
      setTasks(data.tasks || []);
    } catch (error) {
      toast.error('Не удалось загрузить задачи');
    } finally {
      setLoading(false);
    }
  }, [user?.id, ticketId, showDeleted]);

  const createTask = useCallback(async (taskData: CreateTaskData) => {
    if (!user?.id) {
      return false;
    }

    try {
      const requestBody = {
        ...taskData,
        created_by: user.id,
      };
      


      const response = await fetch(`${API_URL}/13e06494-4f4d-4854-b126-bbc191bf0890`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': user.id.toString(),
        },
        body: JSON.stringify(requestBody),
      });



      if (!response.ok) {
        const errorData = await response.json();

        toast.error(errorData.error || 'Не удалось создать задачу');
        return false;
      }

      toast.success('Задача создана');
      
      // Notify assigned manager and directors about new task
      if (taskData.assigned_to) {
        try {
          const priorityEmoji = taskData.priority === 'urgent' ? '🚨' : taskData.priority === 'high' ? '⚡' : '📋';
          
          // Notify the assigned manager
          await createNotification({
            title: `${priorityEmoji} Вам назначена задача`,
            message: `Задача "${taskData.title}". Дедлайн: ${new Date(taskData.deadline).toLocaleString('ru-RU')}`,
            type: 'task_assigned',
            related_entity_type: 'task',
            related_entity_id: taskData.assigned_to,
            user_ids: [taskData.assigned_to],
            notify_directors: true
          });
        } catch (notifError) {
          // Silently fail notification
        }
      }
      
      await loadTasks();
      return true;
    } catch (error) {
      toast.error('Не удалось создать задачу');
      return false;
    }
  }, [user, loadTasks]);

  const updateTaskStatus = useCallback(async (
    taskId: number, 
    status: string, 
    completionReport?: string,
    completionFile?: File
  ) => {
    if (!user?.id) return false;

    try {
      let completionAttachmentUrl;
      let completionAttachmentName;
      let completionAttachmentSize;

      // Upload file if provided
      if (completionFile) {
        // Convert file to base64
        const reader = new FileReader();
        const fileBase64 = await new Promise<string>((resolve, reject) => {
          reader.onload = () => {
            const base64 = reader.result as string;
            resolve(base64.split(',')[1]); // Remove data:mime;base64, prefix
          };
          reader.onerror = reject;
          reader.readAsDataURL(completionFile);
        });

        const uploadResponse = await fetch(`${API_URL}/08bf9d4e-6ddc-4b6b-91a0-84187cbd89fa`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-User-Id': user.id.toString(),
          },
          body: JSON.stringify({
            file: fileBase64,
            fileName: completionFile.name,
            fileSize: completionFile.size,
          }),
        });

        if (!uploadResponse.ok) throw new Error('Ошибка загрузки файла');

        const uploadData = await uploadResponse.json();
        completionAttachmentUrl = uploadData.url;
        completionAttachmentName = completionFile.name;
        completionAttachmentSize = completionFile.size;
      }

      const response = await fetch(`${API_URL}/13e06494-4f4d-4854-b126-bbc191bf0890`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': user.id.toString(),
        },
        body: JSON.stringify({
          task_id: taskId,
          status,
          completion_report: completionReport,
          completion_attachment_url: completionAttachmentUrl,
          completion_attachment_name: completionAttachmentName,
          completion_attachment_size: completionAttachmentSize,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ошибка обновления статуса');
      }

      toast.success('Статус задачи обновлен');
      await loadTasks();
      return true;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Не удалось обновить статус');
      return false;
    }
  }, [user, loadTasks]);

  const deleteTask = useCallback(async (taskId: number) => {
    if (!user?.id) return false;

    try {
      const response = await fetch(`${API_URL}/13e06494-4f4d-4854-b126-bbc191bf0890?task_id=${taskId}`, {
        method: 'DELETE',
        headers: {
          'X-User-Id': user.id.toString(),
        },
      });

      if (!response.ok) throw new Error('Ошибка удаления задачи');

      toast.success('Задача удалена');
      await loadTasks();
      return true;
    } catch (error) {
      toast.error('Не удалось удалить задачу');
      return false;
    }
  }, [user, loadTasks]);

  useEffect(() => {
    if (user?.id) {
      loadTasks();
    }
  }, [user?.id, loadTasks]);

  const memoizedValue = useMemo(() => ({
    tasks,
    loading,
    loadTasks,
    createTask,
    updateTaskStatus,
    deleteTask,
    showDeleted,
    setShowDeleted,
  }), [tasks, loading, loadTasks, createTask, updateTaskStatus, deleteTask, showDeleted]);

  return memoizedValue;
};