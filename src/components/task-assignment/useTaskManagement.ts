import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { API_URL, UPLOAD_URL, uploadFile } from '../tasks/taskUtils';
import { API_ENDPOINTS } from '@/config/api';

interface User {
  id: number;
  full_name: string;
  role: string;
}

interface Task {
  id: number;
  title: string;
  description: string;
  assigned_to: number;
  assigned_name?: string;
  assignee_name?: string;
  deadline: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'deleted';
  created_at: string;
  created_by_name?: string;
  creator_name?: string;
  attachment_url?: string;
  attachment_name?: string;
  attachment_size?: number;
  completion_report?: string;
  completion_attachment_url?: string;
  completion_attachment_name?: string;
  completion_attachment_size?: number;
}

export function useTaskManagement(managers: User[]) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    assigned_to: [] as number[],
    deadline: '',
    priority: 'medium'
  });
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    assigned_to: [] as number[],
    deadline: '',
    priority: 'medium'
  });
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCompletionDialogOpen, setIsCompletionDialogOpen] = useState(false);
  const [completingTaskId, setCompletingTaskId] = useState<number | null>(null);
  const [completionReport, setCompletionReport] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [showDeleted, setShowDeleted] = useState(false);
  const { toast } = useToast();

  const loadTasks = async () => {
    try {
      const token = localStorage.getItem('auth_token') || 'director-token';
      const userId = localStorage.getItem('user_id') || '1';
      
      const url = showDeleted ? `${API_URL}?show_deleted=true` : API_URL;
      const response = await fetch(url, {
        headers: {
          'X-User-Id': userId,
          'X-Auth-Token': token
        }
      });
      const data = await response.json();
      const normalizedTasks = (data.tasks || []).map((task: any) => ({
        ...task,
        assigned_name: task.assignee_name || task.assigned_name,
        created_by_name: task.creator_name || task.created_by_name
      }));
      setTasks(normalizedTasks);
    } catch (error) {
      console.error('Failed to load tasks:', error);
    }
  };

  const createTask = async () => {
    if (!newTask.title) {
      toast({ title: '❌ Заполните название задачи', variant: 'destructive' });
      return;
    }

    try {
      setUploading(true);
      let fileData = {};
      
      if (selectedFile) {
        if (selectedFile.size > 10 * 1024 * 1024) {
          toast({ title: '❌ Файл слишком большой', description: 'Максимум 10 МБ', variant: 'destructive' });
          setUploading(false);
          return;
        }
        
        const uploaded = await uploadFile(selectedFile, UPLOAD_URL);
        fileData = {
          attachment_url: uploaded.url,
          attachment_name: uploaded.name,
          attachment_size: uploaded.size
        };
      }
      
      const token = localStorage.getItem('auth_token') || 'director-token';
      const userId = localStorage.getItem('user_id') || '1';
      
      const count = newTask.assigned_to.length || 0;
      let successCount = 0;
      
      if (count === 0) {
        const response = await fetch(API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-User-Id': userId,
            'X-Auth-Token': token
          },
          body: JSON.stringify({
            title: newTask.title,
            description: newTask.description,
            priority: newTask.priority,
            deadline: newTask.deadline || null,
            assigned_to: null,
            ticket_id: null
          })
        });
        
        if (response.ok) {
          successCount = 1;
        }
      } else {
        for (const managerId of newTask.assigned_to) {
          try {
            const response = await fetch(API_URL, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'X-User-Id': userId,
                'X-Auth-Token': token
              },
              body: JSON.stringify({
                title: newTask.title,
                description: newTask.description,
                priority: newTask.priority,
                deadline: newTask.deadline || null,
                assigned_to: managerId,
                ticket_id: null
              })
            });
            
            if (response.ok) {
              successCount++;
              
              if (newTask.deadline) {
                try {
                  await fetch(API_ENDPOINTS.MESSAGES, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      sender_id: parseInt(userId),
                      receiver_id: managerId,
                      message: `📋 Новая задача: "${newTask.title}"\n\n${newTask.description}${newTask.deadline ? `\n\nСрок: ${new Date(newTask.deadline).toLocaleDateString('ru-RU')}` : ''}\nПриоритет: ${newTask.priority === 'low' ? 'Низкий' : newTask.priority === 'medium' ? 'Средний' : newTask.priority === 'high' ? 'Высокий' : 'Срочный'}`,
                      is_from_boss: true
                    })
                  });
                } catch (error) {
                  console.error('Failed to send notification:', error);
                }
              }
            }
          } catch (error) {
            console.error('Failed to create task for manager:', managerId, error);
          }
        }
      }
      
      if (successCount > 0) {
        toast({ title: `✅ Создано задач: ${successCount}${count > 0 ? ` для ${count} ${count === 1 ? 'менеджера' : 'менеджеров'}` : ''}` });
        setNewTask({ title: '', description: '', assigned_to: [], deadline: '', priority: 'medium' });
        setSelectedFile(null);
        loadTasks();
      } else {
        toast({ title: '❌ Не удалось создать задачу', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: '❌ Ошибка создания задачи', variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const updateTaskStatus = async (taskId: number, status: string) => {
    try {
      const token = localStorage.getItem('auth_token') || 'director-token';
      const userId = localStorage.getItem('user_id') || '1';
      
      const response = await fetch(API_URL, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': userId,
          'X-Auth-Token': token
        },
        body: JSON.stringify({ task_id: taskId, status })
      });

      if (response.ok) {
        toast({ title: '✅ Статус обновлён' });
        loadTasks();
      }
    } catch (error) {
      toast({ title: '❌ Ошибка обновления статуса', variant: 'destructive' });
    }
  };

  const deleteTask = async (taskId: number) => {
    if (!confirm('Переместить задачу в удалённые?')) return;

    try {
      const token = localStorage.getItem('auth_token') || 'director-token';
      const userId = localStorage.getItem('user_id') || '1';
      
      const response = await fetch(API_URL, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': userId,
          'X-Auth-Token': token
        },
        body: JSON.stringify({ task_id: taskId, status: 'deleted' })
      });

      if (response.ok) {
        toast({ title: '✅ Задача перемещена в удалённые' });
        loadTasks();
      }
    } catch (error) {
      toast({ title: '❌ Ошибка удаления задачи', variant: 'destructive' });
    }
  };

  const restoreTask = async (taskId: number) => {
    try {
      const token = localStorage.getItem('auth_token') || 'director-token';
      const userId = localStorage.getItem('user_id') || '1';
      
      const response = await fetch(API_URL, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': userId,
          'X-Auth-Token': token
        },
        body: JSON.stringify({ task_id: taskId, status: 'pending' })
      });

      if (response.ok) {
        toast({ title: '✅ Задача восстановлена' });
        loadTasks();
      }
    } catch (error) {
      toast({ title: '❌ Ошибка восстановления задачи', variant: 'destructive' });
    }
  };

  const permanentDeleteTask = async (taskId: number) => {
    if (!confirm('Удалить задачу навсегда? Это действие нельзя отменить!')) return;

    try {
      const token = localStorage.getItem('auth_token') || 'director-token';
      const userId = localStorage.getItem('user_id') || '1';
      
      const response = await fetch(API_URL, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': userId,
          'X-Auth-Token': token
        },
        body: JSON.stringify({ task_id: taskId })
      });

      if (response.ok) {
        toast({ title: '✅ Задача удалена навсегда' });
        loadTasks();
      }
    } catch (error) {
      toast({ title: '❌ Ошибка удаления задачи', variant: 'destructive' });
    }
  };

  const openEditDialog = (task: Task) => {
    setEditingTask(task);
    setEditForm({
      title: task.title,
      description: task.description,
      assigned_to: [task.assigned_to],
      deadline: task.deadline,
      priority: task.priority
    });
    setIsEditDialogOpen(true);
  };

  const updateTask = async () => {
    if (!editingTask) return;

    try {
      const token = localStorage.getItem('auth_token') || 'director-token';
      const userId = localStorage.getItem('user_id') || '1';
      
      const response = await fetch(API_URL, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': userId,
          'X-Auth-Token': token
        },
        body: JSON.stringify({
          task_id: editingTask.id,
          title: editForm.title,
          description: editForm.description,
          priority: editForm.priority,
          deadline: editForm.deadline,
          assigned_to: editForm.assigned_to[0] || null
        })
      });

      if (response.ok) {
        toast({ title: '✅ Задача обновлена' });
        setIsEditDialogOpen(false);
        loadTasks();
      }
    } catch (error) {
      toast({ title: '❌ Ошибка обновления задачи', variant: 'destructive' });
    }
  };

  const openCompletionDialog = (taskId: number) => {
    setCompletingTaskId(taskId);
    setIsCompletionDialogOpen(true);
  };

  const completeTask = async () => {
    if (!completingTaskId) return;

    try {
      const token = localStorage.getItem('auth_token') || 'director-token';
      const userId = localStorage.getItem('user_id') || '1';
      
      const response = await fetch(API_URL, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': userId,
          'X-Auth-Token': token
        },
        body: JSON.stringify({
          task_id: completingTaskId,
          status: 'completed',
          completion_report: completionReport
        })
      });

      if (response.ok) {
        toast({ title: '✅ Задача завершена' });
        setIsCompletionDialogOpen(false);
        setCompletionReport('');
        loadTasks();
      }
    } catch (error) {
      toast({ title: '❌ Ошибка завершения задачи', variant: 'destructive' });
    }
  };

  const toggleManager = (managerId: number, isEdit: boolean) => {
    if (isEdit) {
      setEditForm(prev => ({
        ...prev,
        assigned_to: prev.assigned_to.includes(managerId)
          ? prev.assigned_to.filter(id => id !== managerId)
          : [...prev.assigned_to, managerId]
      }));
    } else {
      setNewTask(prev => ({
        ...prev,
        assigned_to: prev.assigned_to.includes(managerId)
          ? prev.assigned_to.filter(id => id !== managerId)
          : [...prev.assigned_to, managerId]
      }));
    }
  };

  const getManagerTaskCount = (managerId: number): number => {
    return tasks.filter(t => t.assigned_to === managerId && t.status !== 'completed').length;
  };

  return {
    tasks,
    newTask,
    editForm,
    isEditDialogOpen,
    isCompletionDialogOpen,
    completionReport,
    selectedFile,
    uploading,
    showDeleted,
    setShowDeleted,
    setNewTask,
    setEditForm,
    setIsEditDialogOpen,
    setIsCompletionDialogOpen,
    setCompletionReport,
    setSelectedFile,
    loadTasks,
    createTask,
    updateTaskStatus,
    deleteTask,
    restoreTask,
    permanentDeleteTask,
    openEditDialog,
    updateTask,
    openCompletionDialog,
    completeTask,
    toggleManager,
    getManagerTaskCount
  };
}